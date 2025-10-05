
export interface Supplier {
    id: string;
    name: string;
    balance: number;
}

export interface Customer {
    id: string;
    name: string;
    balance: number;
}

export interface Product {
    id: string;
    name: string;
    quantity: number;
    averageCost: number;
    category?: string; // Adicionado
}

export enum PaymentMethod {
    Cash = 'À Vista',
    Check = 'Cheque',
    Pix = 'Pix',
    Expense = 'Despesa',
    Caixa = 'Caixa'
}

export interface Purchase {
    id: string;
    productId: string;
    supplierId: string;
    quantity: number;
    unitPrice: number;
    date: string;
}

export interface Sale {
    id: string;
    customerId: string;
    products: { productId: string; quantity: number; unitPrice: number; }[];
    totalAmount: number;
    totalProfit: number;
    date: string;
}

export interface CustomerPayment {
    id: string;
    customerId: string;
    amount: number;
    date: string;
    method: PaymentMethod;
    allocatedTo: { supplierId: string; amount: number }[];
}

export interface SupplierPayment {
    id: string;
    supplierId: string;
    amount: number;
    date: string;
    origin: 'direct' | 'customer_payment';
    customerPaymentId?: string;
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    paidFrom: PaymentMethod;
}
