import React, { useEffect } from 'react';
import { View, StyleSheet, Alert, Vibration } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { io } from 'socket.io-client';

import { AppProvider } from '@/context/AppContext';
import { AppHeader } from '@/components/AppHeader';
import { LoginModal } from '@/components/LoginModal';
import { LotusTheme } from '@/constants/theme';

// IP máy chủ PC
const SERVER_URL = 'http://192.168.100.100:3000';

export default function RootLayout() {
  useEffect(() => {
    // 1. Kết nối tới Socket server trên PC
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('⚡ iPhone kết nối Socket thành công! Socket ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.log('⚠️ Lỗi kết nối Socket tới PC:', error.message);
    });

    // 2. Xử lý khi có đơn mới gửi từ server PC
    const handleNewOrder = (data: any) => {
      console.log('🔔 ĐƠN HÀNG MỚI NHẬN ĐƯỢC:', data);

      // Kích hoạt rung máy (Rung 400ms - Nghỉ 200ms - Rung 400ms)
      try {
        Vibration.vibrate([0, 400, 200, 400]);
      } catch (e) {
        console.log('Lỗi rung máy:', e);
      }

      // Hiện thông báo popup trên màn hình
      const table = data?.Table_number || data?.table_number || data?.table || 'Mang về';
      const amount = Number(data?.Final_amount || data?.final_amount || data?.total || 0).toLocaleString();

      Alert.alert(
        '🔔 ĐƠN HÀNG MỚI!',
        `Bàn: ${table}\nTổng tiền: ${amount}đ`
      );
    };

    // Lắng nghe tất cả các event có thể phát từ server
    socket.on('NEW_ORDER', handleNewOrder);
    socket.on('NEW_ORDER_NOTIFICATION', handleNewOrder);
    socket.on('order:created', handleNewOrder);

    return () => {
      socket.off('NEW_ORDER', handleNewOrder);
      socket.off('NEW_ORDER_NOTIFICATION', handleNewOrder);
      socket.off('order:created', handleNewOrder);
      socket.disconnect();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <View style={styles.root}>
          <AppHeader />
          <View style={styles.content}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
            </Stack>
          </View>
          <LoginModal />
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});