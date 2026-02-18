import { Transaction } from "./types";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Safe Currency Math to avoid floating point errors
export const currency = {
  add: (a: number, b: number) => Number((a + b).toFixed(2)),
  subtract: (a: number, b: number) => Number((a - b).toFixed(2)),
  multiply: (a: number, b: number) => Number((a * b).toFixed(2)),
  format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
};

export const exportToCSV = (transactions: Transaction[]) => {
  // Define headers
  const headers = ['ID', 'Data', 'Hora', 'Tipo', 'Descrição', 'Status', 'Método Pagamento', 'Valor'];
  
  // Map data
  const rows = transactions.map(t => [
    t.id,
    new Date(t.date).toLocaleDateString('pt-BR'),
    new Date(t.date).toLocaleTimeString('pt-BR'),
    t.type === 'SALE' ? 'Venda' : t.type === 'EXPENSE' ? 'Despesa' : 'Entrada',
    `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
    t.status === 'CANCELLED' ? 'CANCELADO' : 'ATIVO',
    t.paymentMethod,
    t.amount.toFixed(2).replace('.', ',') // Excel format specific
  ]);

  // Combine
  const csvContent = [
    headers.join(';'),
    ...rows.map(r => r.join(';'))
  ].join('\n');

  // Create download link
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_fluxomaster_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (transactions: Transaction[]) => {
  const doc = new jsPDF();
  
  // --- 1. Header Styling ---
  doc.setFillColor(79, 70, 229); // Primary Color (Indigo-600)
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório Geral Financeiro", 14, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 35);
  doc.text("FluxoMaster AI System", 195, 35, { align: 'right' });

  // --- 2. Calculate Summaries (EXCLUDING CANCELLED TRANSACTIONS) ---
  // Only active transactions contribute to financial totals
  const activeTransactions = transactions.filter(t => t.status !== 'CANCELLED');

  const income = activeTransactions
    .filter(t => t.type !== 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenses = activeTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expenses;

  // --- 3. Summary Section (Mini Dashboard in PDF) ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo do Período (Apenas operações válidas)", 14, 55);

  const summaryData = [
    ['Entradas Totais', 'Saídas Totais', 'Saldo Líquido'],
    [currency.format(income), currency.format(expenses), currency.format(balance)]
  ];

  autoTable(doc, {
    startY: 60,
    head: [summaryData[0]],
    body: [summaryData[1]],
    theme: 'grid',
    headStyles: { 
      fillColor: [248, 250, 252], 
      textColor: [100, 116, 139], 
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      halign: 'center', 
      fontSize: 12, 
      cellPadding: 6,
      lineWidth: 0.1,
      lineColor: [226, 232, 240]
    },
    columnStyles: {
      0: { textColor: [16, 185, 129], fontStyle: 'bold' }, // Green
      1: { textColor: [239, 68, 68], fontStyle: 'bold' },  // Red
      2: { textColor: balance >= 0 ? [79, 70, 229] : [239, 68, 68], fontStyle: 'bold' } // Blue or Red
    }
  });

  // --- 4. Detailed Transaction Table (INCLUDING CANCELLED) ---
  let finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Detalhamento Completo (Inclui cancelamentos)", 14, finalY);

  const tableRows = transactions.map(t => {
    const isCancelled = t.status === 'CANCELLED';
    return [
        new Date(t.date).toLocaleDateString('pt-BR') + ' ' + new Date(t.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
        // Type Column
        (t.type === 'SALE' ? 'Venda' : t.type === 'EXPENSE' ? 'Despesa' : t.type === 'PRODUCTION' ? 'Produção' : 'Entrada') + (isCancelled ? ' (CANCELADO)' : ''),
        // Description Column
        t.description,
        // Method Column
        t.paymentMethod === 'N/A' ? '-' : t.paymentMethod,
        // Value Column
        currency.format(t.amount),
        // Hidden column for internal styling check
        isCancelled ? 'CANCELLED' : 'ACTIVE' 
    ];
  });

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Data/Hora', 'Tipo', 'Descrição', 'Método', 'Valor']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 40 }, // Increased for "(CANCELADO)" text
      2: { cellWidth: 'auto' },
      3: { cellWidth: 25 },
      4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
    },
    didParseCell: function(data) {
        if (data.section === 'body') {
             const rowRaw = data.row.raw as any[];
             const isCancelled = rowRaw[5] === 'CANCELLED'; // Check our hidden status column

             if (isCancelled) {
                 // Style for Cancelled Rows
                 data.cell.styles.textColor = [156, 163, 175]; // Gray 400
                 data.cell.styles.fontStyle = 'italic';
             } else {
                 // Standard Logic for Active Rows
                 if (data.column.index === 4) {
                     const rowType = rowRaw[1] as string;
                     if (rowType.includes('Despesa')) {
                         data.cell.styles.textColor = [220, 38, 38]; // Red
                     } else {
                         data.cell.styles.textColor = [5, 150, 105]; // Green
                     }
                 }
             }
        }
    }
  });

  // --- 5. Footer ---
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Página ' + i + ' de ' + pageCount, 105, 290, { align: 'center' });
  }

  // Save
  doc.save(`FluxoMaster_Relatorio_${new Date().toISOString().split('T')[0]}.pdf`);
};