import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Vibration,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Order, OrderStatus } from '@/types';
import { LotusTheme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function KitchenScreen() {
  const { orders, currentUser, updateOrderStatus, systemSettings, updateSystemSettings, hasPermission } = useApp();
  const isSoundEnabled = systemSettings.sound_enabled;
  const toggleSound = () => updateSystemSettings({ sound_enabled: !isSoundEnabled });

  const isAllowed = hasPermission('KITCHEN') || currentUser.Role === 'ADMIN' || currentUser.Role === 'KITCHEN';

  const [activeKitchenTab, setActiveKitchenTab] = useState<'PENDING' | 'HISTORY' | 'MY_LOGS'>('PENDING');

  // Filter orders for Pending tab
  const pendingOrders = useMemo(() => {
    return orders
      .filter((o) => o.Status === 'PENDING' || o.Status === 'PROCESSING' || o.Status === 'COOKING')
      .sort((a, b) => b.Order_id - a.Order_id);
  }, [orders]);

  // Filter orders for History tab
  const historyOrders = useMemo(() => {
    return orders
      .filter((o) => o.Status === 'READY' || o.Status === 'COMPLETED')
      .sort((a, b) => b.Order_id - a.Order_id);
  }, [orders]);

  // Filter orders for My Logs
  const myLogOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (currentUser.User_name && o.Staff_name?.toLowerCase().includes(currentUser.User_name.toLowerCase())) ||
        (currentUser.Full_name && o.Staff_name?.toLowerCase().includes(currentUser.Full_name.toLowerCase())) ||
        (o.Created_by && String(o.Created_by) === String(currentUser.User_id))
    );
  }, [orders, currentUser]);

  const handleStartCooking = (orderId: number) => {
    updateOrderStatus(orderId, 'COOKING');
    if (Platform.OS !== 'web') Vibration.vibrate(100);
  };

  const handleFinishCooking = (orderId: number) => {
    updateOrderStatus(orderId, 'READY');
    if (Platform.OS !== 'web') Vibration.vibrate([100, 100, 100]);
  };

  const displayedOrders =
    activeKitchenTab === 'PENDING'
      ? pendingOrders
      : activeKitchenTab === 'HISTORY'
      ? historyOrders
      : myLogOrders;

  if (!isAllowed) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f8fafc' }}>
        <FontAwesome5 name="fire-extinguisher" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#dc2626', marginBottom: 8 }}>Quyền Truy Cập Bị Hạn Chế</Text>
        <Text style={{ fontSize: 13, color: '#475569', textAlign: 'center', maxWidth: 400 }}>Tài khoản của bạn chưa được cấp quyền truy cập Màn Hình Bếp (KDS). Vui lòng liên hệ Quản Lý để được phân quyền!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Bar matching HTML #kitchenHeaderBar */}
      <View style={styles.headerBar}>
        <View style={styles.titleRow}>
          <FontAwesome5 name="fire-alt" size={20} color="#facc15" />
          <View>
            <Text style={styles.headerTitle}>MÀN HÌNH BẾP THỜI GIAN THỰC (KDS)</Text>
            <Text style={styles.headerSubtitle}>Quản lý thứ tự nấu, xuất món nhanh chóng, đồng bộ tức thì</Text>
          </View>
        </View>

        <View style={styles.headerActionsRow}>
          {/* Sound Toggle */}
          <TouchableOpacity
            style={[styles.outlineActionBtn, isSoundEnabled && styles.outlineActionBtnActive]}
            onPress={toggleSound}>
            <FontAwesome5
              name={isSoundEnabled ? 'volume-up' : 'volume-mute'}
              size={12}
              color={isSoundEnabled ? '#4ade80' : '#94a3b8'}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.outlineActionText, isSoundEnabled && styles.outlineActionTextActive]}>
              {isSoundEnabled ? 'Âm Báo: Bật' : 'Âm Báo: Tắt'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3 Kitchen Navigation Tabs */}
      <View style={styles.tabsStrip}>
        <TouchableOpacity
          style={[styles.tabBtn, activeKitchenTab === 'PENDING' && styles.tabBtnActive]}
          onPress={() => setActiveKitchenTab('PENDING')}>
          <FontAwesome5
            name="list-ul"
            size={12}
            color={activeKitchenTab === 'PENDING' ? '#ffffff' : '#475569'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeKitchenTab === 'PENDING' && styles.tabTextActive]}>
            Đơn Chờ Chế Biến ({pendingOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeKitchenTab === 'HISTORY' && styles.tabBtnActive]}
          onPress={() => setActiveKitchenTab('HISTORY')}>
          <FontAwesome5
            name="history"
            size={12}
            color={activeKitchenTab === 'HISTORY' ? '#ffffff' : '#475569'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeKitchenTab === 'HISTORY' && styles.tabTextActive]}>
            Lịch Sử Đơn Bếp ({historyOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeKitchenTab === 'MY_LOGS' && styles.tabBtnActive]}
          onPress={() => setActiveKitchenTab('MY_LOGS')}>
          <FontAwesome5
            name="clipboard-user"
            size={12}
            color={activeKitchenTab === 'MY_LOGS' ? '#ffffff' : '#475569'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeKitchenTab === 'MY_LOGS' && styles.tabTextActive]}>
            Nhật Ký Của Tôi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders Tickets Content */}
      <ScrollView contentContainerStyle={styles.ticketsContainer} showsVerticalScrollIndicator={false}>
        {displayedOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <FontAwesome5 name="check-double" size={38} color="#22c55e" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeKitchenTab === 'PENDING'
                ? 'Bếp Đã Nấu Xong Hết Các Món!'
                : 'Không Có Đơn Nào Trong Mục Này'}
            </Text>
            <Text style={styles.emptySub}>
              {activeKitchenTab === 'PENDING'
                ? 'Hiện không còn món nào đang chờ chế biến. Hãy chuẩn bị nguyên liệu tiếp theo.'
                : 'Các đơn hoàn tất hoặc đơn của bạn sẽ được lưu trữ tại đây.'}
            </Text>
          </View>
        ) : (
          <View style={styles.ticketGrid}>
            {displayedOrders.map((order) => {
              const isCooking = order.Status === 'COOKING';
              const isReady = order.Status === 'READY';
              const isCompleted = order.Status === 'COMPLETED';

              return (
                <View
                  key={order.Order_id}
                  style={[
                    styles.ticketCard,
                    isReady || isCompleted
                      ? styles.ticketReady
                      : isCooking
                      ? styles.ticketCooking
                      : styles.ticketPending,
                  ]}>
                  {/* Ticket Header */}
                  <View
                    style={[
                      styles.ticketHeader,
                      isReady || isCompleted
                        ? styles.headerReady
                        : isCooking
                        ? styles.headerCooking
                        : styles.headerPending,
                    ]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketTarget}>
                        {order.Table_name
                          ? `🍽️ ${order.Table_name}`
                          : `🛵 ${order.Delivery_platform || order.Customer_name || 'Mang về'}`}
                      </Text>
                      <Text style={styles.ticketCode}>Mã: #{order.Order_code}</Text>
                    </View>

                    <View style={styles.ticketTimeBox}>
                      <FontAwesome5 name="clock" size={11} color="rgba(255,255,255,0.85)" style={{ marginRight: 4 }} />
                      <Text style={styles.ticketTimeText}>{order.Created_at}</Text>
                    </View>
                  </View>

                  {/* Status Banner */}
                  <View
                    style={[
                      styles.statusBanner,
                      {
                        backgroundColor:
                          isReady || isCompleted
                            ? '#dcfce7'
                            : isCooking
                            ? '#fef3c7'
                            : '#fee2e2',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.statusBannerText,
                        {
                          color:
                            isReady || isCompleted
                              ? '#15803d'
                              : isCooking
                              ? '#b45309'
                              : '#b91c1c',
                        },
                      ]}>
                      {isCompleted
                        ? '✔️ ĐƠN ĐÃ HOÀN TẤT'
                        : isReady
                        ? '🔔 BẾP ĐÃ NẤU XONG - CHỜ BƯNG RA'
                        : isCooking
                        ? '🍳 ĐANG NẤU TRÊN BẾP'
                        : '⏳ CHỜ BẾP TIẾP NHẬN NẤU'}
                    </Text>
                  </View>

                  {/* Items List */}
                  <View style={styles.ticketItemsList}>
                    {order.items.map((it, idx) => (
                      <View key={idx} style={styles.ticketItemRow}>
                        <View style={styles.kdsQtyBadge}>
                          <Text style={styles.kdsQtyText}>{it.Quantity}x</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.kdsItemName}>{it.Item_name}</Text>
                          {Array.isArray(it.Toppings) && it.Toppings.length > 0 ? (
                            <Text style={styles.kdsToppings}>
                              + {it.Toppings.map((t: any) => t.name).join(', ')}
                            </Text>
                          ) : typeof it.Toppings === 'string' && it.Toppings ? (
                            <Text style={styles.kdsToppings}>+ {it.Toppings}</Text>
                          ) : null}
                          {it.Note ? (
                            <Text style={styles.kdsNote}>Ghi chú: {it.Note}</Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Customer / Note Bar */}
                  {order.Customer_name ? (
                    <View style={styles.customerBar}>
                      <Text style={styles.customerBarText}>
                        Khách: {order.Customer_name} • ĐT: {order.Customer_phone || '--'}
                      </Text>
                    </View>
                  ) : null}

                  {/* Action Buttons */}
                  {activeKitchenTab === 'PENDING' && (
                    <View style={styles.actionsContainer}>
                      {!isCooking ? (
                        <TouchableOpacity
                          style={styles.btnStartCooking}
                          onPress={() => handleStartCooking(order.Order_id)}
                          activeOpacity={0.85}>
                          <FontAwesome5 name="fire-burner" size={14} color="#15803d" style={{ marginRight: 6 }} />
                          <Text style={styles.btnStartCookingText}>
                            CHẤP NHẬN BẾP (BẮT ĐẦU LÀM)
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.btnFinishCooking}
                          onPress={() => handleFinishCooking(order.Order_id)}
                          activeOpacity={0.85}>
                          <FontAwesome5 name="check-circle" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                          <Text style={styles.btnFinishCookingText}>
                            BẾP ĐÃ NẤU XONG (HOÀN TẤT)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBar: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderBottomWidth: 3,
    borderBottomColor: LotusTheme.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: LotusTheme.accent,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outlineActionBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  outlineActionBtnActive: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
  },
  outlineActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  outlineActionTextActive: {
    color: '#86efac',
  },
  tabsStrip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexWrap: 'wrap',
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0f172a',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  ticketsContainer: {
    padding: 14,
    paddingBottom: 70,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e293b',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    maxWidth: 340,
    textAlign: 'center',
    lineHeight: 18,
  },
  ticketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  ticketCard: {
    width: Platform.OS === 'web' ? ('calc(33.333% - 10px)' as any) : '100%',
    minWidth: 280,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    ...Platform.select({
      web: { boxShadow: '0 4px 15px rgba(0,0,0,0.08)' },
    }),
  },
  ticketPending: {
    borderColor: '#fca5a5',
  },
  ticketCooking: {
    borderColor: '#93c5fd',
  },
  ticketReady: {
    borderColor: '#86efac',
  },
  ticketHeader: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerPending: {
    backgroundColor: '#b91c1c',
  },
  headerCooking: {
    backgroundColor: '#1d4ed8',
  },
  headerReady: {
    backgroundColor: '#15803d',
  },
  ticketTarget: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  ticketCode: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  ticketTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ticketTimeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBanner: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statusBannerText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ticketItemsList: {
    padding: 12,
    gap: 8,
  },
  ticketItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  kdsQtyBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#86efac',
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  kdsQtyText: {
    color: '#15803d',
    fontSize: 15,
    fontWeight: '900',
  },
  kdsItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  kdsToppings: {
    fontSize: 11,
    color: LotusTheme.primary,
    marginTop: 1,
  },
  kdsNote: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '700',
    marginTop: 1,
  },
  customerBar: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  customerBarText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  btnStartCooking: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderTopColor: '#16a34a',
  },
  btnStartCookingText: {
    color: '#15803d',
    fontSize: 12.5,
    fontWeight: '900',
  },
  btnFinishCooking: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFinishCookingText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});
