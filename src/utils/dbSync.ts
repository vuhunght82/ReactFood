import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_USERS,
  INITIAL_TABLES,
  INITIAL_ORDERS,
  INITIAL_PLATFORMS,
} from '@/constants/initialData';

export const STORAGE_KEYS = {
  SERVER: 'hoasen_server_url',
  USER: 'hoasen_current_user',
  ORDERS: 'hoasen_local_orders',
  TABLES: 'hoasen_local_tables',
  MENU: 'hoasen_local_menu',
  CATEGORIES: 'hoasen_local_categories',
  USERS: 'hoasen_local_users',
  PLATFORMS: 'hoasen_local_platforms',
  SETTINGS: 'hoasen_system_settings',
};

/**
 * Synchronizes local AsyncStorage and notifies backend SQLite server to execute migrations from sql/
 */
export async function syncDatabaseWithSql(serverUrl?: string): Promise<{
  success: boolean;
  message: string;
  serverSynced: boolean;
}> {
  let serverSynced = false;
  let serverMessage = '';

  // 1. Sync backend server if URL provided
  if (serverUrl) {
    try {
      const baseUrl = serverUrl.replace(/\/+$/, '');
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`${baseUrl}/api/sync-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
      });
      clearTimeout(tid);

      if (res.ok) {
        const data = await res.json();
        serverSynced = true;
        serverMessage = data.message || 'Server CSDL đã đồng bộ!';
      }
    } catch (e: any) {
      console.log('Server SQL sync skipped or offline:', e.message);
    }
  }

  // 2. Synchronize local cache with SQL Seed Data
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    await AsyncStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_MENU_ITEMS));
    await AsyncStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
    await AsyncStorage.setItem(STORAGE_KEYS.PLATFORMS, JSON.stringify(INITIAL_PLATFORMS));

    return {
      success: true,
      serverSynced,
      message: serverSynced
        ? `Đã đồng bộ hóa CSDL cả trên Máy Chủ SQLite & Bộ nhớ máy từ thư mục "sql"!`
        : `Đã nạp và đồng bộ hóa thành công dữ liệu CSDL chuẩn từ thư mục "sql"!`,
    };
  } catch (err: any) {
    return {
      success: false,
      serverSynced: false,
      message: `Lỗi khi lưu dữ liệu CSDL: ${err.message}`,
    };
  }
}
