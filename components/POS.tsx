import React, { useState, useMemo } from 'react';
import { Product, PaymentMethod, Transaction, CashRegisterSession } from '../types';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, CalendarClock, ChevronLeft, Calculator, ChevronDown, ChevronUp, Search, User } from 'lucide-react';
import { currency } from '../utils';

interface POSProps {
  products: Product[];
  onSaleComplete: (transaction: Transaction, updatedProducts: Product[]) => void;
  currentSession: CashRegisterSession | undefined;
}

export const POS: React.FC<POSProps> = ({ products, onSaleComplete, currentSession }) => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [termNote, setTermNote] = useState<string>(''); // New state for Term notes
  const [showAllProducts, setShowAllProducts] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
  );

  const displayedProducts = showAllProducts ? filteredProducts : filteredProducts.slice(0, 4);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= item.product.stock) return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const total = useMemo(() => cart.reduce((acc, item) => currency.add(acc, currency.multiply(item.product.sellPrice, item.quantity)), 0), [cart]);
  
  const changeAmount = useMemo(() => {
    const received = parseFloat(receivedAmount.replace(',', '.'));
    if (isNaN(received)) return 0;
    return Math.max(0, currency.subtract(received, total));
  }, [receivedAmount, total]);

  const handleCheckout = () => {
    if (!selectedPayment) return;
    if (!currentSession && selectedPayment === PaymentMethod.MONEY) {
      alert("Para receber em dinheiro, você precisa abrir o caixa primeiro na aba 'Fluxo de Caixa'.");
      return;
    }

    let finalDescription = `Venda PDV - ${cart.length} itens`;

    if (selectedPayment === PaymentMethod.MONEY) {
      const received = parseFloat(receivedAmount.replace(',', '.'));
      if (isNaN(received) || received < total) {
        alert("Valor recebido inválido ou menor que o total.");
        return;
      }
      finalDescription += ` | Recebido: ${currency.format(received)} | Troco: ${currency.format(changeAmount)}`;
    }

    if (selectedPayment === PaymentMethod.TERM && termNote.trim()) {
      finalDescription += ` | Cliente/Obs: ${termNote.trim()}`;
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'SALE',
      description: finalDescription,
      amount: total,
      paymentMethod: selectedPayment,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        name: item.product.name,
        price: item.product.sellPrice
      }))
    };

    // Update stocks
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(c => c.product.id === p.id);
      if (cartItem) {
        return { ...p, stock: p.stock - cartItem.quantity };
      }
      return p;
    });

    onSaleComplete(transaction, updatedProducts);
    setCart([]);
    setIsCheckoutModalOpen(false);
    setSelectedPayment(null);
    setReceivedAmount('');
    setTermNote(''); // Reset note
    setShowAllProducts(false); // Reset view
  };

  if (!currentSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 p-4">
        <div className="p-6 bg-orange-100 rounded-full text-orange-600">
          <Banknote size={48} />
        </div>
        <h2 className="text-xl font-bold text-slate-700">Caixa Fechado</h2>
        <p className="max-w-md text-center text-sm md:text-base">Para realizar vendas, por favor abra o caixa na aba "Fluxo de Caixa".</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] relative">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-32 md:pb-6 px-1">
        
        {/* --- Catalog Section --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Search className="text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              className="flex-1 outline-none text-slate-700 placeholder-slate-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayedProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-primary/50 cursor-pointer active:scale-95 transition-all flex flex-col justify-between min-h-[100px]"
              >
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-tight">{product.name}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">{product.category}</p>
                </div>
                <div className="mt-2 flex justify-between items-end">
                  <span className="font-bold text-primary">{currency.format(product.sellPrice)}</span>
                  <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-600 border border-slate-100">Est: {product.stock}</span>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          {filteredProducts.length > 4 && (
              <button 
                  onClick={() => setShowAllProducts(!showAllProducts)}
                  className="w-full mt-4 py-2 flex items-center justify-center space-x-2 text-primary font-medium bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
              >
                  {showAllProducts ? (
                      <><span>Mostrar menos</span><ChevronUp size={16} /></>
                  ) : (
                      <><span>Ver todos ({filteredProducts.length})</span><ChevronDown size={16} /></>
                  )}
              </button>
          )}
        </div>

        {/* --- Cart Section (Fully visible list) --- */}
        <div className="bg-white rounded-t-xl md:rounded-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between rounded-t-xl">
            <h2 className="font-bold text-lg text-slate-800 flex items-center space-x-2">
              <ShoppingCart size={20} />
              <span>Carrinho de Compras ({cart.length})</span>
            </h2>
            <button 
               onClick={() => setCart([])}
               className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50" 
               disabled={cart.length === 0}
            >
               Limpar Tudo
            </button>
          </div>
          
          <div className="p-4 space-y-3 min-h-[100px]">
            {cart.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <ShoppingCart size={32} className="opacity-20" />
                <p className="text-sm">Seu carrinho está vazio</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between bg-white border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-medium text-slate-800 text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-500">{currency.format(item.product.sellPrice)} x {item.quantity} = <span className="font-semibold text-slate-700">{currency.format(item.product.sellPrice * item.quantity)}</span></p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:text-red-500 bg-white rounded shadow-sm"><Minus size={14} /></button>
                          <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:text-green-500 bg-white rounded shadow-sm"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                      </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- Sticky Footer Action --- */}
      <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-0 md:left-0 md:right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-20 md:rounded-b-xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500 font-medium">Total a Pagar</span>
            <span className="text-2xl font-bold text-slate-900">{currency.format(total)}</span>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutModalOpen(true)}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>Finalizar Venda</span>
            <ChevronLeft className="rotate-180" size={20} />
          </button>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                 <h2 className="text-2xl font-bold text-slate-800">Pagamento</h2>
                 <p className="text-slate-500 text-sm">Total: <span className="font-bold text-slate-900">{currency.format(total)}</span></p>
              </div>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><ChevronLeft className="rotate-180" size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
               <div className="grid grid-cols-2 gap-3 mb-6">
               {[
                 { id: PaymentMethod.MONEY, label: 'Dinheiro', icon: Banknote, color: 'text-green-600', bg: 'bg-green-50' },
                 { id: PaymentMethod.PIX, label: 'Pix', icon: QrCode, color: 'text-teal-600', bg: 'bg-teal-50' },
                 { id: PaymentMethod.CREDIT, label: 'Crédito', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                 { id: PaymentMethod.DEBIT, label: 'Débito', icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                 { id: PaymentMethod.TERM, label: 'A Prazo', icon: CalendarClock, color: 'text-orange-600', bg: 'bg-orange-50' },
               ].map((method) => (
                 <button
                    key={method.id}
                    onClick={() => {
                        setSelectedPayment(method.id as PaymentMethod);
                        setReceivedAmount('');
                        setTermNote('');
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedPayment === method.id 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                      : 'border-slate-100 hover:border-slate-300'
                    }`}
                 >
                   <div className={`p-3 rounded-full ${method.bg} ${method.color} mb-2`}>
                     <method.icon size={24} />
                   </div>
                   <span className="font-semibold text-sm text-slate-700">{method.label}</span>
                 </button>
               ))}
               </div>

               {selectedPayment === PaymentMethod.MONEY && (
                 <div className="bg-green-50 p-6 rounded-2xl border border-green-100 animate-fade-in">
                    <h3 className="font-bold text-green-800 mb-4 flex items-center">
                        <Calculator size={20} className="mr-2"/>
                        Calculadora de Troco
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Valor Recebido (R$)</label>
                            <input 
                                type="number"
                                inputMode="decimal"
                                value={receivedAmount}
                                onChange={e => setReceivedAmount(e.target.value)}
                                className="w-full text-2xl font-bold p-3 rounded-lg border-2 border-green-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 outline-none text-slate-800"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-green-100">
                             <span className="text-slate-500 font-medium">Troco a devolver</span>
                             <span className="text-2xl font-bold text-green-600">{currency.format(changeAmount)}</span>
                        </div>
                    </div>
                 </div>
               )}

               {selectedPayment === PaymentMethod.TERM && (
                 <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 animate-fade-in">
                    <h3 className="font-bold text-orange-800 mb-4 flex items-center">
                        <User size={20} className="mr-2"/>
                        Dados do Cliente / Observações
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-orange-700 mb-1">Nome do Cliente / Anotações</label>
                            <textarea 
                                value={termNote}
                                onChange={e => setTermNote(e.target.value)}
                                className="w-full p-3 rounded-lg border-2 border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none text-slate-800 h-24 resize-none"
                                placeholder="Ex: João Silva - Paga dia 20..."
                                autoFocus
                            />
                        </div>
                        <div className="p-3 bg-white rounded-lg text-xs text-orange-600 border border-orange-100">
                           Esta anotação ficará salva no histórico da transação para conferência futura.
                        </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex space-x-4">
                <button 
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  disabled={!selectedPayment || (selectedPayment === PaymentMethod.MONEY && (parseFloat(receivedAmount) < total || !receivedAmount))}
                  onClick={handleCheckout}
                  className="flex-[2] px-8 py-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center"
                >
                  <span className="mr-2">Confirmar ({currency.format(total)})</span>
                  <ChevronLeft className="rotate-180" size={20} />
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};