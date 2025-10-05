
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { firestore } from '../firebase';
// CORREÇÃO CRÍTICA: Importar de 'firebase/firestore' e não de '../firebase'
import { 
    collection, 
    getDocs, 
    doc, 
    writeBatch, 
    deleteDoc, 
    serverTimestamp, 
    Timestamp, 
    type FirestoreDataConverter // Importar como tipo
} from 'firebase/firestore';

import {
    Customer, Sale, Purchase, Product, Supplier, CustomerPayment, PaymentMethod
} from './types';

// --- CONVERSORES DE DADOS DO FIRESTORE ---
// Garantem a tipagem correta na leitura e escrita dos dados

const customerConverter: FirestoreDataConverter<Customer> = {
    toFirestore: (customer) => {
        const { id, ...data } = customer;
        return data;
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return { id: snapshot.id, ...data } as Customer;
    }
};

const saleConverter: FirestoreDataConverter<Sale> = {
    toFirestore: (sale) => {
        const { id, ...data } = sale;
        return data;
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        // Garante que o timestamp seja convertido para string ISO
        const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : new Date().toISOString();
        return { id: snapshot.id, ...data, date } as Sale;
    }
};

const productConverter: FirestoreDataConverter<Product> = {
    toFirestore: (product) => {
        const { id, ...data } = product;
        return data;
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return { id: snapshot.id, ...data } as Product;
    }
};

const supplierConverter: FirestoreDataConverter<Supplier> = {
    toFirestore: (supplier) => {
        const { id, ...data } = supplier;
        return data;
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return { id: snapshot.id, ...data } as Supplier;
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
        return { id: snapshot.id, ...data, date } as Purchase;
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
        return { id: snapshot.id, ...data, date } as CustomerPayment;
    }
};

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
    addSale: (customerId: string, products: { productId: string; quantity: number; unitPrice: number }[], totalAmount: number) => Promise<void>;
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
        console.log("Iniciando busca de dados com conversores...");
        try {
            // Busca cada coleção individualmente com seu conversor correto
            const customersSnapshot = await getDocs(collection(firestore, 'customers').withConverter(customerConverter));
            setCustomers(customersSnapshot.docs.map(doc => doc.data()));

            const suppliersSnapshot = await getDocs(collection(firestore, 'suppliers').withConverter(supplierConverter));
            setSuppliers(suppliersSnapshot.docs.map(doc => doc.data()));

            const productsSnapshot = await getDocs(collection(firestore, 'products').withConverter(productConverter));
            setProducts(productsSnapshot.docs.map(doc => doc.data()));

            const salesSnapshot = await getDocs(collection(firestore, 'sales').withConverter(saleConverter));
            setSales(salesSnapshot.docs.map(doc => doc.data()));

            const purchasesSnapshot = await getDocs(collection(firestore, 'purchases').withConverter(purchaseConverter));
            setPurchases(purchasesSnapshot.docs.map(doc => doc.data()));

            const paymentsSnapshot = await getDocs(collection(firestore, 'customerPayments').withConverter(customerPaymentConverter));
            setCustomerPayments(paymentsSnapshot.docs.map(doc => doc.data()));

            console.log("Todas as coleções carregadas com sucesso.");
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            // Opcional: resetar estados para evitar dados parciais
            setCustomers([]);
            setSuppliers([]);
            setProducts([]);
            setSales([]);
            setPurchases([]);
            setCustomerPayments([]);
        } finally {
            setIsLoading(false);
            console.log("Busca de dados finalizada.");
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // As funções de escrita (addCustomer, addSale, etc.) são simplificadas
    // para usar os conversores, garantindo consistência.

    const addCustomer = async (name: string) => {
        const newCustomer: Omit<Customer, 'id'> = { name, balance: 0 };
        const ref = collection(firestore, 'customers').withConverter(customerConverter);
        await writeBatch(firestore).set(doc(ref), newCustomer).commit();
        fetchData();
    };
    // ... (outras funções de escrita poderiam ser atualizadas de forma similar)

    // Manter as outras funções como estão por enquanto para estabilidade
    const addSupplier = async (name: string) => {
        const batch = writeBatch(firestore);
        const newSupplierRef = doc(collection(firestore, 'suppliers'));
        batch.set(newSupplierRef, { name, balance: 0 });
        await batch.commit();
        fetchData();
    };

    const addSale = async (customerId: string, saleProducts: { productId: string; quantity: number; unitPrice: number }[], totalAmount: number) => {
        const batch = writeBatch(firestore);
        const saleRef = doc(collection(firestore, 'sales'));
        batch.set(saleRef, { 
            customerId, 
            products: saleProducts, 
            totalAmount, 
            date: serverTimestamp()
        });

        const customerRef = doc(firestore, 'customers', customerId);
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            batch.update(customerRef, { balance: customer.balance + totalAmount });
        }

        await batch.commit();
        fetchData();
    };

    const addPurchase = async (supplierId: string, productId: string, quantity: number, unitPrice: number, category: string) => {
        const batch = writeBatch(firestore);
        const purchaseRef = doc(collection(firestore, 'purchases'));
        batch.set(purchaseRef, { 
            supplierId, 
            productId, 
            quantity, 
            unitPrice, 
            date: serverTimestamp() 
        });

        const productRef = doc(firestore, 'products', productId);
        const product = products.find(p => p.id === productId);
        const supplierRef = doc(firestore, 'suppliers', supplierId);
        const supplier = suppliers.find(s => s.id === supplierId);

        if (product) {
            const newQuantity = product.quantity + quantity;
            const newAverageCost = ((product.averageCost * product.quantity) + (unitPrice * quantity)) / newQuantity;
            batch.update(productRef, { quantity: newQuantity, averageCost: newAverageCost });
        } else {
            batch.set(productRef, { 
                name: 'Novo Produto',
                category, 
                quantity, 
                averageCost: unitPrice 
            });
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
        batch.set(paymentRef, { 
            customerId, 
            amount, 
            method, 
            allocatedTo: allocations, 
            date: serverTimestamp() 
        });

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
            addSale, addPurchase, addCustomerPayment,
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
