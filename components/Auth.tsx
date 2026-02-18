import React, { useState } from 'react';
import { User } from '../types';
import { Store, UserCircle2, ArrowRight } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    storeName: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple LocalStorage Auth Simulation
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (isLogin) {
      const user = existingUsers.find((u: any) => u.email === formData.email && u.password === formData.password);
      if (user) {
        onLogin(user);
      } else {
        alert('Email ou senha inválidos');
      }
    } else {
      if (!formData.name || !formData.storeName || !formData.email || !formData.password) return;
      
      const newUser = {
        id: crypto.randomUUID(),
        ...formData
      };
      
      // Save
      localStorage.setItem('users', JSON.stringify([...existingUsers, newUser]));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side (Visual) */}
        <div className="md:w-1/2 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/80 to-purple-600/80 z-10"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary rounded-full blur-3xl opacity-50 z-0"></div>
          
          <div className="relative z-20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm mb-6">
              <Store size={24} />
            </div>
            <h1 className="text-4xl font-bold mb-4">FluxoMaster AI</h1>
            <p className="text-slate-200 leading-relaxed">Gerencie seu negócio com inteligência. Estoque, Caixa e PDV unificados em uma experiência premium.</p>
          </div>

          <div className="relative z-20 mt-12">
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
              <span>Controle total do fluxo de caixa</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-300 mt-4">
               <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
               <span>Consultoria com Inteligência Artificial</span>
            </div>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="text-slate-500 mb-8">
            {isLogin ? 'Entre com suas credenciais para acessar.' : 'Comece a gerenciar sua empresa hoje.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Seu Nome</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome da Empresa</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={formData.storeName}
                    onChange={e => setFormData({...formData, storeName: e.target.value})}
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center space-x-2 mt-4 active:scale-95"
            >
              <span>{isLogin ? 'Entrar' : 'Cadastrar'}</span>
              <ArrowRight size={20} />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 font-bold text-primary hover:underline"
            >
              {isLogin ? 'Cadastre-se' : 'Fazer Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};