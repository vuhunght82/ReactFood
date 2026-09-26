import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LotusTheme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login, currentUser } = useApp();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const QUICK_ROLES = [
    { label: '👑 Quản Lý', username: 'vu', password: '111' },
    { label: '💵 Thu Ngân', username: 'quay', password: '111' },
    { label: '🍽️ Bồi Bàn', username: 'boi', password: '111' },
    { label: '👨‍🍳 Bếp', username: 'bep', password: '111' },
  ];

  const handleLoginSubmit = async (customUser?: string, customPass?: string) => {
    const u = customUser !== undefined ? customUser : username;
    const p = customPass !== undefined ? customPass : password;
    if (!u.trim()) {
      setErrorMsg('Vui lòng nhập tên tài khoản!');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    const res = await login(u, p);
    setIsLoading(false);
    if (res.success) {
      setUsername('');
      setPassword('');
      setErrorMsg('');
    } else {
      setErrorMsg(res.message || 'Đăng nhập không thành công');
    }
  };

  const handleQuickRoleSelect = (q: typeof QUICK_ROLES[0]) => {
    setUsername(q.username);
    setPassword(q.password);
    handleLoginSubmit(q.username, q.password);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isLoginModalOpen}
      onRequestClose={() => setIsLoginModalOpen(false)}>
      <Pressable style={styles.overlay} onPress={() => setIsLoginModalOpen(false)}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setIsLoginModalOpen(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <FontAwesome5 name="times" size={16} color="#fde047" />
          </TouchableOpacity>

          {/* Header with Emblem */}
          <View style={styles.cardHeader}>
            <View style={styles.emblemContainer}>
              <MaterialCommunityIcons name="flower-tulip" size={32} color="#fef08a" />
            </View>
            <Text style={styles.brandSub}>NHÀ HÀNG CHAY HOA SEN</Text>
            <Text style={styles.title}>Đăng Nhập Hệ Thống</Text>
            <Text style={styles.subtext}>Quản lý bán hàng, gọi món & phục vụ POS</Text>
          </View>

          {/* Form */}
          <View style={styles.cardBody}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <FontAwesome5 name="exclamation-circle" size={13} color="#f87171" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Username Input */}
            <Text style={styles.label}>
              <FontAwesome5 name="user-shield" size={12} color="#f59e0b" /> Tên tài khoản / Mã nhân viên:
            </Text>
            <View style={styles.inputWrapper}>
              <FontAwesome5 name="id-badge" size={16} color="#f59e0b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  setErrorMsg('');
                }}
                placeholder="Nhập tên tài khoản..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <Text style={styles.label}>
              <FontAwesome5 name="shield-alt" size={12} color="#f59e0b" /> Mật khẩu bảo mật:
            </Text>
            <View style={styles.inputWrapper}>
              <FontAwesome5 name="lock" size={16} color="#f59e0b" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 40 }]}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrorMsg('');
                }}
                placeholder="Nhập mật khẩu..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}>
                <FontAwesome5
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size={14}
                  color="#86efac"
                />
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
              onPress={() => handleLoginSubmit()}
              disabled={isLoading}
              activeOpacity={0.85}>
              <FontAwesome5 name="sign-in-alt" size={16} color="#1a1a1a" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>
                {isLoading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP HỆ THỐNG'}
              </Text>
            </TouchableOpacity>

            {/* Quick Role Switcher Chips */}
            <View style={styles.roleDivider}>
              <Text style={styles.roleDividerText}>Chọn nhanh vai trò:</Text>
            </View>

            <View style={styles.rolesRow}>
              {QUICK_ROLES.map((q) => {
                const isActive = currentUser.User_name === q.username;
                return (
                  <TouchableOpacity
                    key={q.username}
                    style={[styles.roleChip, isActive && styles.roleChipActive]}
                    onPress={() => handleQuickRoleSelect(q)}>
                    <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>
                      {q.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.footerNote}>
              🌱 Ẩm Thực Chay Thuần Khiết • Phục Vụ Tận Tâm • An Lạc
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 46, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      } as any,
    }),
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#072e18',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#facc15',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 30px rgba(34, 197, 94, 0.25)',
      },
      default: {
        elevation: 12,
      },
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: LotusTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardHeader: {
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.25)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  emblemContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#164d1f',
    borderWidth: 2,
    borderColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fde047',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  subtext: {
    fontSize: 12,
    color: '#bbf7d0',
    marginTop: 2,
  },
  cardBody: {
    padding: 22,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#f87171',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 4,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 14,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  input: {
    backgroundColor: 'rgba(6, 28, 11, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(134, 239, 172, 0.35)',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 10,
    paddingLeft: 38,
    paddingRight: 14,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  submitBtn: {
    backgroundColor: LotusTheme.accent,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fde047',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roleDivider: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
  },
  roleDividerText: {
    color: '#86efac',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    backgroundColor: 'rgba(22, 101, 52, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  roleChipActive: {
    backgroundColor: LotusTheme.accent,
    borderColor: '#fde047',
  },
  roleChipText: {
    color: '#d1fae5',
    fontSize: 11,
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: '#1a1a1a',
    fontWeight: '800',
  },
  footerNote: {
    textAlign: 'center',
    color: '#86efac',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 16,
    opacity: 0.8,
  },
});
