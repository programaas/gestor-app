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
}

export enum PaymentMethod {
    Cash = 'À Vista',
    Check = 'Cheque',
    Pix = 'Pix',
    Caixa = 'Caixa',
}

export interface Purchase {
    id: string;
    productId: string;
    supplierId: string;
    quantity: number;
    unitPrice: number;
    date: string;
}

export interface SaleItem {
    productId: string;
    quantity: number;
    unitPrice: number; // Sale price
    supplierId: string;
    costPrice: number; // Purchase price
}

export interface Sale {
    id: string;
    customerId: string;
    items: SaleItem[];
    totalAmount: number;
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
    method: PaymentMethod;
    origin: 'direct' | 'customer_payment';
    customerPaymentId?: string;
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    source: 'Caixa' | 'Pagamento de Cliente';
    customerPaymentId?: string; // Link to the customer payment if applicable
}