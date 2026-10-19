export const CATEGORIES = ['تيشرتات', 'بنطلونات', 'هوديز وسويت شيرت', 'جاكيتات'] as const;

export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  price_base: number;
  category: string;
  image?: string;
  stock: number;
  available_sizes?: string[];
  available_colors?: string[];
}

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  color: string;
  qty: number;
  price: number;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
}
