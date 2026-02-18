import { GoogleGenAI } from "@google/genai";
import { Product, Transaction, CashRegisterSession } from "../types";

const initGenAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeBusinessData = async (
  inventory: Product[],
  transactions: Transaction[],
  cashSessions: CashRegisterSession[]
): Promise<string> => {
  const ai = initGenAI();
  if (!ai) return "Erro: API Key não configurada. Configure a variável de ambiente API_KEY.";

  // Prepare summary data to minimize token usage
  const summary = {
    totalProducts: inventory.length,
    lowStockItems: inventory.filter(i => i.stock <= i.minStock).map(i => i.name),
    recentTransactions: transactions.slice(-20), // Last 20
    currentCashSession: cashSessions.find(c => c.status === 'OPEN'),
    totalRevenue: transactions.filter(t => t.type === 'SALE').reduce((acc, t) => acc + t.amount, 0),
  };

  const prompt = `
    Atue como um consultor de negócios sênior especializado em pequenas empresas brasileiras.
    Analise os seguintes dados brutos da empresa (em formato JSON) e forneça um relatório estratégico curto e direto.
    
    Dados:
    ${JSON.stringify(summary)}

    Instruções:
    1. Identifique tendências de vendas com base nas transações recentes.
    2. Alerte sobre produtos com estoque crítico.
    3. Dê 3 conselhos práticos para melhorar o fluxo de caixa ou vendas.
    4. Use formatação Markdown (negrito, listas) para facilitar a leitura.
    5. Seja encorajador e profissional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster response
      }
    });
    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro ao conectar com a Inteligência Artificial.";
  }
};