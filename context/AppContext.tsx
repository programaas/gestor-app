
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { firestore } from '../firebase';
import { 
    collection, 
    getDocs, 
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
    addCustomerPayment: (customerId: string, amount: number, method: PaymentMethod, allocations: { supplierId: string, amount: number }[]) => Promise<void>;
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

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const getCollection = async <T,>(name: string, converter: FirestoreDataConverter<T>) => {
                const snapshot = await getDocs(collection(firestore, name).withConverter(converter));
                return snapshot.docs.map(doc => doc.data());
            };

            const [customersData, suppliersData, productsData, salesData, purchasesData, paymentsData] = await Promise.all([
                getCollection('customers', customerConverter),
                getCollection('suppliers', supplierConverter),
                getCollection('products', productConverter),
                getCollection('sales', saleConverter),
                getCollection('purchases', purchaseConverter),
                getCollection('customerPayments', customerPaymentConverter)
            ]);

            setCustomers(customersData);
            setSuppliers(suppliersData);
            setProducts(productsData);
            setSales(salesData);
            setPurchases(purchasesData);
            setCustomerPayments(paymentsData);

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
            const totalAmount = saleItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
            const totalProfit = saleItems.reduce((sum, item) => sum + (item.profit || 0), 0);
            
            const saleRef = doc(collection(firestore, 'sales'));
            transaction.set(saleRef, {
                customerId,
                products: saleItems,
                totalAmount,
                totalProfit,
                date: serverTimestamp()
            });

            const customerRef = doc(firestore, 'customers', customerId).withConverter(customerConverter);
            const customerDoc = await transaction.get(customerRef);
            if (!customerDoc.exists()) throw new Error("Cliente não encontrado!");
            const newBalance = (customerDoc.data().balance || 0) + totalAmount;
            transaction.update(customerRef, { balance: newBalance });

            for (const item of saleItems) {
                const productRef = doc(firestore, 'products', item.productId).withConverter(productConverter);
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists()) throw new Error(`Produto ${item.productName} não encontrado!`);
                
                const currentQuantity = productDoc.data().quantity || 0;
                const newQuantity = currentQuantity - item.quantity;
                if (newQuantity < 0) {
                    throw new Error(`Estoque insuficiente para ${productDoc.data().name}`);
                }
                transaction.update(productRef, { quantity: newQuantity });
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
        batch.set(purchaseRef, { supplierId, productId, quantity, unitPrice, date: serverTimestamp() });

        const productRef = doc(firestore, 'products', productId);
        const product = products.find(p => p.id === productId);
        const supplierRef = doc(firestore, 'suppliers', supplierId);
        const supplier = suppliers.find(s => s.id === supplierId);

        if (product) {
            const newQuantity = product.quantity + quantity;
            const newAverageCost = ((product.averageCost * product.quantity) + (unitPrice * quantity)) / newQuantity;
            batch.update(productRef, { quantity: newQuantity, averageCost: newAverageCost });
        } else {
            batch.set(productRef, { name: 'Novo Produto', category, quantity, averageCost: unitPrice });
        }

        if (supplier) {
            batch.update(supplierRef, { balance: supplier.balance + (quantity * unitPrice) });
        }

        await batch.commit();
        fetchData();
    };

    const addCustomerPayment = async (customerId: string, amount: number, method: PaymentMethod, allocations: { supplierId: string, amount: number }[]) => {
        const batch = writeBatch(firestore);
        const paymentRef = doc(collection(firestore, 'customerPayments'));
        batch.set(paymentRef, { customerId, amount, method, allocatedTo: allocations, date: serverTimestamp() });

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

    return (
        <AppContext.Provider value={{
            customers, suppliers, products, sales, purchases, customerPayments, isLoading,
            addCustomer, updateCustomer, deleteCustomer, 
            addSupplier, updateSupplier, deleteSupplier, 
            addSale, deleteSale,
            addPurchase, addCustomerPayment,
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
