
import React, { createContext, useContext, ReactNode } from 'react';
import { db } from '../firebase';
import { collection, doc, runTransaction, deleteDoc } from 'firebase/firestore';
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
    addPurchase: (productIdentifier: string | { name: string }, supplierId: string, quantity: number, unitPrice: number) => Promise<void>;
    updatePurchase: (id: string, productIdentifier: string | { name: string }, supplierId: string, quantity: number, unitPrice: number) => Promise<void>;
    deletePurchase: (id: string) => Promise<void>;
    addSale: (productId: string, customerId: string, quantity: number, unitPrice: number) => Promise<void>;
    addCustomerPayment: (customerId: string, amount: number, method: PaymentMethod, allocations: { supplierId: string; amount: number }[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Usando o hook useFirestore para cada coleção
    const { data: suppliers, loading: l1, addDocument: addSupplierDoc } = useFirestore<BaseSupplier>('suppliers');
    const { data: customers, loading: l2, addDocument: addCustomerDoc } = useFirestore<BaseCustomer>('customers');
    const { data: products, loading: l3, addDocument: addProductDoc } = useFirestore<BaseProduct>('products');
    const { data: purchases, loading: l4, updateDocument: updatePurchaseDoc, deleteDocument: deletePurchaseDoc } = useFirestore<BasePurchase>('purchases');
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
                
                const currentData = productDoc.data() as Product || { quantity: 0, averageCost: 0 };
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

    const updatePurchase = async (id: string, productIdentifier: string | { name: string }, supplierId: string, quantity: number, unitPrice: number) => {
        try {
            await runTransaction(db, async (transaction) => {
                const purchaseRef = doc(db, 'purchases', id);
                const oldPurchaseDoc = await transaction.get(purchaseRef);

                if (!oldPurchaseDoc.exists()) {
                    throw new Error("Compra não encontrada para atualização!");
                }

                const oldPurchase = oldPurchaseDoc.data() as Purchase;
                const oldProductId = oldPurchase.productId;
                const oldQuantity = oldPurchase.quantity;
                const oldUnitPrice = oldPurchase.unitPrice;

                // Reverter impacto da compra antiga no produto
                const oldProductRef = doc(db, 'products', oldProductId);
                const oldProductDoc = await transaction.get(oldProductRef);
                if (!oldProductDoc.exists()) {
                    throw new Error("Produto da compra antiga não encontrado!");
                }
                const oldProductData = oldProductDoc.data() as Product;
                const oldProductCurrentQuantity = oldProductData.quantity;
                const oldProductCurrentAvgCost = oldProductData.averageCost;

                const productTotalCostBeforeRevert = oldProductCurrentQuantity * oldProductCurrentAvgCost;
                const productQuantityAfterRevert = oldProductCurrentQuantity - oldQuantity;
                const productTotalCostAfterRevert = productTotalCostBeforeRevert - (oldQuantity * oldUnitPrice);
                const productAvgCostAfterRevert = productQuantityAfterRevert > 0 ? productTotalCostAfterRevert / productQuantityAfterRevert : 0;

                // Determine the new product (can be an existing one or a newly created one)
                let newProductId: string;
                let newProductRef;
                let newProductCurrentQuantity: number = 0; // Current quantity of the *new* product before applying *this* purchase
                let newProductCurrentAvgCost: number = 0; // Current avg cost of the *new* product before applying *this* purchase

                if (typeof productIdentifier === 'object') { // Novo produto
                    newProductRef = doc(collection(db, "products"));
                    newProductId = newProductRef.id;
                    transaction.set(newProductRef, {
                        name: productIdentifier.name,
                        quantity: 0,
                        averageCost: 0
                    });
                } else { // Produto existente
                    newProductId = productIdentifier;
                    newProductRef = doc(db, 'products', newProductId);
                    const currentNewProductDoc = await transaction.get(newProductRef);
                    if (currentNewProductDoc.exists()) {
                        const currentNewProductData = currentNewProductDoc.data() as Product;
                        newProductCurrentQuantity = currentNewProductData.quantity;
                        newProductCurrentAvgCost = currentNewProductData.averageCost;
                    } else {
                        // If it's an existing product but not found, it's an error.
                        throw new Error("Novo produto não encontrado!");
                    }
                }

                // Update the old product if it's different from the new product
                if (oldProductId !== newProductId) {
                    transaction.update(oldProductRef, {
                        quantity: productQuantityAfterRevert,
                        averageCost: productAvgCostAfterRevert
                    });
                }

                // Apply the impact of the new purchase to the (potentially new) product
                let finalNewProductTotalQuantity: number;
                let finalNewProductTotalCost: number;

                if (oldProductId === newProductId) {
                    // If the product is the same, apply the new purchase's impact to the reverted state of this product
                    finalNewProductTotalQuantity = productQuantityAfterRevert + quantity;
                    finalNewProductTotalCost = productTotalCostAfterRevert + (quantity * unitPrice);
                } else {
                    // If the product is different, apply the new purchase's impact to the current state of the *new* product
                    finalNewProductTotalQuantity = newProductCurrentQuantity + quantity;
                    finalNewProductTotalCost = (newProductCurrentQuantity * newProductCurrentAvgCost) + (quantity * unitPrice);
                }

                const finalNewProductAverageCost = finalNewProductTotalQuantity > 0 ? finalNewProductTotalCost / finalNewProductTotalQuantity : 0;

                transaction.update(newProductRef, {
                    quantity: finalNewProductTotalQuantity,
                    averageCost: finalNewProductAverageCost
                });

                // Atualizar a própria compra
                transaction.update(purchaseRef, {
                    productId: newProductId,
                    supplierId,
                    quantity,
                    unitPrice,
                    date: new Date().toISOString()
                });
            });
        } catch (e) {
            console.error("Erro na transação de atualização de compra: ", e);
            alert(`Erro ao atualizar compra: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

    const deletePurchase = async (id: string) => {
        try {
            await runTransaction(db, async (transaction) => {
                const purchaseRef = doc(db, 'purchases', id);
                const purchaseDoc = await transaction.get(purchaseRef);

                if (!purchaseDoc.exists()) {
                    throw new Error("Compra não encontrada para exclusão!");
                }

                const purchaseToDelete = purchaseDoc.data() as Purchase;
                const productId = purchaseToDelete.productId;
                const quantityToDelete = purchaseToDelete.quantity;
                const unitPriceToDelete = purchaseToDelete.unitPrice;

                const productRef = doc(db, 'products', productId);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) {
                    throw new Error("Produto associado à compra não encontrado!");
                }

                const productData = productDoc.data() as Product;
                const currentQuantity = productData.quantity;
                const currentAvgCost = productData.averageCost;

                const newTotalQuantity = currentQuantity - quantityToDelete;
                const newTotalCost = (currentAvgCost * currentQuantity) - (unitPriceToDelete * quantityToDelete);
                const newAverageCost = newTotalQuantity > 0 ? newTotalCost / newTotalQuantity : 0;

                transaction.update(productRef, {
                    quantity: newTotalQuantity,
                    averageCost: newAverageCost
                });

                transaction.delete(purchaseRef);
            });
        } catch (e) {
            console.error("Erro na transação de exclusão de compra: ", e);
            alert(`Erro ao excluir compra: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

    const addSale = async (productId: string, customerId: string, quantity: number, unitPrice: number) => {
         try {
            await runTransaction(db, async (transaction) => {
                const productRef = doc(db, 'products', productId);
                const customerRef = doc(db, 'customers', customerId);

                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists() || (productDoc.data() as Product).quantity < quantity) {
                    throw new Error('Estoque insuficiente!');
                }
                
                const customerDoc = await transaction.get(customerRef);
                if (!customerDoc.exists()) {
                    throw new Error('Cliente não encontrado!');
                }

                const newQuantity = (productDoc.data() as Product).quantity - quantity;
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
            updatePurchase,
            deletePurchase,
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
