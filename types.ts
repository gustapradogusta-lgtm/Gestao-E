export enum PaymentMethod {
  MONEY = 'Dinheiro',
  CREDIT = 'Crédito',
  DEBIT = 'Débito',
  PIX = 'Pix',
  TERM = 'A Prazo'
}

export interface Product {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO String
  type: 'SALE' | 'EXPENSE' | 'INCOME' | 'PRODUCTION';
  description: string;
  amount: number;
  paymentMethod: PaymentMethod | 'N/A'; // N/A for production/inventory logs
  items?: { productId: string; quantity: number; name: string; price: number }[];
  status?: 'COMPLETED' | 'CANCELLED';
  cancellationReason?: string;
}

export interface CashRegisterSession {
  id: string;
  openedAt: string;
  closedAt: string | null;
  initialAmount: number;
  finalAmount: number | null; // Calculated by system based on cash sales
  countedAmount: number | null; // Input by user
  status: 'OPEN' | 'CLOSED';
}

export interface User {
  id: string;
  name: string;
  email: string;
  storeName: string;
}

export interface AppState {
  user: User | null;
  inventory: Product[];
  transactions: Transaction[];
  cashSessions: CashRegisterSession[];
}