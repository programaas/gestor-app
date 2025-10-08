
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { firestore } from '../firebase';
import { 
    collection, 
    getDocs, 
    getDoc,
    doc, 
    writeBatch, 
    deleteDoc, 
    serverTimestamp, 
    Timestamp,
    runTransaction,
    type FirestoreDataConverter
} from 'firebase/firestore';

import {
    Customer, Sale, Purchase, Product, Supplier, CustomerPayment, PaymentMethod
} from './types';

// --- Tipos para as operações ---
interface SaleItem {
    productId: string;
    quantity: number;
    unitPrice: number;
    productName?: string;
    profit?: number;
}

// --- CONVERSORES DE DADOS DO FIRESTORE ---

const customerConverter: FirestoreDataConverter<Customer> = {
    toFirestore: (customer) => {
        const { id, ...data } = customer;
        return data;
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return { id: snapshot.id, ...data } as unknown as Customer;
    }
};

const saleConverter: FirestoreDataConverter<Sale> = {
    toFirestore: (sale) => {
        const { id, ...data } = sale;
        return data;
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : new Date().toISOString();
        const totalProfit = typeof data.totalProfit === 'number' ? data.totalProfit : 0;
        return { id: snapshot.id, ...data, date, totalProfit } as unknown as Sale;
    }
};

const productConverter: FirestoreDataConverter<Product> = {
    toFirestore: (product) => {
        const { id, ...data } = product;
        return data;
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return { id: snapshot.id, ...data } as unknown as Product;
    }
};

const supplierConverter: FirestoreDataConverter<Supplier> = {
    toFirestore: (supplier) => {
        const { id, ...data } = supplier;
        return data;
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return { id: snapshot.id, ...data } as unknown as Supplier;
    }
};

const purchaseConverter: FirestoreDataConverter<Purchase> = {
    toFirestore: (purchase) => {
        const { id, ...data } = purchase;
        return data;
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : new Date().toISOString();
        return { id: snapshot.id, ...data, date } as unknown as Purchase;
    }
};

const customerPaymentConverter: FirestoreDataConverter<CustomerPayment> = {
    toFirestore: (payment) => {
        const { id, ...data } = payment;
        return data;
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : new Date().toISOString();
        return { id: snapshot.id, ...data, date } as unknown as CustomerPayment;
    }
};

// --- INTERFACE DO CONTEXTO ---

interface AppContextProps {
    customers: Customer[];
    suppliers: Supplier[];
    products: Product[];
    sales: Sale[];
    purchases: Purchase[];
    customerPayments: CustomerPayment[];
    expenses?: any[];
    cashTransactions?: any[];
    isLoading: boolean;
    addCustomer: (name: string) => Promise<void>;
    updateCustomer: (id: string, name: string) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    addSupplier: (name: string) => Promise<void>;
    updateSupplier: (id: string, name: string) => Promise<void>;
    deleteSupplier: (id: string) => Promise<void>;
    addSale: (customerId: string, saleItems: SaleItem[]) => Promise<void>;
    deleteSale: (saleId: string) => Promise<void>;
    addPurchase: (supplierId: string, productId: string, quantity: number, unitPrice: number, category: string) => Promise<void>;
    updatePurchase?: (purchaseId: string, supplierId: string, productId: string, quantity: number, unitPrice: number) => Promise<void>;
    deletePurchase?: (purchaseId: string) => Promise<void>;
    addCustomerPayment: (customerId: string, amount: number, method: PaymentMethod, allocations: { supplierId: string, amount: number }[], cashAmount?: number) => Promise<void>;
    addExpense?: (description: string, amount: number, date: string, paidFrom: any, affectsProfit?: boolean, customerId?: string) => Promise<void>;
    deleteExpense?: (expenseId: string) => Promise<void>;
    paySupplierFromCash?: (supplierId: string, amount: number) => Promise<void>;
    addCashWithdrawal?: (amount: number, description?: string, affectsProfit?: boolean) => Promise<void>;
    updateProduct: (id: string, name: string, averageCost: number, quantity: number, category: string) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [cashTransactions, setCashTransactions] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const getCollection = async <T,>(name: string, converter: FirestoreDataConverter<T>) => {
                const snapshot = await getDocs(collection(firestore, name).withConverter(converter));
                return snapshot.docs.map(doc => doc.data());
            };

            const [customersData, suppliersData, productsData, salesData, purchasesData, paymentsData, expensesData, cashData] = await Promise.all([
                getCollection('customers', customerConverter),
                getCollection('suppliers', supplierConverter),
                getCollection('products', productConverter),
                getCollection('sales', saleConverter),
                getCollection('purchases', purchaseConverter),
                getCollection('customerPayments', customerPaymentConverter),
                getDocs(collection(firestore, 'expenses')).then(s => s.docs.map(d => ({ id: d.id, ...d.data(), date: (d.data().date instanceof Timestamp ? d.data().date.toDate().toISOString() : d.data().date) || new Date().toISOString() }))),
                getDocs(collection(firestore, 'cashTransactions')).then(s => s.docs.map(d => ({ id: d.id, ...d.data(), date: (d.data().date instanceof Timestamp ? d.data().date.toDate().toISOString() : d.data().date) || new Date().toISOString() }))),
            ]);

            setCustomers(customersData);
            setSuppliers(suppliersData);
            setProducts(productsData);
            setSales(salesData);
            setPurchases(purchasesData);
            setCustomerPayments(paymentsData);
            setExpenses(expensesData);
            setCashTransactions(cashData);

        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addCustomer = async (name: string) => {
        const newCustomer: Omit<Customer, 'id'> = { name, balance: 0 };
        const ref = doc(collection(firestore, 'customers').withConverter(customerConverter));
        await writeBatch(firestore).set(ref, newCustomer).commit();
        fetchData();
    };
    
    const addSupplier = async (name: string) => {
        const batch = writeBatch(firestore);
        const newSupplierRef = doc(collection(firestore, 'suppliers'));
        batch.set(newSupplierRef, { name, balance: 0 });
        await batch.commit();
        fetchData();
    };

    const addSale = async (customerId: string, saleItems: SaleItem[]) => {
        await runTransaction(firestore, async (transaction) => {
            const itemsEnriched = await Promise.all(saleItems.map(async (item) => {
                const pRef = doc(firestore, 'products', item.productId).withConverter(productConverter);
                const pDoc = await transaction.get(pRef);
                if (!pDoc.exists()) throw new Error('Produto não encontrado');
                const p = pDoc.data();
                return { ...item, productName: p.name, profit: (item.unitPrice - (p.averageCost || 0)) * item.quantity } as SaleItem;
            }));
            const totalAmount = itemsEnriched.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
            const totalProfit = itemsEnriched.reduce((s, i) => s + (i.profit || 0), 0);
            const saleRef = doc(collection(firestore, 'sales'));
            transaction.set(saleRef, { customerId, products: itemsEnriched, totalAmount, totalProfit, date: serverTimestamp() });

            const customerRef = doc(firestore, 'customers', customerId).withConverter(customerConverter);
            const customerDoc = await transaction.get(customerRef);
            if (!customerDoc.exists()) throw new Error('Cliente não encontrado');
            transaction.update(customerRef, { balance: (customerDoc.data().balance || 0) + totalAmount });

            for (const item of itemsEnriched) {
                const pRef = doc(firestore, 'products', item.productId).withConverter(productConverter);
                const pDoc = await transaction.get(pRef);
                const newQuantity = (pDoc.data().quantity || 0) - item.quantity;
                if (newQuantity < 0) throw new Error(`Estoque insuficiente para ${pDoc.data().name}`);
                transaction.update(pRef, { quantity: newQuantity });
            }
        });
        await fetchData();
    };
    
    const deleteSale = async (saleId: string) => {
        await runTransaction(firestore, async (transaction) => {
            const saleRef = doc(firestore, 'sales', saleId).withConverter(saleConverter);
            const saleDoc = await transaction.get(saleRef);

            if (!saleDoc.exists()) throw new Error("Venda não encontrada!");
            const saleData = saleDoc.data();

            transaction.delete(saleRef);

            const customerRef = doc(firestore, 'customers', saleData.customerId).withConverter(customerConverter);
            const customerDoc = await transaction.get(customerRef);
            if (customerDoc.exists()) {
                const newBalance = (customerDoc.data().balance || 0) - saleData.totalAmount;
                transaction.update(customerRef, { balance: newBalance });
            }

            for (const item of saleData.products) {
                const productRef = doc(firestore, 'products', item.productId).withConverter(productConverter);
                const productDoc = await transaction.get(productRef);
                if (productDoc.exists()) {
                    const newQuantity = (productDoc.data().quantity || 0) + item.quantity;
                    transaction.update(productRef, { quantity: newQuantity });
                }
            }
        });
        await fetchData();
    };

    const addPurchase = async (supplierId: string, productId: string, quantity: number, unitPrice: number, category: string) => {
        const batch = writeBatch(firestore);
        const purchaseRef = doc(collection(firestore, 'purchases'));

        // Se productId vier vazio, cria um novo produto com o nome em 'category'
        let productRef = productId ? doc(firestore, 'products', productId) : doc(collection(firestore, 'products'));
        const product = productId ? products.find(p => p.id === productId) : undefined;

        batch.set(purchaseRef, { supplierId, productId: productRef.id, quantity, unitPrice, date: serverTimestamp() });
        const supplierRef = doc(firestore, 'suppliers', supplierId);
        const supplier = suppliers.find(s => s.id === supplierId);

        if (product) {
            const newQuantity = product.quantity + quantity;
            const newAverageCost = ((product.averageCost * product.quantity) + (unitPrice * quantity)) / newQuantity;
            batch.update(productRef, { quantity: newQuantity, averageCost: newAverageCost });
        } else {
            batch.set(productRef, { name: category || 'Novo Produto', category, quantity, averageCost: unitPrice });
        }

        if (supplier) {
            batch.update(supplierRef, { balance: supplier.balance + (quantity * unitPrice) });
        }

        await batch.commit();
        fetchData();
    };

    const addCustomerPayment = async (customerId: string, amount: number, method: PaymentMethod, allocations: { supplierId: string, amount: number }[], cashAmount: number = 0) => {
        const batch = writeBatch(firestore);
        const paymentRef = doc(collection(firestore, 'customerPayments'));
        batch.set(paymentRef, { customerId, amount, method, allocatedTo: allocations, cashAmount, date: serverTimestamp() });

        const customerRef = doc(firestore, 'customers', customerId);
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            batch.update(customerRef, { balance: customer.balance - amount });
        }

        allocations.forEach(alloc => {
            const supplier = suppliers.find(s => s.id === alloc.supplierId);
            if (supplier) {
                const supplierRef = doc(firestore, 'suppliers', alloc.supplierId);
                batch.update(supplierRef, { balance: supplier.balance - alloc.amount });
            }
        });
        if (cashAmount && cashAmount > 0) {
            const cust = customers.find(c => c.id === customerId);
            const cashRef = doc(collection(firestore, 'cashTransactions'));
            batch.set(cashRef, { type: 'in', amount: cashAmount, date: serverTimestamp(), description: `Entrada de cliente: ${cust?.name || customerId}`, relatedCustomerPaymentId: paymentRef.id });
        }
        await batch.commit();
        fetchData();
    };

    const deletePurchase = async (purchaseId: string) => {
        const snap = await getDoc(doc(firestore, 'purchases', purchaseId));
        if (!snap.exists()) return;
        const p: any = snap.data();
        const batch = writeBatch(firestore);
        const prod = products.find(x => x.id === p.productId);
        if (prod) batch.update(doc(firestore, 'products', prod.id), { quantity: Math.max(0, prod.quantity - (p.quantity || 0)) });
        const sup = suppliers.find(s => s.id === p.supplierId);
        if (sup) batch.update(doc(firestore, 'suppliers', sup.id), { balance: Math.max(0, sup.balance - ((p.quantity || 0) * (p.unitPrice || 0))) });
        batch.delete(doc(firestore, 'purchases', purchaseId));
        await batch.commit();
        fetchData();
    };

    const updatePurchase = async (purchaseId: string, supplierId: string, productId: string, quantity: number, unitPrice: number) => {
        const snap = await getDoc(doc(firestore, 'purchases', purchaseId));
        if (!snap.exists()) return;
        const old: any = snap.data();
        const batch = writeBatch(firestore);
        // revert old
        const oldProd = products.find(p => p.id === old.productId);
        if (oldProd) batch.update(doc(firestore, 'products', oldProd.id), { quantity: Math.max(0, oldProd.quantity - (old.quantity || 0)) });
        const oldSup = suppliers.find(s => s.id === old.supplierId);
        if (oldSup) batch.update(doc(firestore, 'suppliers', oldSup.id), { balance: Math.max(0, oldSup.balance - ((old.quantity || 0) * (old.unitPrice || 0))) });
        // apply new
        batch.update(doc(firestore, 'purchases', purchaseId), { supplierId, productId, quantity, unitPrice });
        const newProd = products.find(p => p.id === productId);
        if (newProd) batch.update(doc(firestore, 'products', newProd.id), { quantity: newProd.quantity + quantity });
        const newSup = suppliers.find(s => s.id === supplierId);
        if (newSup) batch.update(doc(firestore, 'suppliers', newSup.id), { balance: newSup.balance + (quantity * unitPrice) });
        await batch.commit();
        fetchData();
    };
    
    const updateCustomer = async (id: string, name: string) => {
        const customerRef = doc(firestore, 'customers', id);
        await writeBatch(firestore).update(customerRef, { name }).commit();
        fetchData();
    };

    const deleteCustomer = async (id: string) => {
        await deleteDoc(doc(firestore, 'customers', id));
        fetchData();
    };

    const updateSupplier = async (id: string, name: string) => {
        const supplierRef = doc(firestore, 'suppliers', id);
        await writeBatch(firestore).update(supplierRef, { name }).commit();
        fetchData();
    };

    const deleteSupplier = async (id: string) => {
        await deleteDoc(doc(firestore, 'suppliers', id));
        fetchData();
    };

    const updateProduct = async (id: string, name: string, averageCost: number, quantity: number, category: string) => {
        const productRef = doc(firestore, 'products', id);
        await writeBatch(firestore).update(productRef, { name, averageCost, quantity, category }).commit();
        fetchData();
    };

    const deleteProduct = async (id: string) => {
        await deleteDoc(doc(firestore, 'products', id));
        fetchData();
    };

    // Despesas e Caixa
    const addExpense = async (description: string, amount: number, date: string, paidFrom: any, affectsProfit: boolean = true, customerId?: string) => {
        const batch = writeBatch(firestore);
        const expRef = doc(collection(firestore, 'expenses'));
        batch.set(expRef, { description, amount, paidFrom, affectsProfit, customerId: customerId || null, date: serverTimestamp() });
        if (String(paidFrom).toLowerCase().includes('caixa') || paidFrom === 'Caixa') {
            const cashRef = doc(collection(firestore, 'cashTransactions'));
            batch.set(cashRef, { type: 'out', amount, date: serverTimestamp(), description: 'Despesa', affectsProfit, relatedExpenseId: expRef.id });
        }
        if (customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                const customerRef = doc(firestore, 'customers', customerId);
                batch.update(customerRef, { balance: Math.max(0, customer.balance - amount) });
            }
        }
        await batch.commit();
        fetchData();
    };

    const deleteExpense = async (expenseId: string) => {
        const expRef = doc(firestore, 'expenses', expenseId);
        const expSnap = await getDoc(expRef);
        const batch = writeBatch(firestore);
        if (expSnap.exists()) {
            const exp: any = expSnap.data();
            if (String(exp.paidFrom || '').toLowerCase().includes('caixa') || exp.paidFrom === 'Caixa') {
                const cashRef = doc(collection(firestore, 'cashTransactions'));
                batch.set(cashRef, { type: 'in', amount: exp.amount, date: serverTimestamp(), description: 'Reversão de despesa', affectsProfit: exp.affectsProfit, relatedExpenseId: expenseId });
            }
            if (exp.customerId) {
                const customer = customers.find(c => c.id === exp.customerId);
                if (customer) {
                    const customerRef = doc(firestore, 'customers', exp.customerId);
                    batch.update(customerRef, { balance: customer.balance + exp.amount });
                }
            }
        }
        batch.delete(expRef);
        await batch.commit();
        fetchData();
    };

    const paySupplierFromCash = async (supplierId: string, amount: number) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return;
        const batch = writeBatch(firestore);
        const supplierRef = doc(firestore, 'suppliers', supplierId);
        batch.update(supplierRef, { balance: Math.max(0, supplier.balance - amount) });
        const cashRef = doc(collection(firestore, 'cashTransactions'));
        batch.set(cashRef, { type: 'out', amount, date: serverTimestamp(), description: `Pagamento a fornecedor: ${supplier.name}`, affectsProfit: false });
        await batch.commit();
        fetchData();
    };

    const addCashWithdrawal = async (amount: number, description: string = 'Saque', affectsProfit: boolean = true) => {
        const cashRef = doc(collection(firestore, 'cashTransactions'));
        await writeBatch(firestore).set(cashRef, { type: 'withdraw', amount, date: serverTimestamp(), description, affectsProfit }).commit();
        fetchData();
    };

    return (
        <AppContext.Provider value={{
            customers, suppliers, products, sales, purchases, customerPayments, expenses, cashTransactions, isLoading,
            addCustomer, updateCustomer, deleteCustomer, 
            addSupplier, updateSupplier, deleteSupplier, 
            addSale, deleteSale,
            addPurchase, updatePurchase, deletePurchase, addCustomerPayment,
            addExpense, deleteExpense, paySupplierFromCash, addCashWithdrawal,
            updateProduct, deleteProduct
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
