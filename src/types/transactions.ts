export interface Transaction {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  need_vs_want?: 'need' | 'want' | null;
  mood_at_purchase?: string | null;
  ai_insight?: string | null;
  created_at: string;
  updated_at: string;
  receipt_data?: ReceiptData | null;
}

export interface ReceiptData {
  merchant: string;
  items: ReceiptItem[];
  confidence: number;
  raw_text?: string;
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface TransactionFormData {
  name: string;
  amount: number;
  date: string;
  category: string;
  need_vs_want?: 'need' | 'want';
  mood_at_purchase?: string;
}

export interface TransactionFilters {
  category?: string;
  need_vs_want?: 'need' | 'want';
  date_from?: string;
  date_to?: string;
  mood?: string;
}

export interface TransactionSummary {
  total_amount: number;
  transaction_count: number;
  average_amount: number;
  categories: Record<string, number>;
  needs_vs_wants: {
    needs: number;
    wants: number;
    unclassified: number;
  };
} 