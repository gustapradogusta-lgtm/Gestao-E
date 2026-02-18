import React, { useState } from 'react';
import { CashRegisterSession, Transaction, PaymentMethod } from '../types';
import { Lock, Unlock, ArrowUpRight, ArrowDownLeft, Ban, AlertTriangle, CreditCard, Banknote, QrCode, CalendarClock, Wallet } from 'lucide-react';
import { currency } from '../utils';

interface CashRegisterProps {
  currentSession: CashRegisterSession | undefined;
  transactions: Transaction[];
  onOpenSession: (amount: number) => void;
  onCloseSession: (finalCount: number) => void;
  onAddTransaction: (transaction: Transaction) => void;
  onCancelTransaction: (id: string, reason: string) => void;
}

export const CashRegister: React.FC<CashRegisterProps> = ({ 
  currentSession, 
  transactions, 
  onOpenSession, 
  onCloseSession,
  onAddTransaction,
  onCancelTransaction
}) => {
  const [amountInput, setAmountInput] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  
  // Cancellation State
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // 1. Filter transactions for the current session
  const sessionTransactions = currentSession 
    ? transactions.filter(t => new Date(t.date) >= new Date(currentSession.openedAt))
    : [];

  const activeTransactions = sessionTransactions.filter(t => t.status !== 'CANCELLED');

  // 2. Calculate Totals by Method
  const totals = activeTransactions.reduce((acc, t) => {
    const isOpeningBalance = t.description === 'Abertura de Caixa';

    // Handle Money Balance (Physical Drawer) - MUST include Opening Balance
    if (t.paymentMethod === PaymentMethod.MONEY) {
      if (t.type === 'SALE' || t.type === 'INCOME') {
        acc.moneyIn += t.amount;
      } else if (t.type === 'EXPENSE') {
        acc.moneyOut += t.amount;
      }
    }

    // Handle Sales/Income Breakdown by Method (Revenue) - MUST EXCLUDE Opening Balance
    // We only want to see what was SOLD or added as extra income, not the initial change fund.
    if (t.type === 'SALE' || (t.type === 'INCOME' && !isOpeningBalance)) {
      const method = t.paymentMethod;
      if (method !== 'N/A') {
        acc.byMethod[method] = (acc.byMethod[method] || 0) + t.amount;
        acc.totalRevenue += t.amount;
      }
    }

    return acc;
  }, {
    moneyIn: 0,
    moneyOut: 0,
    totalRevenue: 0,
    byMethod: {} as Record<string, number>
  });
  
  // Current Physical Balance in Drawer
  const currentDrawerBalance = currentSession 
    ? currency.subtract(totals.moneyIn, totals.moneyOut)
    : 0;

  const handleOpen = () => {
    const val = parseFloat(amountInput);
    if (!isNaN(val)) onOpenSession(val);
  };

  const handleClose = () => {
    const val = parseFloat(amountInput);
    if (!isNaN(val)) onCloseSession(val);
  };

  const handleAddExpense = () => {
    const val = parseFloat(expenseAmount);
    if (!expenseDesc || isNaN(val)) return;
    
    const t: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'EXPENSE',
      description: expenseDesc,
      amount: val,
      paymentMethod: PaymentMethod.MONEY,
      status: 'COMPLETED'
    };
    onAddTransaction(t);
    setExpenseDesc('');
    setExpenseAmount('');
  };

  const handleConfirmCancel = () => {
      if(cancelId && cancelReason.trim()) {
          onCancelTransaction(cancelId, cancelReason);
          setCancelId(null);
          setCancelReason('');
      }
  }

  // Icons helper
  const getMethodIcon = (method: string) => {
    switch (method) {
      case PaymentMethod.MONEY: return <Banknote size={18} />;
      case PaymentMethod.PIX: return <QrCode size={18} />;
      case PaymentMethod.CREDIT: return <CreditCard size={18} />;
      case PaymentMethod.DEBIT: return <CreditCard size={18} />;
      case PaymentMethod.TERM: return <CalendarClock size={18} />;
      default: return <Wallet size={18} />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case PaymentMethod.MONEY: return 'bg-green-100 text-green-700 border-green-200';
      case PaymentMethod.PIX: return 'bg-teal-100 text-teal-700 border-teal-200';
      case PaymentMethod.CREDIT: return 'bg-blue-100 text-blue-700 border-blue-200';
      case PaymentMethod.DEBIT: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case PaymentMethod.TERM: return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (!currentSession) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] animate-fade-in p-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl text-center max-w-lg w-full border border-slate-100">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Caixa Fechado</h2>
          <p className="text-slate-500 mb-8">Informe o valor inicial em dinheiro para abrir o caixa de hoje.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-left text-sm font-medium text-slate-700 mb-1 ml-1">Fundo de Troco (R$)</label>
              <input 
                type="number" 
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full text-center text-2xl font-bold p-4 border-2 border-slate-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
            <button 
              onClick={handleOpen}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <Unlock size={20} />
              <span>Abrir Caixa</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      
      {/* --- Top Row: Main Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Physical Drawer Balance */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <Banknote size={100} />
          </div>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wider flex items-center">
            <Unlock size={14} className="mr-1" />
            Saldo em Gaveta (Físico)
          </p>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-slate-800">{currency.format(currentDrawerBalance)}</span>
          </div>
          <div className="mt-4 flex space-x-4 text-sm">
            <span className="text-emerald-600 flex items-center font-medium bg-emerald-50 px-2 py-1 rounded" title="Total entrado no caixa físico (inclui fundo de troco)">
              <ArrowUpRight size={14} className="mr-1" />
              {currency.format(totals.moneyIn)}
            </span>
            <span className="text-red-500 flex items-center font-medium bg-red-50 px-2 py-1 rounded" title="Total de sangrias/despesas">
              <ArrowDownLeft size={14} className="mr-1" />
              {currency.format(totals.moneyOut)}
            </span>
          </div>
        </div>

        {/* Total Sales (All Methods) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Faturamento Total do Turno</p>
          <div className="mt-2 flex items-center text-primary">
            <span className="text-4xl font-bold">{currency.format(totals.totalRevenue)}</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Vendas + Entradas Extras (Exclui Fundo de Troco)</p>
        </div>
      </div>

      {/* --- Mini Cards: Income Breakdown --- */}
      <div>
        <h3 className="font-bold text-lg text-slate-800 mb-3 flex items-center">
          <Wallet className="mr-2 text-slate-500" size={20}/>
          Detalhamento de Vendas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[PaymentMethod.MONEY, PaymentMethod.PIX, PaymentMethod.CREDIT, PaymentMethod.DEBIT, PaymentMethod.TERM].map(method => {
             const amount = totals.byMethod[method] || 0;
             const colorClass = getMethodColor(method);
             
             return (
               <div key={method} className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:scale-105 ${colorClass}`}>
                 <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-xs uppercase opacity-70">{method}</span>
                    <div className="opacity-80">{getMethodIcon(method)}</div>
                 </div>
                 <span className="text-lg font-bold">{currency.format(amount)}</span>
               </div>
             );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">Todas as Movimentações</h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-medium">Turno Atual</span>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Método</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessionTransactions.slice().reverse().map(t => (
                  <tr key={t.id} className={`hover:bg-slate-50 ${t.status === 'CANCELLED' ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-6 py-4 text-sm text-slate-500 relative">
                      {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {t.status === 'CANCELLED' && <span className="absolute top-8 left-6 text-[10px] text-red-500 font-bold">CANCELADO</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        <span className={t.status === 'CANCELLED' ? 'line-through decoration-red-500' : ''}>{t.description}</span>
                        {t.cancellationReason && (
                            <div className="text-xs text-red-400 mt-1 italic">Motivo: {t.cancellationReason}</div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit space-x-1 ${
                        t.type === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                         {t.type !== 'EXPENSE' && getMethodIcon(t.paymentMethod as string)}
                         <span>{t.type === 'EXPENSE' ? 'Sangria' : t.paymentMethod}</span>
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${
                       t.type === 'EXPENSE' ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                       <span className={t.status === 'CANCELLED' ? 'line-through' : ''}>
                          {t.type === 'EXPENSE' ? '-' : '+'} {currency.format(t.amount)}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        {t.status !== 'CANCELLED' && (
                            <button 
                                onClick={() => setCancelId(t.id)}
                                title="Cancelar Transação"
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Ban size={16} />
                            </button>
                        )}
                    </td>
                  </tr>
                ))}
                {sessionTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">Nenhuma movimentação ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Feed */}
          <div className="md:hidden divide-y divide-slate-100">
            {sessionTransactions.slice().reverse().map(t => (
                <div key={t.id} className={`p-4 flex flex-col space-y-2 ${t.status === 'CANCELLED' ? 'opacity-50 grayscale bg-slate-50' : ''}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400 font-mono flex items-center">
                                {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            {t.status === 'CANCELLED' && (
                                <span className="text-[10px] font-bold text-red-500 uppercase">Cancelado</span>
                            )}
                        </div>
                        <span className={`font-bold ${t.type === 'EXPENSE' ? 'text-red-600' : 'text-emerald-600'} ${t.status === 'CANCELLED' ? 'line-through' : ''}`}>
                             {t.type === 'EXPENSE' ? '-' : '+'} {currency.format(t.amount)}
                        </span>
                    </div>
                    <p className={`font-medium text-slate-700 text-sm ${t.status === 'CANCELLED' ? 'line-through' : ''}`}>{t.description}</p>
                    
                    <div className="flex justify-between items-center mt-2">
                         <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                                t.type === 'EXPENSE' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                                {t.type !== 'EXPENSE' && getMethodIcon(t.paymentMethod as string)}
                                <span>{t.type === 'EXPENSE' ? 'Sangria' : t.paymentMethod}</span>
                        </span>
                        {t.status !== 'CANCELLED' && (
                            <button 
                                onClick={() => setCancelId(t.id)}
                                className="text-xs text-red-500 flex items-center space-x-1 border border-red-100 px-2 py-1 rounded-md bg-white shadow-sm"
                            >
                                <Ban size={12} /> <span>Cancelar</span>
                            </button>
                        )}
                    </div>
                </div>
            ))}
             {sessionTransactions.length === 0 && (
                 <div className="p-8 text-center text-slate-400 text-sm">Nenhuma movimentação ainda.</div>
             )}
        </div>
        </div>

        {/* Actions Side */}
        <div className="space-y-6">
          {/* Add Expense */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
              <ArrowDownLeft size={20} className="mr-2 text-red-500" />
              Registrar Sangria/Despesa
            </h3>
            <p className="text-xs text-slate-500 mb-3">Retirada de dinheiro físico da gaveta.</p>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Descrição (ex: Compra de material)"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-200 outline-none"
                value={expenseDesc}
                onChange={e => setExpenseDesc(e.target.value)}
              />
              <input 
                type="number" 
                placeholder="Valor (R$)"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-200 outline-none"
                value={expenseAmount}
                onChange={e => setExpenseAmount(e.target.value)}
              />
              <button 
                onClick={handleAddExpense}
                className="w-full bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-900 transition-colors"
              >
                Registrar Saída
              </button>
            </div>
          </div>

          {/* Close Register */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
              <Lock size={20} className="mr-2 text-slate-400" />
              Fechar Caixa
            </h3>
            <p className="text-sm text-slate-500 mb-4">Conte o dinheiro físico na gaveta e informe abaixo para fechar o turno.</p>
            <div className="space-y-3">
              <input 
                type="number" 
                placeholder="Valor contado na gaveta"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-lg font-bold text-center"
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
              />
              <button 
                onClick={handleClose}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/30 transition-all"
              >
                Encerrar Dia
              </button>
            </div>
          </div>
        </div>
      </div>

       {/* Cancel Confirmation Modal */}
       {cancelId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
              <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                      <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Cancelar Transação</h3>
                  <p className="text-sm text-slate-500 mb-4">Esta ação é irreversível. Se for uma venda, o estoque será devolvido.</p>
                  
                  <div className="mb-4 text-left">
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Motivo (Obrigatório)</label>
                      <textarea 
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none h-24"
                        placeholder="Ex: Cliente desistiu, erro de lançamento..."
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                      />
                  </div>

                  <div className="flex space-x-3">
                      <button 
                        onClick={() => { setCancelId(null); setCancelReason(''); }}
                        className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                      >
                          Voltar
                      </button>
                      <button 
                        onClick={handleConfirmCancel}
                        disabled={!cancelReason.trim()}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
                      >
                          Confirmar
                      </button>
                  </div>
              </div>
           </div>
        </div>
       )}
    </div>
  );
};