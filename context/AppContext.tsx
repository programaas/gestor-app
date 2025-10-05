import React, { createContext, useContext, ReactNode } from 'react';
import { db } from '../firebase';
import { collection, doc, runTransaction, DocumentData } from 'firebase/firestore';
import useFirestore from '../hooks/useFirestore';
import { Supplier, Customer, Product, Purchase, Sale, CustomerPayment, PaymentMethod, Expense } from '../types';

interface AppContextType {
    suppliers: Supplier[];
    customers: Customer[];
    products: Product[];
    purchases: Purchase[];
    sales: Sale[];
    customerPayments: CustomerPayment[];
    expenses: Expense[];
    isLoading: boolean;
    addSupplier: (name: string) => Promise<void>;
    addCustomer: (name: string) => Promise<void>;
    updateCustomer: (id: string, name: string) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    addPurchase: (productIdentifier: string | { name: string }, supplierId: string, quantity: number, unitPrice: number) => Promise<void>;
    deleteSale: (id: string) => Promise<void>;
    addSale: (customerId: string, products: { productId: string; quantity: number; unitPrice: number }[]) => Promise<void>;
    addCustomerPayment: (customerId: string, amount: number, method: PaymentMethod, allocations: { supplierId: string; amount: number }[]) => Promise<void>;
    addExpense: (description: string, amount: number, paidFrom: PaymentMethod) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const toNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { data: suppliers, loading: l1, addDocument: addSupplierDoc } = useFirestore<Supplier>('suppliers');
    const { data: customers, loading: l2, addDocument: addCustomerDoc, updateDocument: updateCustomerDoc, deleteDocument: deleteCustomerDoc } = useFirestore<Customer>('customers');
    const { data: products, loading: l3 } = useFirestore<Product>('products');
    const { data: purchases, loading: l4, addDocument: addPurchaseDoc } = useFirestore<Purchase>('purchases');
    const { data: sales, loading: l5, addDocument: addSaleDoc, deleteDocument: deleteSaleDoc } = useFirestore<Sale>('sales');
    const { data: customerPayments, loading: l6, addDocument: addCustomerPaymentDoc } = useFirestore<CustomerPayment>('customerPayments');
    const { data: expenses, loading: l7, addDocument: addExpenseDoc } = useFirestore<Expense>('expenses');

    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7;

    const addSupplier = (name: string) => addSupplierDoc({
        name: name.trim(), balance: 0,
        id: ''
    });
    const addCustomer = (name: string) => addCustomerDoc({
        name: name.trim(), balance: 0,
        id: ''
    });
    const updateCustomer = (id: string, name: string) => updateCustomerDoc(id, { name: name.trim() });
    const deleteCustomer = (id: string) => deleteCustomerDoc(id);
    const deleteSale = (id: string) => deleteSaleDoc(id);
    const addExpense = (description: string, amount: number, paidFrom: PaymentMethod) => addExpenseDoc({
        description, amount: toNumber(amount), date: new Date().toISOString(), paidFrom,
        id: ''
    });

    const addPurchase = async (productIdentifier: string | { name: string }, supplierId: string, quantity: number, unitPrice: number) => {
        const numQuantity = toNumber(quantity);
        const numUnitPrice = toNumber(unitPrice);
        if (!supplierId || numQuantity <= 0 || numUnitPrice < 0) throw new Error("Dados da compra inválidos.");

        await runTransaction(db, async (transaction) => {
            let productId: string;
            let productRef;
            const isNewProduct = typeof productIdentifier === 'object';

            if (isNewProduct) {
                const cleanedName = productIdentifier.name.trim();
                if (!cleanedName) throw new Error("O nome do produto não pode ser vazio.");
                productRef = doc(collection(db, "products"));
                productId = productRef.id;
                transaction.set(productRef, { name: cleanedName, quantity: numQuantity, averageCost: numUnitPrice });
            } else {
                productId = productIdentifier as string;
                productRef = doc(db, 'products', productId);
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists()) throw new Error("Produto não encontrado!");
                
                // ✅ CORREÇÃO: Usa o tipo DocumentData, que é o tipo correto retornado pelo Firestore.
                const currentData: DocumentData = productDoc.data();
                const currentQuantity = toNumber(currentData.quantity);
                const currentAvgCost = toNumber(currentData.averageCost);
                const newTotalQuantity = currentQuantity + numQuantity;
                const newTotalValue = (currentAvgCost * currentQuantity) + (numUnitPrice * numQuantity);
                const newAverageCost = newTotalQuantity > 0 ? newTotalValue / newTotalQuantity : 0;
                transaction.update(productRef, { quantity: newTotalQuantity, averageCost: newAverageCost });
            }

            await addPurchaseDoc({
                productId, supplierId, quantity: numQuantity, unitPrice: numUnitPrice, date: new Date().toISOString(),
                id: ''
            });

            const supplierRef = doc(db, 'suppliers', supplierId);
            const supplierDoc = await transaction.get(supplierRef);
            if(!supplierDoc.exists()) throw new Error("Fornecedor não encontrado");
            const newBalance = toNumber(supplierDoc.data().balance) + (numQuantity * numUnitPrice);
            transaction.update(supplierRef, { balance: newBalance });
        });
    };
    
    const addSale = async (customerId: string, saleItems: { productId: string; quantity: number; unitPrice: number }[]) => {
        await runTransaction(db, async (transaction) => {
            const customerRef = doc(db, 'customers', customerId);
            const customerDoc = await transaction.get(customerRef);
            if (!customerDoc.exists()) throw new Error('Cliente não encontrado!');

            let totalAmount = 0;
            let totalProfit = 0;

            for (const item of saleItems) {
                const numQuantity = toNumber(item.quantity);
                const numUnitPrice = toNumber(item.unitPrice);
                if (!item.productId || numQuantity <= 0 || numUnitPrice < 0) continue;

                const productRef = doc(db, 'products', item.productId);
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists()) throw new Error(`Produto não encontrado: ${item.productId}`);
                
                // ✅ CORREÇÃO: Usa o tipo DocumentData, que é o tipo correto.
                const productData: DocumentData = productDoc.data();
                const productStock = toNumber(productData.quantity);
                const productCost = toNumber(productData.averageCost);

                if (productStock < numQuantity) throw new Error(`Estoque insuficiente para ${productData.name}. Disponível: ${productStock}`);

                totalProfit += (numUnitPrice - productCost) * numQuantity;
                totalAmount += numUnitPrice * numQuantity;
                transaction.update(productRef, { quantity: productStock - numQuantity });
            }

            transaction.update(customerRef, { balance: toNumber(customerDoc.data()?.balance) + totalAmount });
            await addSaleDoc({
                customerId, products: saleItems, totalAmount, totalProfit, date: new Date().toISOString(),
                id: ''
            });
        });
    };

    const addCustomerPayment = async (customerId: string, amount: number, method: PaymentMethod, allocations: { supplierId: string; amount: number }[]) => {
         await runTransaction(db, async (transaction) => {
            const numAmount = toNumber(amount);
            if (!customerId || numAmount <= 0) throw new Error("Dados de pagamento inválidos.");

            const customerRef = doc(db, 'customers', customerId);
            const customerDoc = await transaction.get(customerRef);
            if(!customerDoc.exists()) throw new Error("Cliente não encontrado");
            transaction.update(customerRef, { balance: toNumber(customerDoc.data().balance) - numAmount });

            for (const alloc of allocations) {
                const allocAmount = toNumber(alloc.amount);
                if (allocAmount > 0) {
                    const supplierRef = doc(db, 'suppliers', alloc.supplierId);
                    const supplierDoc = await transaction.get(supplierRef);
                    if(!supplierDoc.exists()) throw new Error("Fornecedor não encontrado");
                    transaction.update(supplierRef, { balance: toNumber(supplierDoc.data().balance) - allocAmount });
                }
            }
            await addCustomerPaymentDoc({
                customerId, amount: numAmount, method, date: new Date().toISOString(), allocatedTo: allocations,
                id: ''
            });
        });
    };

    const contextValue: AppContextType = {
        suppliers: suppliers || [],
        customers: customers || [],
        products: products || [],
        purchases: purchases || [],
        sales: sales || [],
        customerPayments: customerPayments || [],
        expenses: expenses || [],
        isLoading,
        addSupplier,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addPurchase,
        deleteSale,
        addSale,
        addCustomerPayment,
        addExpense,
    };

    return (
        <AppContext.Provider value={contextValue}>
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