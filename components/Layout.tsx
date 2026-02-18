import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Banknote, 
  BarChart3, 
  LogOut, 
  Store,
  Menu,
  X
} from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-primary text-white shadow-lg shadow-primary/30' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-dark text-white flex flex-col shadow-2xl 
        transform transition-transform duration-300 ease-in-out 
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-primary p-2 rounded-lg shrink-0">
              <Store size={24} className="text-white" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg leading-tight truncate" title={user?.storeName || 'FluxoMaster'}>
                {user?.storeName || 'FluxoMaster'}
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-primary font-black">Sistema AI</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Visão Geral" 
            active={activeTab === 'dashboard'} 
            onClick={() => handleTabClick('dashboard')} 
          />
          <SidebarItem 
            icon={ShoppingCart} 
            label="PDV / Vendas" 
            active={activeTab === 'pos'} 
            onClick={() => handleTabClick('pos')} 
          />
          <SidebarItem 
            icon={Package} 
            label="Estoque" 
            active={activeTab === 'inventory'} 
            onClick={() => handleTabClick('inventory')} 
          />
          <SidebarItem 
            icon={Banknote} 
            label="Fluxo de Caixa" 
            active={activeTab === 'cashflow'} 
            onClick={() => handleTabClick('cashflow')} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Relatórios & IA" 
            active={activeTab === 'reports'} 
            onClick={() => handleTabClick('reports')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center font-bold text-lg shadow-inner">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all duration-200 text-sm font-bold border border-red-500/20"
          >
            <LogOut size={16} />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-700 p-1">
              <Menu size={24} />
            </button>
            <span className="font-bold text-slate-800 text-lg truncate max-w-[150px]">{user?.storeName}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md">
             {user?.name.charAt(0).toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 relative p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};