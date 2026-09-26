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
import { Category } from '@/types';
import { useApp } from '@/context/AppContext';

export default function CategoriesScreen() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();

  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catName, setCatName] = useState<string>('');
  const [displayOrder, setDisplayOrder] = useState<string>('1');

  const handleEdit = (cat: Category) => {
    setEditingCatId(cat.Category_id);
    setCatName(cat.Category_name);
    setDisplayOrder(String(cat.Display_order || 1));
  };

  const handleCancelEdit = () => {
    setEditingCatId(null);
    setCatName('');
    setDisplayOrder('1');
  };

  const handleSubmit = () => {
    if (!catName.trim()) {
      if (Platform.OS === 'web') alert('Vui lòng nhập tên danh mục!');
      else Alert.alert('Thông báo', 'Vui lòng nhập tên danh mục!');
      return;
    }

    const orderNum = parseInt(displayOrder, 10) || 1;

    if (editingCatId) {
      updateCategory({
        Category_id: editingCatId,
        Category_name: catName.trim(),
        Display_order: orderNum,
      });
      handleCancelEdit();
    } else {
      addCategory({
        Category_name: catName.trim(),
        Display_order: orderNum,
      });
      setCatName('');
      setDisplayOrder(String(categories.length + 2));
    }
  };

  const handleDelete = (catId: number, name: string) => {
    const doDelete = () => deleteCategory(catId);
    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa danh mục "${name}"?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.row}>
        {/* CỘT TRÁI: FORM THÊM / SỬA DANH MỤC */}
        <View style={styles.formCol}>
          <View style={styles.card}>
            <View style={styles.cardHeaderSuccess}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FontAwesome5 name="folder-plus" size={14} color="#ffffff" />
                <Text style={styles.cardHeaderTitle}>
                  {editingCatId ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
                </Text>
              </View>
              {editingCatId ? (
                <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelEditBtn}>
                  <Text style={styles.cancelEditText}>Hủy</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.cardBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Tên danh mục <Text style={{ color: '#dc3545' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: Lẩu Chay, Điểm Tâm..."
                  value={catName}
                  onChangeText={setCatName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Thứ tự hiển thị</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={displayOrder}
                  onChangeText={setDisplayOrder}
                />
              </View>

              <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} activeOpacity={0.85}>
                <FontAwesome5 name="plus" size={13} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.btnSubmitText}>
                  {editingCatId ? 'Cập Nhật Danh Mục' : 'Lưu Danh Mục'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* CỘT PHẢI: BẢNG DANH SÁCH DANH MỤC */}
        <View style={styles.tableCol}>
          <View style={styles.card}>
            <View style={styles.cardHeaderWhite}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FontAwesome5 name="list" size={14} color="#2e7d32" />
                <Text style={styles.cardHeaderTitleGreen}>Danh Sách Danh Mục ({categories.length})</Text>
              </View>
            </View>

            <View style={styles.tableWrapper}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 50, textAlign: 'center' }]}>ID</Text>
                <Text style={[styles.th, { flex: 1 }]}>Tên Danh Mục</Text>
                <Text style={[styles.th, { width: 80, textAlign: 'center' }]}>Thứ Tự</Text>
                <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>Thao Tác</Text>
              </View>

              {categories.map((cat) => (
                <View key={cat.Category_id} style={styles.tableDataRow}>
                  <Text style={[styles.td, { width: 50, textAlign: 'center', color: '#64748b' }]}>
                    {cat.Category_id}
                  </Text>
                  <Text style={[styles.td, { flex: 1, fontWeight: '700', color: '#1e293b' }]}>
                    {cat.Category_name}
                  </Text>
                  <Text style={[styles.td, { width: 80, textAlign: 'center' }]}>
                    {cat.Display_order}
                  </Text>
                  <View style={[styles.tdAction, { width: 100 }]}>
                    <TouchableOpacity
                      style={styles.actionBtnEdit}
                      onPress={() => handleEdit(cat)}>
                      <FontAwesome5 name="pen" size={11} color="#2e7d32" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtnDelete}
                      onPress={() => handleDelete(cat.Category_id, cat.Category_name)}>
                      <FontAwesome5 name="trash-alt" size={11} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
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
  },
  row: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
  },
  formCol: {
    flex: Platform.OS === 'web' ? 4 : 1,
  },
  tableCol: {
    flex: Platform.OS === 'web' ? 8 : 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      },
    }),
  },
  cardHeaderSuccess: {
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderWhite: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cardHeaderTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardHeaderTitleGreen: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelEditBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cancelEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2e7d32',
  },
  cardBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  btnSubmit: {
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnSubmitText: {
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
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  td: {
    fontSize: 13,
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
