export type UserRole = 'ADMIN' | 'CASHIER' | 'WAITER' | 'KITCHEN' | 'CUSTOMER';

export interface User {
  User_id: number;
  User_name: string;
  User_password?: string;
  Full_name?: string;
  Role: UserRole;
  Phone?: string;
  Permissions?: string[];
}

export interface DiningTable {
  Table_id: number;
  Table_code: string;
  Table_name: string;
  Area: string;
  Capacity: number;
  Current_guests: number;
  Status: 'EMPTY' | 'SERVING' | 'BILL_PRINTED' | 'CLEANING';
  Current_order_id?: number | null;
  Current_order_code?: string | null;
  Current_amount: number;
  Payment_status: 'PAID' | 'UNPAID';
  Note?: string | null;
  Sort_order: number;
}

export interface Category {
  Category_id: number;
  Category_name: string;
  Display_order: number;
  Is_active?: number;
}

export interface Topping {
  id?: string | number;
  name: string;
  price: number;
}

export interface MenuItem {
  Item_id: number;
  Category_id: number;
  Item_code: string;
  Item_name: string;
  Base_price: number;
  Cost_price?: number;
  Image_url: string;
  Description?: string;
  Is_available: number;
  Printer_target?: 'KITCHEN_MAIN' | 'BAR';
  Toppings?: string | Topping[] | null;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  note?: string;
  selectedToppings?: Topping[];
}

export interface OrderDetail {
  Detail_id?: number;
  Order_id?: number;
  Item_id: number;
  Item_name: string;
  Quantity: number;
  Price: number;
  Total?: number;
  Note?: string;
  Toppings?: string | Topping[] | null;
  Status?: 'PENDING' | 'COOKING' | 'READY' | 'SERVED';
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COOKING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  Order_id: number;
  Order_code: string;
  Table_id?: number | string;
  Table_name?: string;
  Table_number?: string;
  Guest_count?: number;
  Total_amount: number;
  Final_amount: number;
  Status: OrderStatus;
  Payment_status: 'PAID' | 'UNPAID';
  Payment_type?: 'CASH' | 'BANK_TRANSFER' | 'TRANSFER' | 'MOMO' | 'CARD' | 'COD';
  Delivery_platform?: string;
  Customer_name?: string;
  Customer_phone?: string;
  Delivery_address?: string;
  Shipping_fee?: number;
  Note?: string;
  Staff_name?: string;
  Created_by?: string;
  Created_at: string;
  items: OrderDetail[];
}

export interface DeliveryPlatform {
  Platform_id: number;
  Platform_name: string;
  Platform_code: string;
  Fee_percentage: number;
  Icon_class: string;
  Color_code: string;
  Is_active: number;
  Sort_order: number;
}

export interface SystemSettings {
  serverUrl: string;
  brandName: string;
  hotline: string;
  address: string;
  bankName: string;
  bankAccount: string;
  bankOwner: string;
  soundAlertsEnabled: boolean;
  sound_enabled?: boolean;

  // Printer & Bill
  printer: 'LAN' | 'BLUETOOTH' | 'BROWSER';
  printerIp: string;
  paperSize: '80mm' | '58mm' | 'A4';
  autoPrintKitchen: boolean;
  autoPrintPayment: boolean;
  resName: string;
  resAddr: string;
  resPhone: string;
  resWifi: string;
  billFooter: string;
  showQrCode: boolean;
  qrMode: 'UPLOAD' | 'VIETQR';
  qrBank: string;
  qrAccountNo: string;
  qrAccountName: string;
  qrImageUrl?: string;

  // Kitchen Sound
  kitchenSoundEnabled: boolean;
  kitchenSoundType: string;
  kitchenSoundVolume: number;
  kitchenRepeatCount: number;
  kitchenRepeatInterval: number;

  // Ready Orders Sound
  readySoundEnabled: boolean;
  readySoundType: string;
  readySoundVolume: number;
  readyRepeatCount: number;
  readyRepeatInterval: number;

  // User Permissions Map: { [username: string]: string[] }
  user_permissions: Record<string, string[]>;
}
