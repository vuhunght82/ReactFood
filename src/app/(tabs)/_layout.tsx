import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { NavTabs } from '@/components/NavTabs';
import { FloatingCartBtn } from '@/components/FloatingCartBtn';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      {/* Navigation Tabs */}
      <NavTabs />

      {/* Screen View */}
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="orders" />
          <Tabs.Screen name="categories" />
          <Tabs.Screen name="menu" />
          <Tabs.Screen name="menu-cards" />
          <Tabs.Screen name="cart" />
          <Tabs.Screen name="ready-orders" />
          <Tabs.Screen name="ready" />
          <Tabs.Screen name="users" />
          <Tabs.Screen name="kitchen" />
          <Tabs.Screen name="system-settings" />
          <Tabs.Screen name="settings" />
        </Tabs>
      </View>

      <FloatingCartBtn />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
});