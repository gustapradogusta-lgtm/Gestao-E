import React, { useState, useEffect } from 'react';
import { Transaction, Product, CashRegisterSession } from '../types';
import { TrendingUp, AlertTriangle, Package, DollarSign, Clock, CloudCheck } from 'lucide-react';
import { currency } from '../utils';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
  currentSession: CashRegisterSession | undefined;
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, products, currentSession, setActiveTab }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second and detect day transition
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's Date Calculation (consistent with pt-BR)
  const todayStr = currentTime.toLocaleDateString('pt-BR');
  
  // Filter active (not cancelled) transactions for Today
  const todaysTransactions = transactions.filter(t => 
    new Date(t.date).toLocaleDateString('pt-BR') === todayStr && 
    t.status !== 'CANCELLED'
  );

  const todaysSales = todaysTransactions
    .filter(t => t.type === 'SALE')
    .reduce((acc, t) => acc + t.amount, 0);

  const salesCount = todaysTransactions.filter(t => t.type === 'SALE').length;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Visão Geral</h2>
          <div className="flex items-center space-x-2 text-slate-500 mt-1">
            <Clock size={16} className="text-primary" />
            <span className="font-medium">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-slate-700">{currentTime.toLocaleTimeString('pt-BR')}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
             <CloudCheck size={12} />
             <span>DADOS SINCRONIZADOS</span>
          </div>
          <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${
            currentSession 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {currentSession ? 'Caixa Aberto' : 'Caixa Fechado'}
          </span>
        </div>
      </div>

      {/* Today's Summary Banner - Simplified */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1 flex overflow-hidden shadow-sm">
        <div className="bg-primary text-white p-8 w-full text-center md:text-left flex flex-col md:flex-row justify-between items-center">
           <div>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Faturamento Hoje</p>
              <h3 className="text-5xl font-black">{currency.format(todaysSales)}</h3>
              <p className="text-sm mt-2 opacity-90">{salesCount} vendas processadas com sucesso</p>
           </div>
           <div className="mt-4 md:mt-0 px-6 py-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <p className="text-[10px] font-bold opacity-70 uppercase">Status do Sistema</p>
              <p className="text-sm font-bold">Operando em Nuvem</p>
           </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <button 
          onClick={() => setActiveTab('pos')}
          className="p-8 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-primary/50 hover:shadow-md transition-all text-left group flex items-center justify-between"
        >
          <div>
            <h3 className="text-2xl font-black text-slate-800 group-hover:text-primary transition-colors uppercase tracking-tight">Venda Rápida</h3>
            <p className="text-slate-500 mt-1">Lançar nova venda no PDV</p>
          </div>
          <DollarSign size={40} className="text-slate-200 group-hover:text-primary/30 transition-colors" />
        </button>
        <button 
           onClick={() => setActiveTab('inventory')}
           className="p-8 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-primary/50 hover:shadow-md transition-all text-left group flex items-center justify-between"
        >
          <div>
            <h3 className="text-2xl font-black text-slate-800 group-hover:text-primary transition-colors uppercase tracking-tight">Estoque</h3>
            <p className="text-slate-500 mt-1">Gerenciar catálogo e entradas</p>
          </div>
          <Package size={40} className="text-slate-200 group-hover:text-primary/30 transition-colors" />
        </button>
      </div>
    </div>
  );
};