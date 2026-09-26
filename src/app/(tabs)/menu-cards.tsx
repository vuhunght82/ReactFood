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
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MenuItem } from '@/types';
import { formatVND } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { DishOptionsModal } from '@/components/DishOptionsModal';

export default function MenuCardsScreen() {
  const {
    menuItems,
    categories,
    selectedTable,
    cartOrderType,
    deliveryContext,
    syncFromServer,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCatId, setActiveCatId] = useState<number | 'ALL'>('ALL');
  const [modalDish, setModalDish] = useState<MenuItem | null>(null);

  const filteredDishes = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = activeCatId === 'ALL' || item.Category_id === activeCatId;
      const matchSearch =
        !searchQuery.trim() ||
        item.Item_name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.Item_code.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCat && matchSearch;
    });
  }, [menuItems, activeCatId, searchQuery]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.mainCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.headerTitle}>
            <FontAwesome5 name="utensils" size={16} color="#2e7d32" style={{ marginRight: 8 }} />
            Thực Đơn Nhà Hàng
          </Text>

          <View style={styles.headerRightActions}>
            <View style={styles.searchBox}>
              <FontAwesome5 name="search" size={12} color="#94a3b8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm món ăn..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity style={styles.btnRefresh} onPress={() => syncFromServer()}>
              <FontAwesome5 name="sync-alt" size={12} color="#2e7d32" style={{ marginRight: 4 }} />
              <Text style={styles.btnRefreshText}>Làm mới</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Context Banner */}
        <View style={styles.contextBanner}>
          <View style={styles.contextInfo}>
            <FontAwesome5
              name={cartOrderType === 'DINE_IN' ? 'table' : 'motorcycle'}
              size={13}
              color="#166534"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.contextTitle}>
              {cartOrderType === 'DINE_IN'
                ? selectedTable
                  ? `Đang phục vụ tại bàn: ${selectedTable.Table_name} (${selectedTable.Area})`
                  : 'Ăn tại quán: Chưa chọn bàn ăn cụ thể'
                : `Đơn giao hàng: ${deliveryContext.platform} • Khách: ${deliveryContext.customerName || 'Khách lấy mang về'}`}
            </Text>
          </View>
        </View>

        {/* Category Horizontal Tabs */}
        <View style={styles.catTabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catTabsList}>
            <TouchableOpacity
              style={[styles.catBtn, activeCatId === 'ALL' && styles.catBtnActive]}
              onPress={() => setActiveCatId('ALL')}>
              <Text style={[styles.catBtnText, activeCatId === 'ALL' && styles.catBtnTextActive]}>
                Tất Cả ({menuItems.length})
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => {
              const isActive = activeCatId === cat.Category_id;
              return (
                <TouchableOpacity
                  key={cat.Category_id}
                  style={[styles.catBtn, isActive && styles.catBtnActive]}
                  onPress={() => setActiveCatId(cat.Category_id)}>
                  <Text style={[styles.catBtnText, isActive && styles.catBtnTextActive]}>
                    {cat.Category_name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Menu Cards Grid */}
        <View style={styles.cardsGrid}>
          {filteredDishes.map((dish) => {
            const isAvailable = dish.Is_available !== 0;

            return (
              <TouchableOpacity
                key={dish.Item_id}
                style={[styles.dishCard, !isAvailable && styles.dishCardDisabled]}
                onPress={() => isAvailable && setModalDish(dish)}
                activeOpacity={0.85}>
                {/* Dish Image */}
                <View style={styles.imgBox}>
                  <Image
                    source={{ uri: dish.Image_url }}
                    style={styles.dishImg as any}
                    defaultSource={require('@/assets/images/dish-sample.jpg')}
                  />
                  {!isAvailable ? (
                    <View style={styles.badgeUnavailable}>
                      <Text style={styles.badgeUnavailableText}>TẠM HẾT</Text>
                    </View>
                  ) : null}
                  <View style={styles.badgeCode}>
                    <Text style={styles.badgeCodeText}>{dish.Item_code}</Text>
                  </View>
                </View>

                {/* Dish Body */}
                <View style={styles.dishBody}>
                  <Text style={styles.dishName} numberOfLines={2}>
                    {dish.Item_name}
                  </Text>
                  {dish.Description ? (
                    <Text style={styles.dishDesc} numberOfLines={1}>
                      {dish.Description}
                    </Text>
                  ) : null}

                  <View style={styles.dishFooterRow}>
                    <Text style={styles.dishPrice}>{formatVND(dish.Base_price)}</Text>
                    {isAvailable ? (
                      <View style={styles.addCartBtn}>
                        <FontAwesome5 name="plus" size={11} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.addCartBtnText}>Chọn</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Dish Options Modal */}
      <DishOptionsModal
        dish={modalDish}
        visible={Boolean(modalDish)}
        onClose={() => setModalDish(null)}
      />
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
    paddingBottom: 80,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      },
    }),
  },
  cardHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2e7d32',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 34,
    width: 200,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0f172a',
  },
  btnRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e7d32',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  btnRefreshText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
  },
  contextBanner: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#c8e6c9',
  },
  contextInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b5e20',
  },
  catTabsWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  catTabsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catBtnActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  catBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  catBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  cardsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  dishCard: {
    width: Platform.OS === 'web' ? ('calc(25% - 11px)' as any) : '47%',
    minWidth: 155,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      },
    }),
  },
  dishCardDisabled: {
    opacity: 0.6,
  },
  imgBox: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: '#f1f5f9',
  },
  dishImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeUnavailable: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(211, 47, 47, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeUnavailableText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  badgeCode: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCodeText: {
    color: '#fef08a',
    fontSize: 10,
    fontWeight: '700',
  },
  dishBody: {
    padding: 10,
  },
  dishName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    minHeight: 34,
  },
  dishDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  dishFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dishPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2e7d32',
  },
  addCartBtn: {
    backgroundColor: '#2e7d32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  addCartBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
