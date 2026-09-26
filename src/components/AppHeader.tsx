import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';

export const AppHeader: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentUser, setIsLoginModalOpen, logout, isConnected, showConfirm, isLoggedIn } = useApp();

  const isGuest = !isLoggedIn || !currentUser || !currentUser.User_name || currentUser.User_name === 'Khách';

  const handleLogoutPress = () => {
    showConfirm(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      () => logout(),
      'Đồng ý',
      'Hủy',
      'warning'
    );
  };

  return (
    <View style={[styles.mainHeaderBar, { paddingTop: Math.max(insets.top, 10) }]}>
      {/* Brand Title: Leaf icon + Brand Name */}
      <View style={styles.headerBrandTitle}>
        <FontAwesome5 name="leaf" size={20} color="#86efac" style={{ marginRight: 8 }} />
        <Text style={styles.brandNameText}>Nhà Hàng Chay Hoa Sen</Text>
        <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#4ade80' : '#f59e0b' }]} />
      </View>

      {/* Auth Nav Area: Login / User info */}
      <View style={styles.authNavArea}>
        {isGuest ? (
          <TouchableOpacity
            style={styles.btnLoginGold}
            onPress={() => setIsLoginModalOpen(true)}
            activeOpacity={0.85}>
            <FontAwesome5 name="sign-in-alt" size={13} color="#1a1a1a" style={{ marginRight: 6 }} />
            <Text style={styles.btnLoginGoldText}>Đăng Nhập</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.userInfoRow}>
            <View style={styles.userBadge}>
              <FontAwesome5 name="circle-user" size={13} color="#fde047" style={{ marginRight: 6 }} />
              <Text style={styles.userNameText}>
                {currentUser.Full_name || currentUser.User_name} ({currentUser.Role})
              </Text>
            </View>
            <TouchableOpacity
              style={styles.btnLogout}
              onPress={handleLogoutPress}
              activeOpacity={0.8}>
              <FontAwesome5 name="sign-out-alt" size={11} color="#ffffff" style={{ marginRight: 5 }} />
              <Text style={styles.btnLogoutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainHeaderBar: {
    backgroundColor: '#2e7d32', // var(--primary-color) in HTML
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 4,
      },
    }),
  },
  headerBrandTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandNameText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  authNavArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnLoginGold: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#facc15',
    backgroundColor: '#f59e0b',
  },
  btnLoginGoldText: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: '800',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.4)',
  },
  userNameText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  btnLogoutText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
