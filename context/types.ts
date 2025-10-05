
// Tipos de dados para o nosso sistema de gestão

// Define a estrutura para um Cliente

// types.ts
export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
  }

  
export interface Customer {
    id: string;
    name: string;
    balance: number; // Saldo devedor do cliente
}

// Define a estrutura para um Fornecedor
export interface Supplier {
    id: string;
    name: string;
    balance: number; // Saldo que devemos ao fornecedor
}

// Define a estrutura para um Produto no inventário
export interface Product {
    id: string;
    name: string;
    category: string;
    quantity: number;   // Quantidade em estoque
    averageCost: number; // Custo médio de aquisição
}

// Define um item de produto dentro de uma venda
export interface SaleProduct {
    productId: string;
    quantity: number;
    unitPrice: number; // Preço no momento da venda
}

// Define a estrutura de uma Venda
export interface Sale {
    id: string;
    customerId: string;
    products: SaleProduct[];
    totalAmount: number;
    date: string; // Data em formato ISO (e.g., "2023-10-27T10:00:00.000Z")
}

// Define a estrutura de uma Compra de fornecedor
export interface Purchase {
    id: string;
    supplierId: string;
    productId: string;
    quantity: number;
    unitPrice: number; // Custo de aquisição
    date: string; // Data em formato ISO
}

// Define as formas de pagamento aceitas
export type PaymentMethod = 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX' | 'Transferência Bancária';

// Define a alocação de um pagamento a um fornecedor
export interface PaymentAllocation {
    supplierId: string;
    amount: number;
}

// Define a estrutura de um Pagamento recebido de um cliente
export interface CustomerPayment {
    id: string;
    customerId: string;
    amount: number;
    method: PaymentMethod;
    date: string; // Data em formato ISO
    allocatedTo: PaymentAllocation[]; // Como o dinheiro foi usado para pagar fornecedores
}
