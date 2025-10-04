
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, doc, runTransaction, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Supplier, Customer, Product, Purchase, Sale, CustomerPayment, PaymentMethod } from '../types';

interface AppContextType {
    suppliers: Supplier[];
    customers: Customer[];
    products: Product[];
    purchases: Purchase[];
    sales: Sale[];
    customerPayments: CustomerPayment[];
    isLoading: boolean;
    addSupplier: (name: string) => Promise<void>;
    addCustomer: (name: string) => Promise<void>;
    addPurchase: (productId: string | { name: string }, supplierId: string, quantity: number, unitPrice: number) => Promise<void>;
    addSale: (productId: string, customerId: string, quantity: number, unitPrice: number) => Promise<void>;
    addCustomerPayment: (customerId: string, amount: number, method: PaymentMethod, allocations: { supplierId: string; amount: number }[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const collections = [
            { name: 'suppliers', setter: setSuppliers },
            { name: 'customers', setter: setCustomers },
            { name: 'products', setter: setProducts },
            { name: 'purchases', setter: setPurchases, orderByField: 'date' },
            { name: 'sales', setter: setSales, orderByField: 'date' },
            { name: 'customerPayments', setter: setCustomerPayments, orderByField: 'date' },
        ];

        let loadedCount = 0;
        const unsubscribes = collections.map(({ name, setter, orderByField }) => {
            const collRef = orderByField 
                ? query(collection(db, name), orderBy(orderByField, 'desc'))
                : collection(db, name);
            
            return onSnapshot(collRef, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
                setter(data);
                
                if (isLoading) {
                    loadedCount++;
                    if (loadedCount === collections.length) {
                        setIsLoading(false);
                    }
                }
            }, (error) => {
                console.error(`Error fetching ${name}:`, error);
                setIsLoading(false); 
            });
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    const addSupplier = async (name: string) => {
        await addDoc(collection(db, 'suppliers'), { name });
    };

    const addCustomer = async (name: string) => {
        await addDoc(collection(db, 'customers'), { name, balance: 0 });
    };

    const addPurchase = async (productIdentifier: string | { name: string }, supplierId: string, quantity: number, unitPrice: number) => {
        try {
            await runTransaction(db, async (transaction) => {
                let productId: string;
                let productRef;

                if (typeof productIdentifier === 'object') { // New product
                    productRef = doc(collection(db, "products"));
                    productId = productRef.id;
                    transaction.set(productRef, {
                        name: productIdentifier.name,
                        quantity: 0,
                        averageCost: 0
                    });
                } else { // Existing product
                    productId = productIdentifier;
                    productRef = doc(db, 'products', productId);
                }

                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists() && typeof productIdentifier === 'string') {
                    throw new Error("Produto não encontrado!");
                }
                
                const currentData = productDoc.data() || { quantity: 0, averageCost: 0 };
                const currentQuantity = currentData.quantity;
                const currentAvgCost = currentData.averageCost;

                const newTotalQuantity = currentQuantity + quantity;
                const newTotalCost = (currentAvgCost * currentQuantity) + (unitPrice * quantity);
                const newAverageCost = newTotalQuantity > 0 ? newTotalCost / newTotalQuantity : 0;
                
                transaction.update(productRef, {
                    quantity: newTotalQuantity,
                    averageCost: newAverageCost
                });

                const purchaseRef = doc(collection(db, 'purchases'));
                transaction.set(purchaseRef, {
                    productId,
                    supplierId,
                    quantity,
                    unitPrice,
                    date: new Date().toISOString()
                });
            });
        } catch (e) {
            console.error("Erro na transação de compra: ", e);
            alert(`Erro ao registrar compra: ${e.message}`);
        }
    };

    const addSale = async (productId: string, customerId: string, quantity: number, unitPrice: number) => {
         try {
            await runTransaction(db, async (transaction) => {
                const productRef = doc(db, 'products', productId);
                const customerRef = doc(db, 'customers', customerId);

                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists() || productDoc.data().quantity < quantity) {
                    throw new Error('Estoque insuficiente!');
                }
                
                const customerDoc = await transaction.get(customerRef);
                if (!customerDoc.exists()) {
                    throw new Error('Cliente não encontrado!');
                }

                const newQuantity = productDoc.data().quantity - quantity;
                transaction.update(productRef, { quantity: newQuantity });

                const newBalance = customerDoc.data().balance + (quantity * unitPrice);
                transaction.update(customerRef, { balance: newBalance });

                const saleRef = doc(collection(db, 'sales'));
                transaction.set(saleRef, {
                    productId,
                    customerId,
                    quantity,
                    unitPrice,
                    date: new Date().toISOString()
                });
            });
        } catch (e) {
            console.error("Erro na transação de venda: ", e);
            alert(`Erro ao registrar venda: ${e.message}`);
        }
    };
    
    const addCustomerPayment = async (customerId: string, amount: number, method: PaymentMethod, allocations: { supplierId: string; amount: number }[]) => {
        try {
            await runTransaction(db, async (transaction) => {
                const customerRef = doc(db, 'customers', customerId);
                const customerDoc = await transaction.get(customerRef);

                if (!customerDoc.exists()) {
                    throw new Error("Cliente não encontrado!");
                }

                const newBalance = customerDoc.data().balance - amount;
                transaction.update(customerRef, { balance: newBalance });
                
                const paymentRef = doc(collection(db, 'customerPayments'));
                transaction.set(paymentRef, {
                    customerId,
                    amount,
                    method,
                    allocatedTo: allocations,
                    date: new Date().toISOString(),
                });
            });
        } catch (e) {
            console.error("Erro na transação de pagamento: ", e);
            alert(`Erro ao registrar pagamento: ${e.message}`);
        }
    };

    return (
        <AppContext.Provider value={{
            suppliers,
            customers,
            products,
            purchases,
            sales,
            customerPayments,
            isLoading,
            addSupplier,
            addCustomer,
            addPurchase,
            addSale,
            addCustomerPayment
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
