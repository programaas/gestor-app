
import React, { createContext, useContext, ReactNode } from 'react';
import { db } from '../firebase';
import { collection, doc, runTransaction } from 'firebase/firestore';
import useFirestore from '../hooks/useFirestore';
import { Supplier, Customer, Product, Purchase, Sale, CustomerPayment, PaymentMethod } from '../types';

// Tipos base (sem ID), pois o ID é gerenciado pelo Firestore e pelo hook
type BaseSupplier = Omit<Supplier, 'id'>;
type BaseCustomer = Omit<Customer, 'id'>;
type BaseProduct = Omit<Product, 'id'>;
type BasePurchase = Omit<Purchase, 'id'>;
type BaseSale = Omit<Sale, 'id'>;
type BaseCustomerPayment = Omit<CustomerPayment, 'id'>;

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
    // Usando o hook useFirestore para cada coleção
    const { data: suppliers, loading: l1, addDocument: addSupplierDoc } = useFirestore<BaseSupplier>('suppliers');
    const { data: customers, loading: l2, addDocument: addCustomerDoc } = useFirestore<BaseCustomer>('customers');
    const { data: products, loading: l3 } = useFirestore<BaseProduct>('products');
    const { data: purchases, loading: l4 } = useFirestore<BasePurchase>('purchases');
    const { data: sales, loading: l5 } = useFirestore<BaseSale>('sales');
    const { data: customerPayments, loading: l6 } = useFirestore<BaseCustomerPayment>('customerPayments');

    // O carregamento geral é verdadeiro se qualquer uma das coleções estiver carregando
    const isLoading = l1 || l2 || l3 || l4 || l5 || l6;

    const addSupplier = async (name: string) => {
        await addSupplierDoc({ name });
    };

    const addCustomer = async (name: string) => {
        await addCustomerDoc({ name, balance: 0 });
    };

    // As funções de transação complexas permanecem as mesmas
    const addPurchase = async (productIdentifier: string | { name: string }, supplierId: string, quantity: number, unitPrice: number) => {
        try {
            await runTransaction(db, async (transaction) => {
                let productId: string;
                let productRef;

                if (typeof productIdentifier === 'object') { // Novo produto
                    productRef = doc(collection(db, "products"));
                    productId = productRef.id;
                    transaction.set(productRef, {
                        name: productIdentifier.name,
                        quantity: 0,
                        averageCost: 0
                    });
                } else { // Produto existente
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
            alert(`Erro ao registrar compra: ${e instanceof Error ? e.message : String(e)}`);
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
            alert(`Erro ao registrar venda: ${e instanceof Error ? e.message : String(e)}`);
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
            alert(`Erro ao registrar pagamento: ${e instanceof Error ? e.message : String(e)}`);
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
