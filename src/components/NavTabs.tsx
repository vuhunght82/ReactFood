import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';

export const NavTabs: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { readyOrdersCount, kitchenPendingCount, cartTotalCount, hasPermission, isLoggedIn, currentUser } = useApp();

  const allTabs = [
    {
      route: '/',
      name: 'tables',
      label: 'Phòng Bàn',
      icon: 'th-large',
      requiredPerm: 'TABLES_VIEW',
    },
    {
      route: '/orders',
      name: 'orders',
      label: hasPermission('ORDERS_ALL') ? 'Đơn Hàng & Đặt Món' : 'Đơn Hàng & Cá Nhân',
      icon: 'receipt',
      requiredPerm: ['ORDERS_PERSONAL', 'ORDERS_LIST', 'ORDERS_ALL'],
    },
    {
      route: '/categories',
      name: 'categories',
      label: 'Danh Mục',
      icon: 'list-ul',
      requiredPerm: 'MENU_MANAGE',
    },
    {
      route: '/menu',
      name: 'menu',
      label: 'Thực Đơn (Menu)',
      icon: 'utensils',
      requiredPerm: 'MENU_MANAGE',
    },
    {
      route: '/menu-cards',
      name: 'menu-cards',
      label: 'Menu Dạng Thẻ',
      icon: 'border-all',
      requiredPerm: 'MENU_CARDS',
    },
    {
      route: '/cart',
      name: 'cart',
      label: 'Giỏ Hàng',
      icon: 'shopping-cart',
      badge: cartTotalCount,
      requiredPerm: 'CART',
    },
    {
      route: '/ready-orders',
      name: 'ready-orders',
      label: 'Nhận Món (Bếp Xong)',
      icon: 'concierge-bell',
      badge: readyOrdersCount,
      badgeColor: '#dc3545',
      requiredPerm: 'READY_ORDERS',
    },
    {
      route: '/users',
      name: 'users',
      label: 'Người Dùng (Users)',
      icon: 'users',
      requiredPerm: 'USERS_MANAGE',
    },
    {
      route: '/kitchen',
      name: 'kitchen',
      label: 'Màn Hình Bếp (KDS)',
      icon: 'fire',
      badge: kitchenPendingCount,
      badgeColor: '#dc3545',
      requiredPerm: 'KITCHEN',
    },
    {
      route: '/system-settings',
      name: 'system-settings',
      label: 'Quản Lý Hệ Thống',
      icon: 'cogs',
      requiredPerm: 'SYSTEM_CONFIG',
    },
  ];

  const visibleTabs = allTabs.filter((tab) => {
    if (!isLoggedIn || !currentUser || currentUser.User_name === 'Khách') return false;
    if (Array.isArray(tab.requiredPerm)) {
      return tab.requiredPerm.some((p) => hasPermission(p));
    }
    return hasPermission(tab.requiredPerm);
  });

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  if (!isLoggedIn || visibleTabs.length === 0) {
    return null;
  }

  return (
    <View style={styles.navTabsWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navTabsContainer}>
        {visibleTabs.map((tab) => {
          const isActive =
            pathname === tab.route ||
            (tab.route === '/' && (pathname === '/' || pathname === '/index' || pathname === ''));

          return (
            <TouchableOpacity
              key={tab.route}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.75}>
              <FontAwesome5
                name={tab.icon as any}
                size={14}
                color={isActive ? '#2e7d32' : '#666666'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>

              {/* Red Badge Counter */}
              {tab.badge && tab.badge > 0 ? (
                <View style={[styles.navCounterBadge, tab.badgeColor ? { backgroundColor: tab.badgeColor } : {}]}>
                  <Text style={styles.navCounterBadgeText}>{tab.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  navTabsWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      },
    }),
  },
  navTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#2e7d32',
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  tabBtnTextActive: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  navCounterBadge: {
    backgroundColor: '#dc3545',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(220, 53, 69, 0.45)',
      },
    }),
  },
  navCounterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});
