
// Função para formatar números como moeda brasileira (BRL)
export const formatCurrency = (value: number): string => {
    // Garante que o valor seja um número, retornando R$ 0,00 caso contrário
    if (typeof value !== 'number' || isNaN(value)) {
        return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

// Função para formatar datas para o padrão brasileiro (dd/mm/aaaa)
export const formatDate = (dateString: string): string => {
    // Verifica se a string de data é válida
    if (!dateString) {
        return 'Data inválida';
    }
    
    const date = new Date(dateString);

    // Verifica se o objeto Date criado é um valor de data válido
    if (isNaN(date.getTime())) {
        return 'Data inválida';
    }

    // Formata a data para o padrão pt-BR, garantindo a exibição correta
    return new Intl.DateTimeFormat('pt-BR', { 
        timeZone: 'UTC' // Usar UTC para evitar problemas com fuso horário do servidor/cliente
    }).format(date);
};
