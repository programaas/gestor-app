
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Customer, Sale, CustomerPayment, Supplier, Purchase, Product } from '../types';
import { formatCurrency, formatDate } from './formatters'; // Caminho de importação corrigido e verificado

// Extende a interface do jsPDF para incluir o método autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

// Função para gerar o relatório do cliente
export const generateCustomerReport = (
    customer: Customer,
    sales: Sale[],
    payments: CustomerPayment[],
    products: Product[]
) => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text(`Extrato do Cliente: ${customer.name}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Saldo Atual: ${formatCurrency(customer.balance)}`, 14, 30);

    // Tabela de Compras
    const salesData = sales
        .filter(s => s.customerId === customer.id)
        .flatMap(s => 
            s.products.map(p => {
                const product = products.find(prod => prod.id === p.productId);
                return [
                    product ? product.name : 'Produto não encontrado',
                    p.quantity,
                    formatCurrency(p.unitPrice),
                    formatCurrency(p.quantity * p.unitPrice),
                    formatDate(s.date),
                ];
            })
        );

    doc.autoTable({
        startY: 40,
        head: [['Produto', 'Qtd', 'Preço Unit.', 'Total', 'Data']],
        body: salesData,
        headStyles: { fillColor: [41, 128, 185] },
    });

    // Tabela de Pagamentos
    const paymentsData = payments
        .filter(p => p.customerId === customer.id)
        .map(p => [
            formatDate(p.date),
            formatCurrency(p.amount),
            p.method,
        ]);
    
    doc.autoTable({
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Data do Pagamento', 'Valor', 'Forma de Pagamento']],
        body: paymentsData,
        headStyles: { fillColor: [39, 174, 96] },
    });

    // Salva o arquivo
    doc.save(`extrato_${customer.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};

// Função para gerar o relatório do fornecedor
export const generateSupplierReport = (
    supplier: Supplier,
    purchases: Purchase[],
    payments: CustomerPayment[],
    products: Product[]
) => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text(`Extrato do Fornecedor: ${supplier.name}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Saldo a Pagar: ${formatCurrency(supplier.balance)}`, 14, 30);

    // Tabela de Compras
    const purchasesData = purchases
        .filter(p => p.supplierId === supplier.id)
        .map(p => {
            const product = products.find(prod => prod.id === p.productId);
            return [
                product ? product.name : 'Produto não encontrado',
                p.quantity,
                formatCurrency(p.unitPrice),
                formatCurrency(p.quantity * p.unitPrice),
                formatDate(p.date),
            ];
        });

    doc.autoTable({
        startY: 40,
        head: [['Produto Comprado', 'Qtd', 'Custo Unit.', 'Total', 'Data']],
        body: purchasesData,
        headStyles: { fillColor: [211, 84, 0] },
    });

    // Tabela de Pagamentos (Alocações)
    const supplierPaymentsData = payments
        .flatMap(p => 
            p.allocatedTo
                .filter(alloc => alloc.supplierId === supplier.id)
                .map(alloc => [
                    formatDate(p.date),
                    formatCurrency(alloc.amount),
                    p.method,
                    `Cliente: ${p.customerId}`
                ])
        );

    doc.autoTable({
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Data do Pagamento', 'Valor Alocado', 'Origem do Pagamento', 'Observação']],
        body: supplierPaymentsData,
        headStyles: { fillColor: [39, 174, 96] },
    });

    // Salva o arquivo
    doc.save(`extrato_fornecedor_${supplier.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};
