import type { Timestamp } from 'firebase/firestore';

export type SubscriptionPlan = 'free_trial' | 'premium';
export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Credit';
export type TransactionType = 'sale' | 'restock' | 'adjustment' | 'initial';
export type NotificationType = 'low_stock' | 'out_of_stock' | 'reorder_placed' | 'system';

export interface UserProfile {
  uid: string;
  fullName: string;
  businessName: string;
  email: string;
  mobileNumber: string;
  plan: SubscriptionPlan;
  trialEndsAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BusinessProfile {
  ownerId: string;
  businessName: string;
  shopCategory: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  gstin?: string;
  currency: 'INR';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Product {
  id: string;
  ownerId: string;
  name: string;
  sku: string;
  category: string;
  stockQuantity: number;
  minStockLevel: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierName: string;
  unit: string;
  imageUrl?: string;
  totalUnitsSold: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPurchasePrice: number;
  unitSellingPrice: number;
  lineTotal: number;
  lineProfit: number;
}

export interface Sale {
  id: string;
  ownerId: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  items: SaleItem[];
  itemCount: number;
  totalAmount: number;
  totalCost: number;
  grossProfit: number;
  status: 'completed';
  createdAt: Timestamp;
}

export interface InventoryTransaction {
  id: string;
  ownerId: string;
  type: TransactionType;
  productId: string;
  productName: string;
  quantityDelta: number;
  amount: number;
  referenceId?: string;
  note: string;
  createdAt: Timestamp;
}

export interface AlertNotification {
  id: string;
  ownerId: string;
  type: NotificationType;
  productId: string;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  suggestedReorderQty: number;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface RegistrationMetadata {
  fullName: string;
  businessName: string;
  mobileNumber: string;
}

export const PRODUCT_CATEGORIES = [
  'Grocery & Kirana',
  'Beverages & Snacks',
  'Stationery & Office',
  'Mobile Accessories',
  'Clothing & Apparel',
  'Personal Care',
  'Household & Cleaning',
  'Electronics & Electricals',
  'Other',
] as const;

export const SHOP_CATEGORIES = [
  'Kirana & Grocery Store',
  'Stationery & Book Shop',
  'Mobile & Electronics Accessories',
  'Clothing & Boutique',
  'General & Departmental Store',
  'Hardware & Electricals',
  'Medical & Wellness Retail',
  'Other Retail',
] as const;

export const PRODUCT_UNITS = [
  'pcs',
  'kg',
  'g',
  'litre',
  'ml',
  'pack',
  'box',
  'dozen',
  'pair',
] as const;

export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Card', 'Credit'];
