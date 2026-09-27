import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import {
  Category,
  DeliveryPlatform,
  DiningTable,
  MenuItem,
  Order,
  CartItem,
  User,
  OrderStatus,
  Topping,
  SystemSettings,
  
} from '@/types';
import {
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_PLATFORMS,
  INITIAL_TABLES,
  INITIAL_USERS,
  INITIAL_SYSTEM_SETTINGS,
} from '@/constants/initialData';
import { CustomDialog, DialogOptions } from '@/components/CustomDialog';
import { playOrderAlarm, stopOrderAlarm } from '@/utils/alarmHelper';
import { syncDatabaseWithSql } from '@/utils/dbSync';

export interface DeliveryContextState {
  platform: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  note: string;
  paymentType: 'COD' | 'TRANSFER';
}

interface AppContextType {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  isConnected: boolean;
  isLoggedIn: boolean;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  addUser: (user: Omit<User, 'User_id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: number) => void;
  socket?: any;
  // Tables
  tables: DiningTable[];
  tableLayout: 'HORIZONTAL' | 'VERTICAL';
  setTableLayout: (layout: 'HORIZONTAL' | 'VERTICAL') => void;
  addTable: (table: Omit<DiningTable, 'Table_id'>) => void;
  updateTable: (table: DiningTable) => void;
  deleteTable: (tableId: number) => void;
  selectedTable: DiningTable | null;
  selectTable: (table: DiningTable | null) => void;
  updateTableGuests: (tableId: number, delta: number) => void;
  transferTable: (fromTableId: number, toTableId: number) => boolean;
  clearTable: (tableId: number) => void;
  payTableOrder: (tableId: number, method?: 'CASH' | 'TRANSFER') => void;

  // Categories
  categories: Category[];
  addCategory: (cat: Omit<Category, 'Category_id'>) => void;
  updateCategory: (cat: Category) => void;
  deleteCategory: (catId: number) => void;

  // Menu Items
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'Item_id'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (itemId: number) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem, qty?: number, note?: string, selectedToppings?: Topping[]) => void;
  updateCartQty: (index: number, delta: number) => void;
  updateCartNote: (index: number, note: string) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  cartOrderType: 'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY';
  setCartOrderType: (t: 'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY') => void;
  cartTableNumber: string;
  setCartTableNumber: (s: string) => void;
  cartCustomerName: string;
  setCartCustomerName: (s: string) => void;
  cartPaymentMethod: 'CASH' | 'BANK_TRANSFER' | 'MOMO' | 'CARD';
  setCartPaymentMethod: (m: 'CASH' | 'BANK_TRANSFER' | 'MOMO' | 'CARD') => void;
  cartCashPaidImmediate: boolean;
  setCartCashPaidImmediate: (v: boolean) => void;
  cartNote: string;
  setCartNote: (n: string) => void;

  // Delivery Context
  deliveryContext: DeliveryContextState;
  setDeliveryContext: React.Dispatch<React.SetStateAction<DeliveryContextState>>;
  deliveryPlatforms: DeliveryPlatform[];
  addPlatform: (p: Omit<DeliveryPlatform, 'Platform_id'>) => void;
  deletePlatform: (pId: number) => void;

  // Orders
  orders: Order[];
  ordersScope: 'MY_ORDERS' | 'ALL_ORDERS';
  setOrdersScope: (scope: 'MY_ORDERS' | 'ALL_ORDERS') => void;
  submitOrder: () => Promise<{ success: boolean; orderCode?: string; message?: string }>;
  updateOrderStatus: (orderId: number, newStatus: OrderStatus) => void;
  cancelOrder: (orderId: number, reason?: string) => void;

  // System Settings
  systemSettings: SystemSettings;
  updateSystemSettings: (s: Partial<SystemSettings>) => void;

  // Modals
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isOrderContextModalOpen: boolean;
  setIsOrderContextModalOpen: (open: boolean) => void;
  isDeliveryModalOpen: boolean;
  setIsDeliveryModalOpen: (open: boolean) => void;
  isManagePlatformsModalOpen: boolean;
  setIsManagePlatformsModalOpen: (open: boolean) => void;

  // Kitchen Mode
  isKitchenMode: boolean;
  setIsKitchenMode: (v: boolean) => void;

  // Sync & Auth
  syncFromServer: () => Promise<boolean>;
  login: (username: string, password?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;

  // Permissions
  hasPermission: (permKey: string) => boolean;
  getUserPermissions: (user?: User) => string[];
  updateUserPermissions: (username: string, perms: string[]) => Promise<void>;

  // Custom In-App Dialogs (Replaces browser alert/confirm)
  showAlert: (title: string, message: string, type?: 'danger' | 'warning' | 'success' | 'info') => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string,
    type?: 'danger' | 'warning' | 'success' | 'info'
  ) => void;

  // Alarm & Sound Helpers
  isAlarmRinging: boolean;
  triggerAlarmTest: (type?: 'KITCHEN' | 'READY', customConfig?: Partial<SystemSettings>) => void;
  stopAlarm: () => void;

  // SQL & DB Sync
  syncWithSql: () => Promise<{ success: boolean; message: string; serverSynced: boolean }>;

  // Counters
  kitchenPendingCount: number;
  readyOrdersCount: number;
  cartTotalAmount: number;
  cartTotalCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_SERVER = 'hoasen_server_url';
const STORAGE_KEY_USER = 'hoasen_current_user';
const STORAGE_KEY_ORDERS = 'hoasen_local_orders';
const STORAGE_KEY_TABLES = 'hoasen_local_tables';
const STORAGE_KEY_MENU = 'hoasen_local_menu';
const STORAGE_KEY_CATEGORIES = 'hoasen_local_categories';
const STORAGE_KEY_USERS = 'hoasen_local_users';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverUrl, setServerUrlState] = useState<string>('http://localhost:3000');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [tables, setTables] = useState<DiningTable[]>(INITIAL_TABLES);
  const [tableLayout, setTableLayout] = useState<'HORIZONTAL' | 'VERTICAL'>('HORIZONTAL');
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [ordersScope, setOrdersScope] = useState<'MY_ORDERS' | 'ALL_ORDERS'>('MY_ORDERS');
  const [deliveryPlatforms, setDeliveryPlatforms] = useState<DeliveryPlatform[]>(INITIAL_PLATFORMS);
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);

  // Cart Form State
  const [cartOrderType, setCartOrderType] = useState<'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY'>('DINE_IN');
  const [cartTableNumber, setCartTableNumber] = useState<string>('');
  const [cartCustomerName, setCartCustomerName] = useState<string>('');
  const [cartPaymentMethod, setCartPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'MOMO' | 'CARD'>('CASH');
  const [cartCashPaidImmediate, setCartCashPaidImmediate] = useState<boolean>(false);
  const [cartNote, setCartNote] = useState<string>('');

  // Modals & UI Modes
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isOrderContextModalOpen, setIsOrderContextModalOpen] = useState<boolean>(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState<boolean>(false);
  const [isManagePlatformsModalOpen, setIsManagePlatformsModalOpen] = useState<boolean>(false);
  const [isKitchenMode, setIsKitchenMode] = useState<boolean>(false);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [dialogState, setDialogState] = useState<DialogOptions>({
    visible: false,
    title: '',
    message: '',
  });
  const [isAlarmRinging, setIsAlarmRinging] = useState<boolean>(false);

  const [deliveryContext, setDeliveryContext] = useState<DeliveryContextState>({
    platform: 'GrabFood',
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    note: '',
    paymentType: 'COD',
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);

  // Load saved configurations from storage on startup
  useEffect(() => {
    (async () => {
      try {
        const savedUrl = await AsyncStorage.getItem(STORAGE_KEY_SERVER);
        if (savedUrl) setServerUrlState(savedUrl);

        const savedUser = await AsyncStorage.getItem(STORAGE_KEY_USER);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.User_name && parsed.User_name !== 'Khách') {
            setCurrentUser(parsed);
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
          }
        }

        const savedSettings = await AsyncStorage.getItem('hoasen_system_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed) setSystemSettings((prev) => ({ ...prev, ...parsed }));
        }

        const savedTables = await AsyncStorage.getItem(STORAGE_KEY_TABLES);
        if (savedTables) {
          const parsed = JSON.parse(savedTables);
          if (Array.isArray(parsed) && parsed.length > 0) setTables(parsed);
        }

        const savedOrders = await AsyncStorage.getItem(STORAGE_KEY_ORDERS);
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed) && parsed.length > 0) setOrders(parsed);
        }

        const savedCategories = await AsyncStorage.getItem(STORAGE_KEY_CATEGORIES);
        if (savedCategories) {
          const parsed = JSON.parse(savedCategories);
          if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
        }

        const savedUsers = await AsyncStorage.getItem(STORAGE_KEY_USERS);
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) setUsers(parsed);
        }
      } catch (e) {
        console.log('Error reading AsyncStorage:', e);
      }
    })();
  }, []);

  const setServerUrl = useCallback((url: string) => {
    setServerUrlState(url);
    AsyncStorage.setItem(STORAGE_KEY_SERVER, url).catch(() => {});
  }, []);

  const updateSystemSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSystemSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Sync from server API
  const syncFromServer = useCallback(async (): Promise<boolean> => {
    try {
      const baseUrl = serverUrl.replace(/\/+$/, '');
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 4000);

      const [tablesRes, menuRes, catRes, ordersRes, platRes] = await Promise.all([
        fetch(`${baseUrl}/api/tables`, { signal: ctrl.signal }).catch(() => null),
        fetch(`${baseUrl}/api/menu`, { signal: ctrl.signal }).catch(() => null),
        fetch(`${baseUrl}/api/categories`, { signal: ctrl.signal }).catch(() => null),
        fetch(`${baseUrl}/api/orders`, { signal: ctrl.signal }).catch(() => null),
        fetch(`${baseUrl}/api/delivery-platforms`, { signal: ctrl.signal }).catch(() => null),
      ]);
      clearTimeout(timeoutId);

      let success = false;
      if (tablesRes && tablesRes.ok) {
        const data = await tablesRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setTables(data);
          AsyncStorage.setItem(STORAGE_KEY_TABLES, JSON.stringify(data)).catch(() => {});
          success = true;
        }
      }

      if (menuRes && menuRes.ok) {
        const data = await menuRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setMenuItems(data);
          AsyncStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(data)).catch(() => {});
          success = true;
        }
      }

      if (catRes && catRes.ok) {
        const data = await catRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          AsyncStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(data)).catch(() => {});
        }
      }

      if (ordersRes && ordersRes.ok) {
        const data = await ordersRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
          AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(data)).catch(() => {});
          success = true;
        }
      }

      if (platRes && platRes.ok) {
        const data = await platRes.json();
        if (data && Array.isArray(data.platforms) && data.platforms.length > 0) {
          setDeliveryPlatforms(data.platforms);
        }
      }

      setIsConnected(success);
      return success;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, [serverUrl]);

  const triggerAlarmTest = useCallback(
    (type: 'KITCHEN' | 'READY' = 'KITCHEN', customConfig?: Partial<SystemSettings>) => {
      const cfg = customConfig ? { ...systemSettings, ...customConfig } : systemSettings;
      const soundType = type === 'KITCHEN' ? cfg.kitchenSoundType : cfg.readySoundType;
      const volume = type === 'KITCHEN' ? cfg.kitchenSoundVolume : cfg.readySoundVolume;
      const repeatCount = type === 'KITCHEN' ? cfg.kitchenRepeatCount : cfg.readyRepeatCount;
      const repeatInterval = type === 'KITCHEN' ? cfg.kitchenRepeatInterval : cfg.readyRepeatInterval;
      const customSoundUri = type === 'KITCHEN' ? cfg.kitchenCustomSoundUri : cfg.readyCustomSoundUri;
      const loopUntilClicked = type === 'KITCHEN' ? !!cfg.kitchenLoopUntilClicked : !!cfg.readyLoopUntilClicked;

      setIsAlarmRinging(true);
      playOrderAlarm({
        soundType,
        volume,
        repeatCount,
        repeatInterval,
        customSoundUri,
        loopUntilClicked,
        enableVibration: true,
        enableWakeScreen: true,
      });
    },
    [systemSettings]
  );

  const stopAlarm = useCallback(() => {
    stopOrderAlarm();
    setIsAlarmRinging(false);
  }, []);

  const syncWithSql = useCallback(async () => {
    const res = await syncDatabaseWithSql(serverUrl);
    if (res.success) {
      await syncFromServer();
    }
    return res;
  }, [serverUrl, syncFromServer]);

  // Socket.IO realtime connection
  useEffect(() => {
    if (!serverUrl) return;
    let socket: Socket | null = null;
    try {
      socket = io(serverUrl, { withCredentials: false, timeout: 3000, reconnectionAttempts: 3 });

      socket.on('connect', () => {
        setIsConnected(true);
        syncFromServer();
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('table_updated', () => syncFromServer());

      socket.on('database_resynced', () => {
        syncFromServer();
      });

      socket.on('kitchen_new_order', (orderData: any) => {
        syncFromServer();
        if (systemSettings.kitchenSoundEnabled !== false && systemSettings.soundAlertsEnabled !== false) {
          setIsAlarmRinging(true);
          playOrderAlarm({
            soundType: systemSettings.kitchenSoundType || 'kitchen_bell',
            volume: systemSettings.kitchenSoundVolume ?? 100,
            repeatCount: systemSettings.kitchenRepeatCount ?? 3,
            repeatInterval: systemSettings.kitchenRepeatInterval ?? 2,
            customSoundUri: systemSettings.kitchenCustomSoundUri,
            loopUntilClicked: !!systemSettings.kitchenLoopUntilClicked,
            enableVibration: true,
            enableWakeScreen: true,
          });
        }
      });

      socket.on('waiter_order_ready', () => {
        syncFromServer();
        if (systemSettings.readySoundEnabled !== false && systemSettings.soundAlertsEnabled !== false) {
          setIsAlarmRinging(true);
          playOrderAlarm({
            soundType: systemSettings.readySoundType || 'dingdong',
            volume: systemSettings.readySoundVolume ?? 100,
            repeatCount: systemSettings.readyRepeatCount ?? 5,
            repeatInterval: systemSettings.readyRepeatInterval ?? 1,
            customSoundUri: systemSettings.readyCustomSoundUri,
            loopUntilClicked: !!systemSettings.readyLoopUntilClicked,
            enableVibration: true,
            enableWakeScreen: true,
          });
        }
      });

      socket.on('order_status_updated', (data: any) => {
        syncFromServer();
        if (data && (data.Status === 'READY' || data.status === 'READY')) {
          if (systemSettings.readySoundEnabled !== false && systemSettings.soundAlertsEnabled !== false) {
            setIsAlarmRinging(true);
            playOrderAlarm({
              soundType: systemSettings.readySoundType || 'dingdong',
              volume: systemSettings.readySoundVolume ?? 100,
              repeatCount: systemSettings.readyRepeatCount ?? 5,
              repeatInterval: systemSettings.readyRepeatInterval ?? 1,
              customSoundUri: systemSettings.readyCustomSoundUri,
              loopUntilClicked: !!systemSettings.readyLoopUntilClicked,
              enableVibration: true,
              enableWakeScreen: true,
            });
          }
        }
      });

      socket.on('order_counts_updated', () => syncFromServer());
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [serverUrl, syncFromServer, systemSettings]);

  // Cart operations
  const addToCart = useCallback(
    (item: MenuItem, qty = 1, note = '', selectedToppings: Topping[] = []) => {
      setCart((prev) => {
        const idx = prev.findIndex(
          (ci) =>
            ci.item.Item_id === item.Item_id &&
            JSON.stringify(ci.selectedToppings || []) === JSON.stringify(selectedToppings || [])
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: updated[idx].quantity + qty,
            note: note ? note : updated[idx].note,
          };
          return updated;
        }
        return [...prev, { item, quantity: qty, note, selectedToppings }];
      });
    },
    []
  );

  const updateCartQty = useCallback((index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  }, []);

  const updateCartNote = useCallback((index: number, note: string) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], note };
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const selectTable = useCallback((table: DiningTable | null) => {
    setSelectedTable(table);
    if (table) {
      setCartOrderType('DINE_IN');
      setCartTableNumber(table.Table_code);
    }
  }, []);

  // Cart totals
  const cartTotalAmount = useMemo(() => {
    return cart.reduce((sum, ci) => {
      const toppingTotal = (ci.selectedToppings || []).reduce((tsum, t) => tsum + (t.price || 0), 0);
      return sum + ((ci.item.Base_price || 0) + toppingTotal) * ci.quantity;
    }, 0);
  }, [cart]);

  const cartTotalCount = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.quantity, 0);
  }, [cart]);

  // Badges & Counters
  const kitchenPendingCount = useMemo(() => {
    return orders.filter(
      (o) => o.Status === 'PENDING' || o.Status === 'PROCESSING' || o.Status === 'COOKING'
    ).length;
  }, [orders]);

  const readyOrdersCount = useMemo(() => {
    return orders.filter((o) => o.Status === 'READY').length;
  }, [orders]);

  // Submit Order
  const submitOrder = useCallback(async () => {
    if (cart.length === 0) {
      return { success: false, message: 'Giỏ hàng đang trống!' };
    }

    const orderId = Date.now();
    const orderCode = `CHAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const orderDetails = cart.map((ci) => {
      const toppingTotal = (ci.selectedToppings || []).reduce((tsum, t) => tsum + (t.price || 0), 0);
      const unitPrice = ci.item.Base_price + toppingTotal;
      return {
        Item_id: ci.item.Item_id,
        Item_name: ci.item.Item_name,
        Quantity: ci.quantity,
        Price: unitPrice,
        Total: unitPrice * ci.quantity,
        Note: ci.note,
        Toppings: ci.selectedToppings,
        Status: 'PENDING' as const,
      };
    });

    let newOrder: Order;

    if (cartOrderType === 'DINE_IN') {
      const targetTable =
        selectedTable ||
        tables.find(
          (t) =>
            t.Table_code.toLowerCase() === cartTableNumber.toLowerCase().trim() ||
            t.Table_name.toLowerCase() === cartTableNumber.toLowerCase().trim()
        );

      newOrder = {
        Order_id: orderId,
        Order_code: orderCode,
        Table_id: targetTable ? targetTable.Table_id : 1,
        Table_name: targetTable ? targetTable.Table_name : cartTableNumber || 'Bàn Quán',
        Table_number: targetTable ? targetTable.Table_code : cartTableNumber || 'B01',
        Guest_count: targetTable ? targetTable.Current_guests || 2 : 2,
        Total_amount: cartTotalAmount,
        Final_amount: cartTotalAmount,
        Status: 'PROCESSING',
        Payment_status: cartCashPaidImmediate ? 'PAID' : 'UNPAID',
        Payment_type: cartPaymentMethod,
        Staff_name: currentUser.Full_name || currentUser.User_name,
        Created_by: currentUser.User_name,
        Created_at: nowTime,
        Note: cartNote,
        items: orderDetails,
      };

      // Update table to SERVING
      if (targetTable) {
        setTables((prev) =>
          prev.map((t) =>
            t.Table_id === targetTable.Table_id
              ? {
                  ...t,
                  Status: 'SERVING',
                  Current_order_id: orderId,
                  Current_order_code: orderCode,
                  Current_amount: (t.Current_amount || 0) + cartTotalAmount,
                  Payment_status: cartCashPaidImmediate ? 'PAID' : 'UNPAID',
                  Current_guests: t.Current_guests > 0 ? t.Current_guests : 2,
                }
              : t
          )
        );
      }
    } else {
      // TAKE AWAY or DELIVERY
      newOrder = {
        Order_id: orderId,
        Order_code: orderCode,
        Delivery_platform:
          cartOrderType === 'TAKE_AWAY'
            ? 'Khách Lấy (Mang Về)'
            : deliveryContext.platform || 'GrabFood',
        Customer_name: cartCustomerName || deliveryContext.customerName || 'Khách mang về',
        Customer_phone: deliveryContext.customerPhone,
        Delivery_address: deliveryContext.deliveryAddress,
        Note: cartNote || deliveryContext.note,
        Total_amount: cartTotalAmount,
        Final_amount: cartTotalAmount,
        Status: 'PROCESSING',
        Payment_status:
          cartCashPaidImmediate || deliveryContext.paymentType === 'TRANSFER'
            ? 'PAID'
            : 'UNPAID',
        Payment_type: cartPaymentMethod,
        Staff_name: currentUser.Full_name || currentUser.User_name,
        Created_by: currentUser.User_name,
        Created_at: nowTime,
        items: orderDetails,
      };
    }

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setCartNote('');

    AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify([newOrder, ...orders])).catch(() => {});

    if (isConnected) {
      try {
        const baseUrl = serverUrl.replace(/\/+$/, '');
        await fetch(`${baseUrl}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder),
        });
      } catch (err) {
        console.log('Backend sync order error:', err);
      }
    }

    return {
      success: true,
      orderCode,
      message: `Đã gửi đơn ${orderCode} xuống bếp thành công!`,
    };
  }, [
    cart,
    cartTotalAmount,
    cartOrderType,
    selectedTable,
    tables,
    cartTableNumber,
    cartCustomerName,
    cartCashPaidImmediate,
    cartPaymentMethod,
    cartNote,
    deliveryContext,
    currentUser,
    orders,
    isConnected,
    serverUrl,
  ]);

  // Update order status
  const updateOrderStatus = useCallback(
    (orderId: number, newStatus: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.Order_id === orderId) {
            return {
              ...o,
              Status: newStatus,
              items: o.items.map((it) => ({
                ...it,
                Status: newStatus === 'READY' ? 'READY' : newStatus === 'COOKING' ? 'COOKING' : it.Status,
              })),
            };
          }
          return o;
        })
      );

      if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
        const order = orders.find((o) => o.Order_id === orderId);
        if (order && order.Table_id) {
          setTables((prev) =>
            prev.map((t) =>
              t.Table_id === order.Table_id
                ? {
                    ...t,
                    Status: 'EMPTY',
                    Current_order_id: null,
                    Current_order_code: null,
                    Current_amount: 0,
                    Payment_status: 'UNPAID',
                    Current_guests: 0,
                  }
                : t
            )
          );
        }
      }
    },
    [orders]
  );

  const cancelOrder = useCallback((orderId: number, reason?: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.Order_id === orderId ? { ...o, Status: 'CANCELLED', Note: reason || o.Note } : o))
    );
  }, []);

  // Table operations
  const updateTableGuests = useCallback((tableId: number, delta: number) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.Table_id === tableId) {
          const nextGuests = Math.max(0, (t.Current_guests || 0) + delta);
          return {
            ...t,
            Current_guests: nextGuests,
            Status: nextGuests > 0 && t.Status === 'EMPTY' ? 'SERVING' : t.Status,
          };
        }
        return t;
      })
    );
  }, []);

  const transferTable = useCallback((fromTableId: number, toTableId: number): boolean => {
    let success = false;
    setTables((prev) => {
      const from = prev.find((t) => t.Table_id === fromTableId);
      const to = prev.find((t) => t.Table_id === toTableId);
      if (!from || !to) return prev;

      success = true;
      return prev.map((t) => {
        if (t.Table_id === fromTableId) {
          return {
            ...t,
            Status: 'EMPTY',
            Current_order_id: null,
            Current_order_code: null,
            Current_amount: 0,
            Current_guests: 0,
          };
        }
        if (t.Table_id === toTableId) {
          return {
            ...t,
            Status: from.Status,
            Current_order_id: from.Current_order_id,
            Current_order_code: from.Current_order_code,
            Current_amount: from.Current_amount,
            Current_guests: from.Current_guests || 2,
          };
        }
        return t;
      });
    });
    return success;
  }, []);

  const clearTable = useCallback((tableId: number) => {
    setTables((prev) =>
      prev.map((t) =>
        t.Table_id === tableId
          ? {
              ...t,
              Status: 'EMPTY',
              Current_order_id: null,
              Current_order_code: null,
              Current_amount: 0,
              Current_guests: 0,
              Payment_status: 'UNPAID',
            }
          : t
      )
    );
  }, []);

  const payTableOrder = useCallback(
    (tableId: number, method: 'CASH' | 'TRANSFER' = 'CASH') => {
      const table = tables.find((t) => t.Table_id === tableId);
      if (table && table.Current_order_id) {
        setOrders((prev) =>
          prev.map((o) =>
            o.Order_id === table.Current_order_id
              ? { ...o, Status: 'COMPLETED', Payment_status: 'PAID', Payment_type: method }
              : o
          )
        );
      }
      clearTable(tableId);
    },
    [tables, clearTable]
  );

  const addTable = useCallback((table: Omit<DiningTable, 'Table_id'>) => {
    const newT: DiningTable = { ...table, Table_id: Date.now() };
    setTables((prev) => [...prev, newT]);
  }, []);

  const updateTable = useCallback((table: DiningTable) => {
    setTables((prev) => prev.map((t) => (t.Table_id === table.Table_id ? table : t)));
  }, []);

  const deleteTable = useCallback((tableId: number) => {
    setTables((prev) => prev.filter((t) => t.Table_id !== tableId));
  }, []);

  // Category CRUD
  const addCategory = useCallback((cat: Omit<Category, 'Category_id'>) => {
    const newC: Category = { ...cat, Category_id: Date.now(), Is_active: 1 };
    setCategories((prev) => [...prev, newC]);
  }, []);

  const updateCategory = useCallback((cat: Category) => {
    setCategories((prev) => prev.map((c) => (c.Category_id === cat.Category_id ? cat : c)));
  }, []);

  const deleteCategory = useCallback((catId: number) => {
    setCategories((prev) => prev.filter((c) => c.Category_id !== catId));
  }, []);

  // Menu item CRUD
  const addMenuItem = useCallback((item: Omit<MenuItem, 'Item_id'>) => {
    const newItem: MenuItem = { ...item, Item_id: Date.now() };
    setMenuItems((prev) => [newItem, ...prev]);
  }, []);

  const updateMenuItem = useCallback((item: MenuItem) => {
    setMenuItems((prev) => prev.map((m) => (m.Item_id === item.Item_id ? item : m)));
  }, []);

  const deleteMenuItem = useCallback((itemId: number) => {
    setMenuItems((prev) => prev.filter((m) => m.Item_id !== itemId));
  }, []);

  // User CRUD
  const addUser = useCallback((user: Omit<User, 'User_id'>) => {
    const newU: User = { ...user, User_id: Date.now() };
    setUsers((prev) => [...prev, newU]);
  }, []);

  const updateUser = useCallback((user: User) => {
    setUsers((prev) => prev.map((u) => (u.User_id === user.User_id ? user : u)));
  }, []);

  const deleteUser = useCallback((userId: number) => {
    setUsers((prev) => prev.filter((u) => u.User_id !== userId));
  }, []);

  // Platform CRUD
  const addPlatform = useCallback((p: Omit<DeliveryPlatform, 'Platform_id'>) => {
    const newP: DeliveryPlatform = { ...p, Platform_id: Date.now() };
    setDeliveryPlatforms((prev) => [...prev, newP]);
  }, []);

  const deletePlatform = useCallback((pId: number) => {
    setDeliveryPlatforms((prev) => prev.filter((p) => p.Platform_id !== pId));
  }, []);

  // Custom In-App Dialog Helpers (Replaces browser alert/confirm)
  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback(
    (title: string, message: string, type: 'danger' | 'warning' | 'success' | 'info' = 'info') => {
      setDialogState({
        visible: true,
        title,
        message,
        type,
        isConfirm: false,
        confirmText: 'Đóng',
        onConfirm: closeDialog,
      });
    },
    [closeDialog]
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      confirmText = 'Đồng ý',
      cancelText = 'Hủy',
      type: 'danger' | 'warning' | 'success' | 'info' = 'warning'
    ) => {
      setDialogState({
        visible: true,
        title,
        message,
        type,
        isConfirm: true,
        confirmText,
        cancelText,
        onConfirm: () => {
          closeDialog();
          onConfirm();
        },
        onCancel: closeDialog,
      });
    },
    [closeDialog]
  );

  // Permissions
  const getUserPermissions = useCallback(
    (targetUser?: User): string[] => {
      const user = targetUser || currentUser;
      if (!user || !user.User_name || user.User_name === 'Khách') return [];
      const username = String(user.User_name || '').toLowerCase();
      const roleUpper = String(user.Role || '').toUpperCase();

      if (['ADMIN', 'QUẢN LÝ', 'QUANLY'].includes(roleUpper) || username === 'admin' || username === 'vu') {
        return [
          'TABLES_VIEW',
          'TABLES_MANAGE',
          'MENU_CARDS',
          'CART',
          'READY_ORDERS',
          'ORDERS_PERSONAL',
          'ORDERS_LIST',
          'ORDERS_ALL',
          'ORDERS_EDIT',
          'ORDERS_CANCEL',
          'ORDERS_DELETE',
          'COLLECT_PAYMENT',
          'REPORTS_STATS',
          'STAFF_KPI_ALL',
          'KITCHEN',
          'MENU_MANAGE',
          'USERS_MANAGE',
          'SYSTEM_CONFIG',
        ];
      }

      // Look up custom user permission overrides from systemSettings
      const customPerms = systemSettings.user_permissions?.[username];
      if (Array.isArray(customPerms) && customPerms.length > 0) {
        return customPerms;
      }

      // Fallback default permissions by role
      if (['WAITER', 'PHỤC VỤ', 'PHUCVU'].includes(roleUpper)) {
        return ['TABLES_VIEW', 'MENU_CARDS', 'CART', 'READY_ORDERS', 'ORDERS_PERSONAL', 'COLLECT_PAYMENT'];
      }
      if (['CASHIER', 'THU NGÂN', 'THUNGAN'].includes(roleUpper)) {
        return [
          'TABLES_VIEW',
          'ORDERS_LIST',
          'ORDERS_ALL',
          'ORDERS_EDIT',
          'COLLECT_PAYMENT',
          'REPORTS_STATS',
          'MENU_CARDS',
          'CART',
          'READY_ORDERS',
          'ORDERS_PERSONAL',
        ];
      }
      if (['KITCHEN', 'BẾP', 'BEP'].includes(roleUpper)) {
        return ['KITCHEN', 'READY_ORDERS', 'ORDERS_PERSONAL'];
      }

      return [];
    },
    [currentUser, systemSettings.user_permissions]
  );

  const hasPermission = useCallback(
    (permKey: string): boolean => {
      const perms = getUserPermissions(currentUser);
      return perms.includes(permKey);
    },
    [currentUser, getUserPermissions]
  );

  const updateUserPermissions = useCallback(
    async (username: string, perms: string[]) => {
      const lower = username.toLowerCase();
      const updatedMap = {
        ...(systemSettings.user_permissions || {}),
        [lower]: perms,
      };
      const newSettings = { ...systemSettings, user_permissions: updatedMap };
      setSystemSettings(newSettings);
      await AsyncStorage.setItem('hoasen_system_settings', JSON.stringify(newSettings)).catch(() => {});

      // Sync to server realtime if online
      try {
        const baseUrl = serverUrl.replace(/\/+$/, '');
        await fetch(`${baseUrl}/api/system-config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_permissions: updatedMap }),
        });
      } catch {}
    },
    [serverUrl, systemSettings]
  );

  // Authentication against Database
  const login = useCallback(
    async (username: string, password?: string): Promise<{ success: boolean; message: string }> => {
      const cleanUser = username.trim();
      const cleanPass = (password || '').trim();

      if (!cleanUser) {
        return { success: false, message: 'Vui lòng nhập tên tài khoản!' };
      }

      // 1. First attempt: Verify online database via server /api/login
      try {
        const baseUrl = serverUrl.replace(/\/+$/, '');
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 3500);
        const res = await fetch(`${baseUrl}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ User_name: cleanUser, User_password: cleanPass }),
          signal: ctrl.signal,
        });
        clearTimeout(tid);

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
            setIsLoggedIn(true);
            await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
            setIsLoginModalOpen(false);
            return { success: true, message: 'Đăng nhập thành công!' };
          } else {
            return {
              success: false,
              message: data.error || 'Tên đăng nhập hoặc mật khẩu không chính xác!',
            };
          }
        } else {
          const data = await res.json().catch(() => ({}));
          return {
            success: false,
            message: data.error || 'Tài khoản hoặc mật khẩu không chính xác!',
          };
        }
      } catch {
        // 2. Second attempt: Check local SQLite database accounts
        const matched = users.find(
          (u) => u.User_name.toLowerCase() === cleanUser.toLowerCase()
        );

        if (!matched) {
          return {
            success: false,
            message: 'Tài khoản không tồn tại trong cơ sở dữ liệu!',
          };
        }

        const validPass = matched.User_password || (matched as any).Password || '111';
        if (cleanPass && cleanPass !== validPass) {
          return {
            success: false,
            message: 'Mật khẩu không chính xác!',
          };
        }

        setCurrentUser(matched);
        setIsLoggedIn(true);
        await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(matched));
        setIsLoginModalOpen(false);
        return { success: true, message: 'Đăng nhập thành công!' };
      }
    },
    [serverUrl, users]
  );

  const logout = useCallback(() => {
    const guest: User = {
      User_id: 0,
      User_name: 'Khách',
      Full_name: 'Chưa đăng nhập',
      Role: 'WAITER',
    };
    setCurrentUser(guest);
    setIsLoggedIn(false);
    AsyncStorage.removeItem(STORAGE_KEY_USER).catch(() => {});
    setIsLoginModalOpen(true);
  }, []);

  return (
    <AppContext.Provider
      value={{
        serverUrl,
        setServerUrl,
        isConnected,
        currentUser,
        setCurrentUser,
        users,
        addUser,
        updateUser,
        deleteUser,
        tables,
        tableLayout,
        setTableLayout,
        addTable,
        updateTable,
        deleteTable,
        selectedTable,
        selectTable,
        updateTableGuests,
        transferTable,
        clearTable,
        payTableOrder,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        cart,
        addToCart,
        updateCartQty,
        updateCartNote,
        removeFromCart,
        clearCart,
        cartOrderType,
        setCartOrderType,
        cartTableNumber,
        setCartTableNumber,
        cartCustomerName,
        setCartCustomerName,
        cartPaymentMethod,
        setCartPaymentMethod,
        cartCashPaidImmediate,
        setCartCashPaidImmediate,
        cartNote,
        setCartNote,
        deliveryContext,
        setDeliveryContext,
        deliveryPlatforms,
        addPlatform,
        deletePlatform,
        orders,
        ordersScope,
        setOrdersScope,
        submitOrder,
        updateOrderStatus,
        cancelOrder,
        systemSettings,
        updateSystemSettings,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isOrderContextModalOpen,
        setIsOrderContextModalOpen,
        isDeliveryModalOpen,
        setIsDeliveryModalOpen,
        isManagePlatformsModalOpen,
        setIsManagePlatformsModalOpen,
        isKitchenMode,
        setIsKitchenMode,
        isLoggedIn,
        syncFromServer,
        login,
        logout,
        hasPermission,
        getUserPermissions,
        updateUserPermissions,
        showAlert,
        showConfirm,
        isAlarmRinging,
        triggerAlarmTest,
        stopAlarm,
        syncWithSql,
        kitchenPendingCount,
        readyOrdersCount,
        cartTotalAmount,
        cartTotalCount,
      }}>
      {children}
      {isAlarmRinging && (
        <View
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            right: 20,
            zIndex: 99999,
            backgroundColor: '#dc2626',
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 12,
          }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}
            onPress={stopAlarm}
            activeOpacity={0.8}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>
                BÁO ĐỘNG ĐƠN HÀNG MỚI!
              </Text>
              <Text style={{ color: '#fecaca', fontSize: 13, marginTop: 2 }}>
                Chuông đang lặp lại liên tục... Bấm vào đây để tắt chuông
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={stopAlarm}
            style={{
              backgroundColor: '#ffffff',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
            }}
            activeOpacity={0.85}>
            <Text style={{ color: '#dc2626', fontWeight: 'bold', fontSize: 14 }}>TẮT CHUÔNG</Text>
          </TouchableOpacity>
        </View>
      )}
      <CustomDialog dialog={dialogState} onClose={closeDialog} />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
