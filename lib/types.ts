export type OrderStatus = "pending" | "completed" | "cancelled";
export type SalesChannel = "online" | "branch";

export interface Customer {
  customer_id: string;
  name: string;
  city: string | null;
  created_at: string;
}

export interface Product {
  product_id: string;
  name: string;
  category: string | null;
  current_unit_price: number;
  created_at: string;
}

export interface Order {
  order_id: string;
  customer_id: string;
  order_date: string;
  completed_at: string | null;
  status: OrderStatus;
  sales_channel: SalesChannel;
  branch: string | null;
  created_at: string;
  customers?: { name: string } | null; // joined
}

export interface OrderItem {
  order_item_id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_at_sale_time: number;
  discount: number;
  return_value: number;
  created_at: string;
  products?: { name: string } | null; // joined
}
