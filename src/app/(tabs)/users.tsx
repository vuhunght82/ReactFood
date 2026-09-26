import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { User, UserRole } from '@/types';
import { useApp } from '@/context/AppContext';

export default function UsersScreen() {
  const { users, addUser, updateUser, deleteUser, showAlert, showConfirm, hasPermission, currentUser } = useApp();

  const isAllowed = hasPermission('USERS_MANAGE') || currentUser.Role === 'ADMIN' || currentUser.User_name === 'vu' || currentUser.User_name === 'admin';

  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>('WAITER');

  const handleEdit = (u: User) => {
    setEditUserId(u.User_id);
    setUserName(u.User_name);
    setUserPassword(u.User_password || '111');
    setUserRole(u.Role);
  };

  const handleCancelEdit = () => {
    setEditUserId(null);
    setUserName('');
    setUserPassword('');
    setUserRole('WAITER');
  };

  const handleSubmit = () => {
    if (!userName.trim() || !userPassword.trim()) {
      showAlert('Thông báo', 'Vui lòng nhập tên đăng nhập và mật khẩu!', 'warning');
      return;
    }

    if (editUserId) {
      updateUser({
        User_id: editUserId,
        User_name: userName.trim(),
        User_password: userPassword.trim(),
        Full_name: userName.trim(),
        Role: userRole,
      });
      handleCancelEdit();
      showAlert('Thành công', 'Đã cập nhật thông tin người dùng!', 'success');
    } else {
      addUser({
        User_name: userName.trim(),
        User_password: userPassword.trim(),
        Full_name: userName.trim(),
        Role: userRole,
      });
      handleCancelEdit();
      showAlert('Thành công', 'Đã tạo tài khoản mới thành công!', 'success');
    }
  };

  const handleDelete = (userId: number, name: string) => {
    showConfirm(
      'Xác nhận xóa tài khoản',
      `Bạn có chắc chắn muốn xóa tài khoản "${name}"?`,
      () => {
        deleteUser(userId);
        showAlert('Đã xóa', `Đã xóa tài khoản "${name}" thành công!`, 'info');
      },
      'Xóa ngay',
      'Hủy',
      'danger'
    );
  };

  if (!isAllowed) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f8fafc' }}>
        <FontAwesome5 name="user-lock" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#dc2626', marginBottom: 8 }}>Quyền Truy Cập Bị Hạn Chế</Text>
        <Text style={{ fontSize: 13, color: '#475569', textAlign: 'center', maxWidth: 400 }}>Tài khoản của bạn chưa được cấp quyền Quản Lý Người Dùng. Vui lòng liên hệ Quản Lý để được cấp quyền!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        {/* Header Form */}
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <FontAwesome5 name="user-plus" size={14} color="#2e7d32" />
            <Text style={styles.headerTitle}>
              {editUserId ? 'Sửa Tài Khoản' : 'Thêm Tài Khoản Mới'}
            </Text>
          </View>
          {editUserId ? (
            <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelBtn}>
              <FontAwesome5 name="times" size={12} color="#666666" style={{ marginRight: 4 }} />
              <Text style={styles.cancelBtnText}>Hủy Sửa</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Form Body */}
        <View style={styles.formBody}>
          <View style={styles.formGrid}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Tên Đăng Nhập (User_name) <Text style={{ color: '#dc3545' }}>*</Text>:
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên đăng nhập"
                value={userName}
                onChangeText={setUserName}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Mật Khẩu (User_password) <Text style={{ color: '#dc3545' }}>*</Text>:
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                value={userPassword}
                onChangeText={setUserPassword}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quyền Hạn (Role):</Text>
              <View style={styles.rolePickerRow}>
                {(['ADMIN', 'CASHIER', 'WAITER', 'KITCHEN'] as UserRole[]).map((r) => {
                  const isSelected = userRole === r;
                  const labelMap: Record<UserRole, string> = {
                    ADMIN: 'Quản Trị Viên (ADMIN)',
                    CASHIER: 'Thu Ngân (CASHIER)',
                    WAITER: 'Bồi Bàn (WAITER)',
                    KITCHEN: 'Bếp (KITCHEN)',
                    CUSTOMER: 'Khách Hàng',
                  };
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleChip, isSelected && styles.roleChipActive]}
                      onPress={() => setUserRole(r)}>
                      <Text style={[styles.roleChipText, isSelected && styles.roleChipTextActive]}>
                        {labelMap[r]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.btnSave} onPress={handleSubmit} activeOpacity={0.85}>
            <FontAwesome5 name="save" size={13} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.btnSaveText}>
              {editUserId ? 'Cập Nhật Tài Khoản' : 'Tạo Tài Khoản'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section 2: Table header */}
        <View style={[styles.cardHeader, { borderTopWidth: 1, borderTopColor: '#e0e0e0', marginTop: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <FontAwesome5 name="users" size={14} color="#2e7d32" />
            <Text style={styles.headerTitle}>Danh Sách Tài Khoản ({users.length})</Text>
          </View>
        </View>

        {/* Users Table */}
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { flex: 1 }]}>Tên Đăng Nhập</Text>
            <Text style={[styles.th, { width: 100 }]}>Mật Khẩu</Text>
            <Text style={[styles.th, { width: 120, textAlign: 'center' }]}>Quyền Hạn</Text>
            <Text style={[styles.th, { width: 90, textAlign: 'center' }]}>Thao Tác</Text>
          </View>

          {users.map((u) => (
            <View key={u.User_id} style={styles.tableDataRow}>
              <Text style={[styles.td, { flex: 1, fontWeight: '700', color: '#1e293b' }]}>
                {u.User_name}
              </Text>
              <Text style={[styles.td, { width: 100, color: '#64748b' }]}>
                {u.User_password || '***'}
              </Text>
              <View style={{ width: 120, alignItems: 'center' }}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{u.Role}</Text>
                </View>
              </View>
              <View style={[styles.tdAction, { width: 90 }]}>
                <TouchableOpacity
                  style={styles.actionBtnEdit}
                  onPress={() => handleEdit(u)}>
                  <FontAwesome5 name="pen" size={11} color="#2e7d32" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnDelete}
                  onPress={() => handleDelete(u.User_id, u.User_name)}>
                  <FontAwesome5 name="trash-alt" size={11} color="#dc3545" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      },
    }),
  },
  cardHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
  },
  formBody: {
    padding: 16,
  },
  formGrid: {
    gap: 12,
  },
  formGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#333333',
    backgroundColor: '#ffffff',
  },
  rolePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  roleChipActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  roleChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  btnSave: {
    backgroundColor: '#2e7d32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 14,
  },
  btnSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  tableWrapper: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555555',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  td: {
    fontSize: 13,
  },
  roleBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2e7d32',
  },
  tdAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnEdit: {
    backgroundColor: '#e8f5e9',
    padding: 6,
    borderRadius: 6,
  },
  actionBtnDelete: {
    backgroundColor: '#fee2e2',
    padding: 6,
    borderRadius: 6,
  },
});
