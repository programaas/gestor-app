
export interface Supplier {
    id: string;
    name: string;
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
    productId: string;
    customerId: string;
    quantity: number;
    unitPrice: number;
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
