import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MenuItem, Topping } from '@/types';
import { formatVND } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { API_BASE_URL } from '@/constants/apiConfig'; // Trỏ đúng đường dẫn tới file bạn vừa tạo ở Bước 1
export default function MenuTableScreen() {
  const { menuItems, categories, addMenuItem, updateMenuItem, deleteMenuItem } = useApp();

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<number>(categories[0]?.Category_id || 1);
  const [itemCode, setItemCode] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [basePrice, setBasePrice] = useState<string>('45000');
  const [costPrice, setCostPrice] = useState<string>('0');
  const [isAvailable, setIsAvailable] = useState<number>(1);
  const [printerTarget, setPrinterTarget] = useState<'KITCHEN_MAIN' | 'BAR'>('KITCHEN_MAIN');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [toppings, setToppings] = useState<Topping[]>([]);

  // Filter state for right column table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCatId, setFilterCatId] = useState<number | 'ALL'>('ALL');

  const filteredItems = useMemo(() => {
    return menuItems.filter((m) => {
      const matchCat = filterCatId === 'ALL' || m.Category_id === filterCatId;
      const matchSearch =
        !searchQuery.trim() ||
        m.Item_name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        m.Item_code.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCat && matchSearch;
    });
  }, [menuItems, filterCatId, searchQuery]);

  const handleEdit = (item: MenuItem) => {
    setEditingItemId(item.Item_id);
    setSelectedCatId(item.Category_id);
    setItemCode(item.Item_code);
    setItemName(item.Item_name);
    setBasePrice(String(item.Base_price || 0));
    setCostPrice(String(item.Cost_price || 0));
    setIsAvailable(item.Is_available);
    setPrinterTarget(item.Printer_target || 'KITCHEN_MAIN');
    setImageUrl(item.Image_url || '');
    setDescription(item.Description || '');

    let parsedToppings: Topping[] = [];
    try {
      if (Array.isArray(item.Toppings)) parsedToppings = item.Toppings;
      else if (typeof item.Toppings === 'string') parsedToppings = JSON.parse(item.Toppings);
    } catch {}
    setToppings(parsedToppings);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setItemCode('');
    setItemName('');
    setBasePrice('45000');
    setCostPrice('0');
    setIsAvailable(1);
    setImageUrl('');
    setDescription('');
    setToppings([]);
  };

  const handleAddToppingRow = () => {
    setToppings([...toppings, { name: 'Topping mới', price: 5000 }]);
  };

  const handleRemoveToppingRow = (idx: number) => {
    setToppings(toppings.filter((_, i) => i !== idx));
  };

  const handleUpdateTopping = (idx: number, field: 'name' | 'price', val: any) => {
    const updated = [...toppings];
    updated[idx] = { ...updated[idx], [field]: val };
    setToppings(updated);
  };

  const handleSubmit = () => {
    if (!itemName.trim() || !itemCode.trim()) {
      if (Platform.OS === 'web') alert('Vui lòng nhập mã món và tên món!');
      else Alert.alert('Thông báo', 'Vui lòng nhập mã món và tên món!');
      return;
    }

    const payload = {
      Category_id: selectedCatId,
      Item_code: itemCode.trim().toUpperCase(),
      Item_name: itemName.trim(),
      Base_price: Number(basePrice) || 0,
      Cost_price: Number(costPrice) || 0,
      Is_available: isAvailable,
      Printer_target: printerTarget,
      Image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500',
      Description: description.trim(),
      Toppings: toppings,
    };

    if (editingItemId) {
      updateMenuItem({ ...payload, Item_id: editingItemId });
      handleCancelEdit();
    } else {
      addMenuItem(payload);
      handleCancelEdit();
    }
  };

  const handleDelete = (itemId: number, name: string) => {
    const doDelete = () => deleteMenuItem(itemId);
    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc muốn xóa món "${name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa món "${name}"?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.row}>
        {/* CỘT TRÁI: FORM THÊM / SỬA MÓN */}
        <View style={styles.formCol}>
          <View style={styles.card}>
            <View style={styles.cardHeaderSuccess}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FontAwesome5 name="utensils" size={14} color="#ffffff" />
                <Text style={styles.cardHeaderTitle}>
                  {editingItemId ? 'Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
                </Text>
              </View>
              {editingItemId ? (
                <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelEditBtn}>
                  <Text style={styles.cancelEditText}>Hủy sửa</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.cardBody}>
              {/* Category selector */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Danh mục món <Text style={{ color: '#dc3545' }}>*</Text>
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsRow}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.Category_id}
                      style={[styles.catChip, selectedCatId === c.Category_id && styles.catChipActive]}
                      onPress={() => setSelectedCatId(c.Category_id)}>
                      <Text style={[styles.catChipText, selectedCatId === c.Category_id && styles.catChipTextActive]}>
                        {c.Category_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Code & Name */}
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Mã món <Text style={{ color: '#dc3545' }}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: DT01"
                    value={itemCode}
                    onChangeText={setItemCode}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.label}>Tên món chay <Text style={{ color: '#dc3545' }}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: Phở Chay Hoa Sen"
                    value={itemName}
                    onChangeText={setItemName}
                  />
                </View>
              </View>

              {/* Base price & Cost price */}
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Giá bán (VNĐ) <Text style={{ color: '#dc3545' }}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={basePrice}
                    onChangeText={setBasePrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Giá vốn (VNĐ)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={costPrice}
                    onChangeText={setCostPrice}
                  />
                </View>
              </View>

              {/* Status & Printer */}
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Trạng thái</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.statusToggle, isAvailable === 1 && styles.statusToggleActive]}
                      onPress={() => setIsAvailable(1)}>
                      <Text style={[styles.statusToggleText, isAvailable === 1 && styles.statusToggleTextActive]}>
                        Còn món
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.statusToggle, isAvailable === 0 && styles.statusToggleInactive]}
                      onPress={() => setIsAvailable(0)}>
                      <Text style={[styles.statusToggleText, isAvailable === 0 && styles.statusToggleTextActive]}>
                        Hết món
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Máy in bếp</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.statusToggle, printerTarget === 'KITCHEN_MAIN' && styles.statusToggleActive]}
                      onPress={() => setPrinterTarget('KITCHEN_MAIN')}>
                      <Text style={[styles.statusToggleText, printerTarget === 'KITCHEN_MAIN' && styles.statusToggleTextActive]}>
                        Bếp Chính
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.statusToggle, printerTarget === 'BAR' && styles.statusToggleActive]}
                      onPress={() => setPrinterTarget('BAR')}>
                      <Text style={[styles.statusToggleText, printerTarget === 'BAR' && styles.statusToggleTextActive]}>
                        Bar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Image URL */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Link ảnh (URL):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://..."
                  value={imageUrl}
                  onChangeText={setImageUrl}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Mô tả ngắn:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nước dùng nấm thanh ngọt tự nhiên..."
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Toppings Management */}
              <View style={styles.toppingsSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.toppingHeaderTitle}>
                    <FontAwesome5 name="layer-group" size={11} color="#2e7d32" /> Topping Đi Kèm
                  </Text>
                  <TouchableOpacity style={styles.addToppingBtn} onPress={handleAddToppingRow}>
                    <FontAwesome5 name="plus" size={10} color="#2e7d32" style={{ marginRight: 4 }} />
                    <Text style={styles.addToppingBtnText}>Thêm Topping</Text>
                  </TouchableOpacity>
                </View>

                {toppings.map((top, idx) => (
                  <View key={idx} style={styles.toppingRow}>
                    <TextInput
                      style={[styles.input, { flex: 2, paddingVertical: 4 }]}
                      placeholder="Tên topping"
                      value={top.name}
                      onChangeText={(val) => handleUpdateTopping(idx, 'name', val)}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1, paddingVertical: 4 }]}
                      keyboardType="numeric"
                      placeholder="Giá"
                      value={String(top.price)}
                      onChangeText={(val) => handleUpdateTopping(idx, 'price', Number(val) || 0)}
                    />
                    <TouchableOpacity onPress={() => handleRemoveToppingRow(idx)} style={{ padding: 6 }}>
                      <FontAwesome5 name="times" size={12} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Submit Button */}
              <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} activeOpacity={0.85}>
                <FontAwesome5 name="save" size={13} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.btnSubmitText}>
                  {editingItemId ? 'Lưu Thay Đổi Món' : 'Lưu Món Ăn'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* CỘT PHẢI: BẢNG DANH SÁCH MÓN ĂN */}
        <View style={styles.tableCol}>
          <View style={styles.card}>
            <View style={styles.cardHeaderWhite}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FontAwesome5 name="utensils" size={14} color="#2e7d32" />
                <Text style={styles.cardHeaderTitleGreen}>Quản Lý Thực Đơn ({filteredItems.length} món)</Text>
              </View>

              {/* Search & Filter */}
              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <FontAwesome5 name="search" size={11} color="#94a3b8" style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm tên hoặc mã món..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>
            </View>

            {/* Category Filter Chips */}
            <View style={styles.catFilterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                <TouchableOpacity
                  style={[styles.filterChip, filterCatId === 'ALL' && styles.filterChipActive]}
                  onPress={() => setFilterCatId('ALL')}>
                  <Text style={[styles.filterChipText, filterCatId === 'ALL' && styles.filterChipTextActive]}>
                    Tất Cả ({menuItems.length})
                  </Text>
                </TouchableOpacity>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.Category_id}
                    style={[styles.filterChip, filterCatId === c.Category_id && styles.filterChipActive]}
                    onPress={() => setFilterCatId(c.Category_id)}>
                    <Text style={[styles.filterChipText, filterCatId === c.Category_id && styles.filterChipTextActive]}>
                      {c.Category_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Table */}
            <View style={styles.tableWrapper}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 50, textAlign: 'center' }]}>Ảnh</Text>
                <Text style={[styles.th, { width: 60 }]}>Mã</Text>
                <Text style={[styles.th, { flex: 1 }]}>Tên Món Chay</Text>
                <Text style={[styles.th, { width: 90, textAlign: 'right' }]}>Giá Bán</Text>
                <Text style={[styles.th, { width: 85, textAlign: 'center' }]}>Trạng Thái</Text>
                <Text style={[styles.th, { width: 75, textAlign: 'center' }]}>Thao Tác</Text>
              </View>

              {filteredItems.map((item) => (
                <View key={item.Item_id} style={styles.tableDataRow}>
                  <View style={{ width: 50, alignItems: 'center' }}>
                    <Image
                      source={{ uri: item.Image_url }}
                      style={styles.itemThumb as any}
                      defaultSource={require('@/assets/images/dish-sample.jpg')}
                    />
                  </View>
                  <Text style={[styles.td, { width: 60, fontWeight: '700', color: '#64748b' }]}>
                    {item.Item_code}
                  </Text>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={[styles.td, { fontWeight: '700', color: '#1e293b' }]}>
                      {item.Item_name}
                    </Text>
                    {item.Description ? (
                      <Text style={{ fontSize: 10, color: '#64748b' }} numberOfLines={1}>
                        {item.Description}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.td, { width: 90, textAlign: 'right', fontWeight: '800', color: '#2e7d32' }]}>
                    {formatVND(item.Base_price)}
                  </Text>
                  <View style={{ width: 85, alignItems: 'center' }}>
                    <TouchableOpacity
                      style={[
                        styles.availPill,
                        item.Is_available ? styles.availPillActive : styles.availPillInactive,
                      ]}
                      onPress={() =>
                        updateMenuItem({
                          ...item,
                          Is_available: item.Is_available ? 0 : 1,
                        })
                      }>
                      <Text
                        style={[
                          styles.availPillText,
                          item.Is_available ? styles.availPillTextActive : styles.availPillTextInactive,
                        ]}>
                        {item.Is_available ? 'Còn món' : 'Hết món'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.tdAction, { width: 75 }]}>
                    <TouchableOpacity style={styles.actionBtnEdit} onPress={() => handleEdit(item)}>
                      <FontAwesome5 name="pen" size={10} color="#2e7d32" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnDelete} onPress={() => handleDelete(item.Item_id, item.Item_name)}>
                      <FontAwesome5 name="trash-alt" size={10} color="#dc3545" />
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
    paddingBottom: 40,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
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
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  catChipsRow: {
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  catChipActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  catChipTextActive: {
    color: '#ffffff',
  },
  statusToggle: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  statusToggleActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  statusToggleInactive: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  statusToggleTextActive: {
    color: '#ffffff',
  },
  toppingsSection: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  toppingHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
  },
  addToppingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e7d32',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  addToppingBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2e7d32',
  },
  toppingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 8,
    height: 30,
    width: 170,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    color: '#0f172a',
  },
  catFilterBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: '#2e7d32',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  tableWrapper: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  td: {
    fontSize: 12,
  },
  itemThumb: {
    width: 36,
    height: 36,
    borderRadius: 4,
    resizeMode: 'cover',
  },
  availPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  availPillActive: {
    backgroundColor: '#dcfce7',
  },
  availPillInactive: {
    backgroundColor: '#fee2e2',
  },
  availPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  availPillTextActive: {
    color: '#16a34a',
  },
  availPillTextInactive: {
    color: '#dc3545',
  },
  tdAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnEdit: {
    backgroundColor: '#e8f5e9',
    padding: 5,
    borderRadius: 4,
  },
  actionBtnDelete: {
    backgroundColor: '#fee2e2',
    padding: 5,
    borderRadius: 4,
  },
});
