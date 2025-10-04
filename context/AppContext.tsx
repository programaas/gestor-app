import React, { createContext, useContext, ReactNode } from 'react';
import { Supplier, Customer, Product, Purchase, Sale, CustomerPayment, PaymentMethod, SupplierPayment, SaleItem, Expense } from '../types.ts';

export interface AppState {
    suppliers: Supplier[];
    customers: Customer[];
    products: Product[];
    purchases: Purchase[];
    sales: Sale[];
    customerPayments: CustomerPayment[];
    supplierPayments: SupplierPayment[];
    expenses: Expense[];
    caixaBalance: number;
}

interface AppContextType extends AppState {
    addSupplier: (name: string) => void;
    addCustomer: (name: string) => void;
    addPurchase: (productId: string | { name: string }, supplierId: string, quantity: number, unitPrice: number) => void;
    updatePurchase: (purchaseId: string, updatedData: { productId: string; supplierId: string; quantity: number; unitPrice: number; }) => void;
    addSale: (customerId: string, items: SaleItem[]) => void;
    updateSale: (saleId: string, updatedData: { customerId: string; items: SaleItem[]; }) => void;
    addCustomerPayment: (customerId: string, amount: number, method: PaymentMethod, allocations: { supplierId: string; amount: number }[], expenseDetails?: { description: string }) => void;
    addSupplierPayment: (supplierId: string, amount: number, method: PaymentMethod) => void;
    addExpense: (description: string, amount: number) => void;
    setAllData: (data: AppState) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
    appData: AppState;
    setAppData: React.Dispatch<React.SetStateAction<AppState | null>>;
    updateFirestore: (newState: AppState) => Promise<void>;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, appData, setAppData, updateFirestore }) => {

    const updateState = (updater: (prevState: AppState) => AppState) => {
        const newState = updater(appData);
        setAppData(newState);
        updateFirestore(newState);
    };
    
    const setAllData = (data: AppState) => {
        setAppData(data);
        updateFirestore(data);
    }

    const addSupplier = (name: string) => {
        const newSupplier: Supplier = { id: crypto.randomUUID(), name, balance: 0 };
        updateState(prev => ({ ...prev, suppliers: [...prev.suppliers, newSupplier] }));
    };

    const addCustomer = (name: string) => {
        const newCustomer: Customer = { id: crypto.randomUUID(), name, balance: 0 };
        updateState(prev => ({ ...prev, customers: [...prev.customers, newCustomer] }));
    };

    const addPurchase = (productIdentifier: string | { name: string }, supplierId: string, quantity: number, unitPrice: number) => {
        updateState(prev => {
            let nextState = { ...prev };
            let productId: string;

            if (typeof productIdentifier === 'string') {
                productId = productIdentifier;
            } else {
                const newProduct: Product = { id: crypto.randomUUID(), name: productIdentifier.name, quantity: 0, averageCost: 0 };
                nextState.products = [...nextState.products, newProduct];
                productId = newProduct.id;
            }
            
            nextState.products = nextState.products.map(p => {
                if (p.id === productId) {
                    const newTotalQuantity = p.quantity + quantity;
                    const newTotalCost = (p.averageCost * p.quantity) + (unitPrice * quantity);
                    const newAverageCost = newTotalQuantity > 0 ? newTotalCost / newTotalQuantity : 0;
                    return { ...p, quantity: newTotalQuantity, averageCost: newAverageCost };
                }
                return p;
            });

            const newPurchase: Purchase = { id: crypto.randomUUID(), productId, supplierId, quantity, unitPrice, date: new Date().toISOString() };
            nextState.purchases = [...nextState.purchases, newPurchase];
            
            const purchaseTotal = quantity * unitPrice;
            nextState.suppliers = nextState.suppliers.map(s => s.id === supplierId ? { ...s, balance: s.balance + purchaseTotal } : s);

            return nextState;
        });
    };
    
    const updatePurchase = (purchaseId: string, updatedData: { productId: string; supplierId: string; quantity: number; unitPrice: number; }) => {
        updateState(prev => {
            const originalPurchase = prev.purchases.find(p => p.id === purchaseId);
            if (!originalPurchase) return prev;
            
            let nextState = { ...prev };

            // Revert original purchase
            nextState.suppliers = nextState.suppliers.map(s => s.id === originalPurchase.supplierId ? { ...s, balance: s.balance - (originalPurchase.quantity * originalPurchase.unitPrice) } : s);
            nextState.products = nextState.products.map(p => {
                if (p.id === originalPurchase.productId) {
                    const currentTotalValue = p.quantity * p.averageCost;
                    const valueToRevert = originalPurchase.quantity * originalPurchase.unitPrice;
                    const quantityAfterRevert = p.quantity - originalPurchase.quantity;
                    const valueAfterRevert = currentTotalValue - valueToRevert;
                    const averageCostAfterRevert = quantityAfterRevert > 0 ? valueAfterRevert / quantityAfterRevert : 0;
                    return { ...p, quantity: quantityAfterRevert, averageCost: averageCostAfterRevert };
                }
                return p;
            });

            // Apply new purchase data
            nextState.suppliers = nextState.suppliers.map(s => s.id === updatedData.supplierId ? { ...s, balance: s.balance + (updatedData.quantity * updatedData.unitPrice) } : s);
            nextState.products = nextState.products.map(p => {
                if (p.id === updatedData.productId) {
                    const currentTotalValue = p.quantity * p.averageCost;
                    const valueToAdd = updatedData.quantity * updatedData.unitPrice;
                    const quantityAfterUpdate = p.quantity + updatedData.quantity;
                    const valueAfterUpdate = currentTotalValue + valueToAdd;
                    const averageCostAfterUpdate = quantityAfterUpdate > 0 ? valueAfterUpdate / quantityAfterUpdate : 0;
                    return { ...p, quantity: quantityAfterUpdate, averageCost: averageCostAfterUpdate };
                }
                return p;
            });

            nextState.purchases = nextState.purchases.map(p => p.id === purchaseId ? { ...p, ...updatedData, date: originalPurchase.date } : p);
            return nextState;
        });
    };

    const addSale = (customerId: string, items: SaleItem[]) => {
        updateState(prev => {
            for (const item of items) {
                const product = prev.products.find(p => p.id === item.productId);
                if (!product || product.quantity < item.quantity) {
                    alert(`Estoque insuficiente para o produto: ${product?.name || 'desconhecido'}`);
                    return prev; // Abort update
                }
            }

            let nextState = { ...prev };
            let totalSaleAmount = 0;
            const supplierDebits = new Map<string, number>();

            items.forEach(item => {
                nextState.products = nextState.products.map(p => p.id === item.productId ? { ...p, quantity: p.quantity - item.quantity } : p);
                totalSaleAmount += item.quantity * item.unitPrice;
                const currentDebit = supplierDebits.get(item.supplierId) || 0;
                supplierDebits.set(item.supplierId, currentDebit + (item.quantity * item.costPrice));
            });

            nextState.customers = nextState.customers.map(c => c.id === customerId ? { ...c, balance: c.balance + totalSaleAmount } : c);

            nextState.suppliers = nextState.suppliers.map(s => {
                const debitToAdd = supplierDebits.get(s.id);
                if (debitToAdd) return { ...s, balance: s.balance + debitToAdd };
                return s;
            });

            const newSale: Sale = { id: crypto.randomUUID(), customerId, items, totalAmount: totalSaleAmount, date: new Date().toISOString() };
            nextState.sales = [...nextState.sales, newSale];
            return nextState;
        });
    };
    
    const updateSale = (saleId: string, updatedData: { customerId: string; items: SaleItem[]; }) => {
        updateState(prev => {
            const originalSale = prev.sales.find(s => s.id === saleId);
            if (!originalSale) return prev;

            let stateAfterRevert = { ...prev };
            // Revert original sale effects
            stateAfterRevert.customers = stateAfterRevert.customers.map(c => c.id === originalSale.customerId ? { ...c, balance: c.balance - originalSale.totalAmount } : c);
            originalSale.items.forEach(item => {
                stateAfterRevert.products = stateAfterRevert.products.map(p => p.id === item.productId ? { ...p, quantity: p.quantity + item.quantity } : p);
                stateAfterRevert.suppliers = stateAfterRevert.suppliers.map(s => s.id === item.supplierId ? { ...s, balance: s.balance - (item.costPrice * item.quantity) } : s);
            });

            for (const item of updatedData.items) {
                const product = stateAfterRevert.products.find(p => p.id === item.productId);
                if (!product || product.quantity < item.quantity) {
                    alert(`Estoque insuficiente para o produto: ${product?.name || 'desconhecido'}`);
                    return prev; // Abort entire operation, return original state
                }
            }
            
            let nextState = stateAfterRevert;
            let newTotalAmount = 0;
            const newSupplierDebits = new Map<string, number>();

            updatedData.items.forEach(item => {
                newTotalAmount += item.quantity * item.unitPrice;
                const currentDebit = newSupplierDebits.get(item.supplierId) || 0;
                newSupplierDebits.set(item.supplierId, currentDebit + (item.quantity * item.costPrice));
                nextState.products = nextState.products.map(p => p.id === item.productId ? { ...p, quantity: p.quantity - item.quantity } : p);
            });

            nextState.customers = nextState.customers.map(c => c.id === updatedData.customerId ? { ...c, balance: c.balance + newTotalAmount } : c);
            nextState.suppliers = nextState.suppliers.map(s => {
                const debitToAdd = newSupplierDebits.get(s.id);
                if (debitToAdd) return { ...s, balance: s.balance + debitToAdd };
                return s;
            });
            
            nextState.sales = nextState.sales.map(s => s.id === saleId ? { ...s, ...updatedData, totalAmount: newTotalAmount, date: originalSale.date } : s);
            return nextState;
        });
    };

    const addCustomerPayment = (customerId: string, amount: number, method: PaymentMethod, allocations: { supplierId: string; amount: number }[], expenseDetails?: { description: string }) => {
        updateState(prev => {
            let nextState = { ...prev };

            const customer = nextState.customers.find(c => c.id === customerId);
            if (!customer) return prev;

            nextState.customers = nextState.customers.map(c => c.id === customerId ? { ...c, balance: c.balance - amount } : c);
            
            const newPayment: CustomerPayment = { id: crypto.randomUUID(), customerId, amount, method, date: new Date().toISOString(), allocatedTo: allocations };
            nextState.customerPayments = [...nextState.customerPayments, newPayment];

            if (expenseDetails) {
                 if (allocations.reduce((sum, alloc) => sum + alloc.amount, 0) > 0) {
                     alert("Um pagamento não pode ser registrado como despesa e alocado a fornecedores ao mesmo tempo.");
                     return prev; // Revert
                }
                const newExpense: Expense = { id: crypto.randomUUID(), description: expenseDetails.description, amount, date: new Date().toISOString(), source: 'Pagamento de Cliente', customerPaymentId: newPayment.id };
                nextState.expenses = [...nextState.expenses, newExpense];
            } else {
                const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);

                if (allocations && allocations.length > 0) {
                    const supplierPaymentsToAdd: SupplierPayment[] = [];
                    allocations.forEach(alloc => {
                        if (alloc.amount > 0) {
                            nextState.suppliers = nextState.suppliers.map(s => s.id === alloc.supplierId ? { ...s, balance: s.balance - alloc.amount } : s);
                            supplierPaymentsToAdd.push({ id: crypto.randomUUID(), supplierId: alloc.supplierId, amount: alloc.amount, date: newPayment.date, method: newPayment.method, origin: 'customer_payment', customerPaymentId: newPayment.id });
                        }
                    });
                    nextState.supplierPayments = [...nextState.supplierPayments, ...supplierPaymentsToAdd];
                }
                
                const amountToCaixa = amount - totalAllocated;
                if (amountToCaixa > 0) {
                    nextState.caixaBalance += amountToCaixa;
                }
            }
            return nextState;
        });
    };

    const addSupplierPayment = (supplierId: string, amount: number, method: PaymentMethod) => {
        updateState(prev => {
            if (method === PaymentMethod.Caixa) {
                if (prev.caixaBalance < amount) {
                    alert('Saldo em caixa insuficiente.');
                    return prev;
                }
            }
            
            let nextState = { ...prev };
            
            if (method === PaymentMethod.Caixa) {
                nextState.caixaBalance -= amount;
            }

            nextState.suppliers = nextState.suppliers.map(s => s.id === supplierId ? { ...s, balance: s.balance - amount } : s);

            const newPayment: SupplierPayment = { id: crypto.randomUUID(), supplierId, amount, date: new Date().toISOString(), method, origin: 'direct' };
            nextState.supplierPayments = [...nextState.supplierPayments, newPayment];

            return nextState;
        });
    };

    const addExpense = (description: string, amount: number) => {
        updateState(prev => {
            if (prev.caixaBalance < amount) {
                alert('Saldo em caixa insuficiente para cobrir esta despesa.');
                return prev;
            }

            let nextState = { ...prev };
            nextState.caixaBalance -= amount;
            const newExpense: Expense = { id: crypto.randomUUID(), description, amount, date: new Date().toISOString(), source: 'Caixa' };
            nextState.expenses = [...nextState.expenses, newExpense];
            return nextState;
        });
    };

    return (
        <AppContext.Provider value={{
            ...appData,
            addSupplier, addCustomer, addPurchase, updatePurchase, addSale, updateSale, addCustomerPayment, addSupplierPayment, addExpense, setAllData
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