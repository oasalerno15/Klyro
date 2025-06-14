export interface Transaction {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string[];
  date: string;
  source: string;
  confidence?: number;
  items?: any;
  file_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ReceiptTransaction {
  merchant: string;
  amount: number;
  category: string;
  date: string;
  confidence: number;
  items?: any[];
  fileName?: string;
} 