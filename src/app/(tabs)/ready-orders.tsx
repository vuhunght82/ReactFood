import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LotusTheme, formatVND } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function ReadyOrdersScreen() {
  const { orders, updateOrderStatus, systemSettings, updateSystemSettings } = useApp();
  const isSoundEnabled = systemSettings.sound_enabled;
  const toggleSound = () => updateSystemSettings({ sound_enabled: !isSoundEnabled });
  const [filterType, setFilterType] = useState<'ALL' | 'DINE_IN' | 'DELIVERY'>('ALL');
  const [showSlideModal, setShowSlideModal] = useState<boolean>(false);
  const [slideIndex, setSlideIndex] = useState<number>(0);

  const readyOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.Status !== 'READY') return false;
      const isDelivery = Boolean(o.Delivery_platform);
      if (filterType === 'DINE_IN') return !isDelivery;
      if (filterType === 'DELIVERY') return isDelivery;
      return true;
    });
  }, [orders, filterType]);

  const handleDeliver = (orderId: number, isDelivery: boolean) => {
    updateOrderStatus(orderId, 'COMPLETED');
    const msg = isDelivery
      ? 'Đã xác nhận giao đơn cho tài xế thành công!'
      : 'Đã hoàn tất bưng món ra bàn cho khách!';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Thành công', msg);
    }
  };

  const sampleSlides = [
    {
      title: 'MÓN CHAY THANH TỊNH HOA SEN',
      sub: 'Nguyên liệu hữu cơ tươi ngon mỗi ngày, thuần chay 100%',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
    },
    {
      title: 'ĐẬU HŨ SỐT NẤM HƯƠNG ĐẶC BIỆT',
      sub: 'Món ăn thanh đạm đậm vị, bổ dưỡng cho sức khỏe gia đình',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    },
    {
      title: 'LẨU NẤM HOA SEN ĐOÀN VIÊN',
      sub: 'Nước dùng nấm hầm ngọt tự nhiên từ rau củ tươi Đà Lạt',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Top Smart TV / Control Bar */}
      <View style={styles.topHeader}>
        <View style={styles.titleCol}>
          <View style={styles.headerTitleRow}>
            <FontAwesome5 name="concierge-bell" size={22} color="#fef08a" />
            <Text style={styles.headerTitle}>MÀN HÌNH NHẬN MÓN / TRẢ ĐƠN</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Bếp hoàn tất chế biến • Phục vụ bưng ra bàn hoặc bàn giao tài xế giao hàng
          </Text>
        </View>

        <View style={styles.actionBtnRow}>
          {/* Badge count */}
          <View style={styles.countBadge}>
            <FontAwesome5 name="check-circle" size={13} color="#ffffff" style={{ marginRight: 5 }} />
            <Text style={styles.countBadgeText}>Bếp Xong: {readyOrders.length}</Text>
          </View>

          {/* Toggle Slide Showcase */}
          <TouchableOpacity
            style={styles.goldBtn}
            onPress={() => setShowSlideModal(true)}
            activeOpacity={0.8}>
            <FontAwesome5 name="play" size={12} color="#1e293b" style={{ marginRight: 5 }} />
            <Text style={styles.goldBtnText}>Chạy Slide Toàn Màn Hình</Text>
          </TouchableOpacity>

          {/* Sound Toggle */}
          <TouchableOpacity
            style={[styles.outlineBtn, isSoundEnabled && styles.outlineBtnActive]}
            onPress={toggleSound}
            activeOpacity={0.8}>
            <FontAwesome5
              name={isSoundEnabled ? 'volume-up' : 'volume-mute'}
              size={13}
              color={isSoundEnabled ? '#22c55e' : '#cbd5e1'}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.outlineBtnText, isSoundEnabled && styles.outlineBtnTextActive]}>
              {isSoundEnabled ? 'Chuông: Bật' : 'Chuông: Tắt'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs Row */}
      <View style={styles.filterRow}>
        <View style={styles.filterGroup}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'ALL' && styles.filterChipActive]}
            onPress={() => setFilterType('ALL')}>
            <Text style={[styles.filterChipText, filterType === 'ALL' && styles.filterChipTextActive]}>
              Tất Cả ({readyOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'DINE_IN' && styles.filterChipActive]}
            onPress={() => setFilterType('DINE_IN')}>
            <Text style={[styles.filterChipText, filterType === 'DINE_IN' && styles.filterChipTextActive]}>
              🍽️ Ăn Tại Bàn
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'DELIVERY' && styles.filterChipActive]}
            onPress={() => setFilterType('DELIVERY')}>
            <Text style={[styles.filterChipText, filterType === 'DELIVERY' && styles.filterChipTextActive]}>
              🛵 Giao Hàng & Mang Về
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content List */}
      <ScrollView contentContainerStyle={styles.contentList} showsVerticalScrollIndicator={false}>
        {readyOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <FontAwesome5 name="concierge-bell" size={42} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>Chưa Có Đơn Nào Cần Trả Món</Text>
            <Text style={styles.emptySubtitle}>
              Khi bếp bấm "Nấu Xong", đơn hàng sẽ lập tức xuất hiện tại đây cùng chuông âm thanh thông báo.
            </Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {readyOrders.map((order) => {
              const isDelivery = Boolean(order.Delivery_platform);
              return (
                <View key={order.Order_id} style={styles.readyCard}>
                  {/* Card Header: Table or Delivery Platform */}
                  <View style={[styles.cardHeader, isDelivery ? styles.headerDelivery : styles.headerDineIn]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.targetCallout}>
                        {isDelivery ? `🛵 ${order.Delivery_platform}` : `🍽️ ${order.Table_name}`}
                      </Text>
                      <Text style={styles.orderCodeCallout}>Mã đơn: #{order.Order_code}</Text>
                    </View>
                    <View style={styles.statusPill}>
                      <FontAwesome5 name="check" size={11} color={LotusTheme.success} style={{ marginRight: 4 }} />
                      <Text style={styles.statusPillText}>ĐÃ NẤU XONG</Text>
                    </View>
                  </View>

                  {/* Body: Item rows */}
                  <View style={styles.cardBody}>
                    <Text style={styles.itemsTitle}>
                      <FontAwesome5 name="list" size={11} color="#64748b" style={{ marginRight: 4 }} />
                      Danh Sách Món Cần Bưng Cho Khách:
                    </Text>

                    <View style={styles.itemsList}>
                      {order.items.map((it, idx) => (
                        <View key={idx} style={styles.itemRow}>
                          <View style={styles.itemQtyBadge}>
                            <Text style={styles.itemQtyText}>{it.Quantity}x</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemName}>{it.Item_name}</Text>
                            {Array.isArray(it.Toppings) && it.Toppings.length > 0 ? (
                              <Text style={styles.itemTopping}>+ {it.Toppings.map((t: any) => t.name).join(', ')}</Text>
                            ) : typeof it.Toppings === 'string' && it.Toppings ? (
                              <Text style={styles.itemTopping}>+ {it.Toppings}</Text>
                            ) : null}
                            {it.Note ? <Text style={styles.itemNote}>Ghi chú: {it.Note}</Text> : null}
                          </View>
                          <Text style={styles.itemPrice}>{formatVND(it.Price * it.Quantity)}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.footerRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.customerInfo}>
                          {isDelivery
                            ? `Khách: ${order.Customer_name || 'Khách mang về'} • ĐT: ${order.Customer_phone || '--'}`
                            : `Thời gian đặt: ${order.Created_at}`}
                        </Text>
                        <Text style={styles.staffInfo}>Nhân viên: {order.Staff_name || 'Bếp'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.totalLabel}>TỔNG TIỀN</Text>
                        <Text style={styles.orderAmount}>{formatVND(order.Total_amount)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    style={[styles.deliverBtn, isDelivery ? styles.deliverBtnBlue : styles.deliverBtnGreen]}
                    onPress={() => handleDeliver(order.Order_id, isDelivery)}
                    activeOpacity={0.85}>
                    <FontAwesome5
                      name={isDelivery ? 'motorcycle' : 'check-circle'}
                      size={16}
                      color="#ffffff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.deliverBtnText}>
                      {isDelivery ? 'XÁC NHẬN ĐÃ GIAO CHO SHIPPER' : 'XÁC NHẬN ĐÃ BƯNG RA BÀN'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Slide Showcase Modal (Replicating Smart TV presentation) */}
      <Modal visible={showSlideModal} animationType="fade" transparent onRequestClose={() => setShowSlideModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.slideshowCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>TRÌNH CHIẾU SMART TV QUẢNG BÁ HOA SEN</Text>
              <TouchableOpacity onPress={() => setShowSlideModal(false)} style={styles.closeBtn}>
                <FontAwesome5 name="times" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Image
              source={{ uri: sampleSlides[slideIndex].image }}
              style={styles.slideImage}
              resizeMode="cover"
            />

            <View style={styles.slideCaption}>
              <Text style={styles.slideTitle}>{sampleSlides[slideIndex].title}</Text>
              <Text style={styles.slideSubtitle}>{sampleSlides[slideIndex].sub}</Text>
            </View>

            <View style={styles.slideControls}>
              <TouchableOpacity
                style={styles.slideNavBtn}
                onPress={() => setSlideIndex((prev) => (prev > 0 ? prev - 1 : sampleSlides.length - 1))}>
                <FontAwesome5 name="chevron-left" size={16} color="#ffffff" />
              </TouchableOpacity>

              <Text style={styles.slideCounter}>
                {slideIndex + 1} / {sampleSlides.length}
              </Text>

              <TouchableOpacity
                style={styles.slideNavBtn}
                onPress={() => setSlideIndex((prev) => (prev + 1) % sampleSlides.length)}>
                <FontAwesome5 name="chevron-right" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    backgroundColor: LotusTheme.primaryDark,
    padding: 14,
    borderBottomWidth: 3,
    borderBottomColor: LotusTheme.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  titleCol: {
    flex: 1,
    minWidth: 260,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#86efac',
    fontSize: 11,
    marginTop: 3,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  countBadge: {
    backgroundColor: LotusTheme.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  goldBtn: {
    backgroundColor: LotusTheme.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goldBtnText: {
    color: '#1e293b',
    fontSize: 11,
    fontWeight: '800',
  },
  outlineBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  outlineBtnActive: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  outlineBtnText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  outlineBtnTextActive: {
    color: '#86efac',
  },
  filterRow: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterChipActive: {
    backgroundColor: LotusTheme.primary,
    borderColor: LotusTheme.primaryDark,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  contentList: {
    padding: 14,
    paddingBottom: 50,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 18,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  readyCard: {
    width: Platform.OS === 'web' ? ('calc(50% - 7px)' as any) : '100%',
    minWidth: 290,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(46, 125, 50, 0.12)',
      },
    }),
  },
  cardHeader: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerDineIn: {
    backgroundColor: '#1b5e20',
  },
  headerDelivery: {
    backgroundColor: '#0369a1',
  },
  targetCallout: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  orderCodeCallout: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPillText: {
    color: LotusTheme.success,
    fontSize: 11,
    fontWeight: '900',
  },
  cardBody: {
    padding: 12,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemQtyBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  itemQtyText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#166534',
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  itemTopping: {
    fontSize: 11,
    color: LotusTheme.primary,
  },
  itemNote: {
    fontSize: 11,
    color: '#dc2626',
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  customerInfo: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  staffInfo: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: LotusTheme.danger,
  },
  deliverBtn: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliverBtnGreen: {
    backgroundColor: LotusTheme.success,
  },
  deliverBtnBlue: {
    backgroundColor: '#0284c7',
  },
  deliverBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  slideshowCard: {
    width: '100%',
    maxWidth: 700,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#1e293b',
  },
  modalHeaderTitle: {
    color: LotusTheme.accent,
    fontWeight: '800',
    fontSize: 13,
  },
  closeBtn: {
    padding: 6,
  },
  slideImage: {
    width: '100%',
    height: 320,
  },
  slideCaption: {
    padding: 16,
    backgroundColor: '#1e293b',
  },
  slideTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  slideSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  slideControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0f172a',
  },
  slideNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideCounter: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
