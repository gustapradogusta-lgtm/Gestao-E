import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Search, Edit2, Trash2, AlertTriangle, PackagePlus, Factory, Package } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  onStockEntry: (productId: string, quantity: number, type: 'BUY' | 'PRODUCE', costTotal: number) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, setProducts, onStockEntry }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  // Stock Entry State
  const [stockMode, setStockMode] = useState<'BUY' | 'PRODUCE'>('BUY');
  const [stockQty, setStockQty] = useState('');
  const [stockCost, setStockCost] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    costPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 5
  });

  // Summary Data
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);

  // --- CRUD Handlers ---
  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        costPrice: 0,
        sellPrice: 0,
        stock: 0,
        minStock: 5
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.sellPrice) return;

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...formData, id: p.id } as Product : p));
    } else {
      const newProduct: Product = {
        ...formData as Product,
        id: crypto.randomUUID()
      };
      setProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // --- Stock/Production Handlers ---
  const handleOpenStockModal = (product: Product) => {
    setStockProduct(product);
    setStockQty('');
    setStockCost('');
    setStockMode('BUY');
    setIsStockModalOpen(true);
  };

  const handleSubmitStock = () => {
    if (!stockProduct || !stockQty) return;
    const qty = parseInt(stockQty);
    const cost = stockMode === 'BUY' ? parseFloat(stockCost) : 0;
    
    if (isNaN(qty) || qty <= 0) return;
    if (stockMode === 'BUY' && isNaN(cost)) return;

    onStockEntry(stockProduct.id, qty, stockMode, cost);
    setIsStockModalOpen(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Controle de Estoque</h2>
          <p className="text-slate-500">Gerencie produtos e produção</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-md hover:shadow-lg w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Summary Cards moved from Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estoque Crítico</p>
              <h3 className={`text-3xl font-bold mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {lowStockCount}
              </h3>
            </div>
            <div className={`p-3 rounded-xl transition-colors ${lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400 font-medium">Itens abaixo do estoque mínimo</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total em Estoque</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">
                {totalUnits} <span className="text-sm font-normal text-slate-400 ml-1">unidades</span>
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Package size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400 font-medium">{products.length} categorias cadastradas</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou categoria..." 
          className="flex-1 outline-none text-slate-700 placeholder-slate-400 min-w-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Responsive Wrapper */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Produto</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Custo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Venda</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Estoque</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{product.name}</td>
                  <td className="px-6 py-4 text-slate-500">
                    <span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">R$ {product.costPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-medium text-emerald-600">R$ {product.sellPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock <= product.minStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {product.stock <= product.minStock && <AlertTriangle size={12} />}
                      <span>{product.stock} un</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                       <button 
                        onClick={() => handleOpenStockModal(product)}
                        title="Produzir / Repor Estoque"
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <PackagePlus size={16} />
                      </button>
                      <button onClick={() => handleOpenModal(product)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredProducts.map(product => (
            <div key={product.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-slate-800 line-clamp-2">{product.name}</h3>
                  <span className="inline-block px-2 py-0.5 mt-1 bg-slate-100 rounded-md text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    {product.category}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-emerald-600 text-lg">R$ {product.sellPrice.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">Custo: R$ {product.costPrice.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                  product.stock <= product.minStock ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                }`}>
                  {product.stock <= product.minStock && <AlertTriangle size={14} />}
                  <span>{product.stock} em estoque</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleOpenStockModal(product)}
                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100"
                  >
                    <PackagePlus size={18} />
                  </button>
                  <button 
                    onClick={() => handleOpenModal(product)} 
                    className="p-2 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)} 
                    className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
           {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                Nenhum produto encontrado.
              </div>
           )}
        </div>
      </div>

      {/* Edit/New Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preço de Custo</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.costPrice}
                    onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preço de Venda</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.sellPrice}
                    onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Inicial</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.minStock}
                    onChange={e => setFormData({...formData, minStock: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3 sticky bottom-0 z-10">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Management Modal (Production vs Purchase) */}
      {isStockModalOpen && stockProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Gerenciar Estoque</h3>
                    <p className="text-xs text-slate-500">{stockProduct.name}</p>
                </div>
                <button onClick={() => setIsStockModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100">
                  <button 
                    onClick={() => setStockMode('BUY')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center space-x-2 border-b-2 transition-colors ${stockMode === 'BUY' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                  >
                    <PackagePlus size={16} />
                    <span>Entrada / Compra</span>
                  </button>
                  <button 
                    onClick={() => setStockMode('PRODUCE')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center space-x-2 border-b-2 transition-colors ${stockMode === 'PRODUCE' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                  >
                    <Factory size={16} />
                    <span>Produção Interna</span>
                  </button>
              </div>

              <div className="p-6 space-y-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700 mb-4">
                      {stockMode === 'BUY' 
                        ? 'Registrar entrada de produtos comprados de fornecedores. Irá gerar uma despesa no caixa.'
                        : 'Registrar produtos fabricados/produzidos internamente. Apenas aumenta o estoque.'
                      }
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade a Adicionar</label>
                      <input 
                        type="number" 
                        value={stockQty}
                        onChange={e => setStockQty(e.target.value)}
                        className="w-full px-4 py-3 text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        placeholder="0"
                        autoFocus
                      />
                  </div>

                  {stockMode === 'BUY' && (
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Custo Total da Compra (R$)</label>
                        <input 
                            type="number" 
                            value={stockCost}
                            onChange={e => setStockCost(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder="0.00"
                        />
                     </div>
                  )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                  <button onClick={() => setIsStockModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                  <button 
                    onClick={handleSubmitStock} 
                    className={`px-4 py-2 text-white font-medium rounded-lg shadow-lg transition-all active:scale-95 flex items-center space-x-2 ${
                        stockMode === 'BUY' ? 'bg-primary hover:bg-primary/90 shadow-primary/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
                    }`}
                  >
                    {stockMode === 'BUY' ? <PackagePlus size={18} /> : <Factory size={18} />}
                    <span>{stockMode === 'BUY' ? 'Confirmar Compra' : 'Confirmar Produção'}</span>
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};