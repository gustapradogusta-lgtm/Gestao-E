import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { POS } from './components/POS';
import { CashRegister } from './components/CashRegister';
import { Reports } from './components/Reports';
import { Product, Transaction, CashRegisterSession, User, PaymentMethod } from './types';

// Initial Mock Data for new users
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Coca-Cola 350ml', category: 'Bebidas', costPrice: 2.50, sellPrice: 5.00, stock: 48, minStock: 12 },
  { id: '2', name: 'Salgado Assado', category: 'Lanches', costPrice: 3.00, sellPrice: 7.50, stock: 15, minStock: 5 },
  { id: '3', name: 'Chiclete Trident', category: 'Doces', costPrice: 1.50, sellPrice: 3.00, stock: 100, minStock: 20 },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // App Data
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashSessions, setCashSessions] = useState<CashRegisterSession[]>([]);

  // 1. Load User Session on Mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 2. Load User-Specific Data when user changes
  useEffect(() => {
    if (user) {
      const userId = user.id;
      
      const storedProducts = localStorage.getItem(`products_${userId}`);
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(INITIAL_PRODUCTS);
      }

      const storedTransactions = localStorage.getItem(`transactions_${userId}`);
      setTransactions(storedTransactions ? JSON.parse(storedTransactions) : []);

      const storedSessions = localStorage.getItem(`cashSessions_${userId}`);
      setCashSessions(storedSessions ? JSON.parse(storedSessions) : []);
    } else {
      // Clear state on logout
      setProducts([]);
      setTransactions([]);
      setCashSessions([]);
      setActiveTab('dashboard');
    }
  }, [user]);

  // 3. Save User-Specific Data on Changes
  useEffect(() => {
    if (user && products.length >= 0) {
      localStorage.setItem(`products_${user.id}`, JSON.stringify(products));
    }
  }, [products, user]);

  useEffect(() => {
    if (user && transactions.length >= 0) {
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(transactions));
    }
  }, [transactions, user]);

  useEffect(() => {
    if (user && cashSessions.length >= 0) {
      localStorage.setItem(`cashSessions_${user.id}`, JSON.stringify(cashSessions));
    }
  }, [cashSessions, user]);


  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
    localStorage.setItem('currentUser', JSON.stringify(loggedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const activeSession = cashSessions.find(s => s.status === 'OPEN');

  const handleOpenSession = (initialAmount: number) => {
    const newSession: CashRegisterSession = {
      id: crypto.randomUUID(),
      openedAt: new Date().toISOString(),
      closedAt: null,
      initialAmount,
      finalAmount: null,
      countedAmount: null,
      status: 'OPEN'
    };
    setCashSessions([...cashSessions, newSession]);
    
    // Create initial transaction log
    const t: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'INCOME',
      description: 'Abertura de Caixa',
      amount: initialAmount,
      paymentMethod: PaymentMethod.MONEY,
      status: 'COMPLETED'
    };
    setTransactions([...transactions, t]);
  };

  const handleCloseSession = (finalCount: number) => {
    if (!activeSession) return;
    
    const updatedSessions = cashSessions.map(s => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          closedAt: new Date().toISOString(),
          status: 'CLOSED' as const,
          countedAmount: finalCount
        };
      }
      return s;
    });
    setCashSessions(updatedSessions);
  };

  const handleSaleComplete = (transaction: Transaction, updatedProducts: Product[]) => {
    setTransactions([...transactions, { ...transaction, status: 'COMPLETED' }]);
    setProducts(updatedProducts);
  };

  const handleStockEntry = (productId: string, quantity: number, type: 'BUY' | 'PRODUCE', costTotal: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedProducts = products.map(p => 
      p.id === productId ? { ...p, stock: p.stock + quantity } : p
    );
    setProducts(updatedProducts);

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: type === 'BUY' ? 'EXPENSE' : 'PRODUCTION',
      description: type === 'BUY' 
        ? `Compra de Estoque: ${quantity}x ${product.name}` 
        : `Produção Interna: ${quantity}x ${product.name}`,
      amount: type === 'BUY' ? costTotal : 0,
      paymentMethod: type === 'BUY' ? PaymentMethod.MONEY : 'N/A',
      status: 'COMPLETED'
    };

    setTransactions([...transactions, transaction]);
  };

  const handleCancelTransaction = (transactionId: string, reason: string) => {
    const txToCancel = transactions.find(t => t.id === transactionId);
    if (!txToCancel || txToCancel.status === 'CANCELLED') return;

    const updatedTransactions = transactions.map(t => 
      t.id === transactionId ? { ...t, status: 'CANCELLED' as const, cancellationReason: reason } : t
    );
    setTransactions(updatedTransactions);

    if (txToCancel.type === 'SALE' && txToCancel.items) {
      const updatedProducts = [...products];
      txToCancel.items.forEach(item => {
        const prodIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (prodIndex > -1) {
          updatedProducts[prodIndex].stock += item.quantity;
        }
      });
      setProducts(updatedProducts);
    }
  };

  const handleImportTransactions = (newTransactions: Transaction[]) => {
    setTransactions(prev => [...prev, ...newTransactions]);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout}>
      {activeTab === 'dashboard' && (
        <Dashboard 
          transactions={transactions} 
          products={products} 
          currentSession={activeSession}
          setActiveTab={setActiveTab}
        />
      )}
      {activeTab === 'inventory' && (
        <Inventory 
          products={products} 
          setProducts={setProducts} 
          onStockEntry={handleStockEntry}
        />
      )}
      {activeTab === 'pos' && (
        <POS 
          products={products} 
          onSaleComplete={handleSaleComplete}
          currentSession={activeSession}
        />
      )}
      {activeTab === 'cashflow' && (
        <CashRegister 
          currentSession={activeSession}
          transactions={transactions}
          onOpenSession={handleOpenSession}
          onCloseSession={handleCloseSession}
          onAddTransaction={(t) => setTransactions([...transactions, { ...t, status: 'COMPLETED' }])}
          onCancelTransaction={handleCancelTransaction}
        />
      )}
      {activeTab === 'reports' && (
        <Reports 
          transactions={transactions} 
          products={products}
          cashSessions={cashSessions}
          onImportTransactions={handleImportTransactions}
        />
      )}
    </Layout>
  );
}

export default App;