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
    products: { productId: string; quantity: number; unitPrice: number }[];
    totalAmount: number;
    totalProfit: number;
    date: string;
  }
  
  export type PaymentMethod = 'cash' | 'bank' | 'pix'; // ajuste conforme seu app
  
  export interface CustomerPayment {
    id: string;
    customerId: string;
    amount: number;
    method: PaymentMethod;
    date: string;
    allocatedTo: { supplierId: string; amount: number }[];
  }
  
  export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    paidFrom: PaymentMethod;
  }