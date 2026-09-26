import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useApp } from '@/context/AppContext';

export const FloatingCartBtn: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { cartTotalCount, isKitchenMode } = useApp();

  if (pathname === '/cart' || isKitchenMode) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.floatingCartBtn}
      onPress={() => router.push('/cart' as any)}
      activeOpacity={0.85}
      accessibilityLabel="Xem Giỏ Hàng">
      <FontAwesome5 name="shopping-cart" size={24} color="#ffffff" />
      {cartTotalCount > 0 ? (
        <View style={styles.floatingCartBadge}>
          <Text style={styles.floatingCartBadgeText}>{cartTotalCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingCartBtn: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2e7d32', // var(--primary-color)
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  floatingCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#d32f2f', // var(--danger-color)
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  floatingCartBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
  },
});
