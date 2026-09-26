import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Order, OrderStatus } from '@/types';
import { LotusTheme, formatVND } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { PaymentModal } from '@/components/PaymentModal';
import { useRouter } from 'expo-router';

interface OrderHistoryEntry {
  time: string;
  user: string;
  oldContent: string;
  newContent: string;
}

export default function OrdersScreen() {
  const router = useRouter();
  const {
    orders,
    currentUser,
    updateOrderStatus,
    cancelOrder,
    showAlert,
    showConfirm,
    hasPermission,
    systemSettings,
  } = useApp();

  // Filters & State
  const [scope, setScope] = useState<'MY_ORDERS' | 'ALL_ORDERS'>('MY_ORDERS');
  const [activeTab, setActiveTab] = useState<'LIST' | 'STATS' | 'STAFF_KPI'>('LIST');
  const [timeRange, setTimeRange] = useState<string>('TODAY');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCharts, setShowCharts] = useState<boolean>(false);

  // Modals
  const [billModalOrder, setBillModalOrder] = useState<Order | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Khách đổi ý không dùng nữa');
  const [customCancelReason, setCustomCancelReason] = useState<string>('');
  const [historyModalOrder, setHistoryModalOrder] = useState<Order | null>(null);
  const [editOrderTarget, setEditOrderTarget] = useState<Order | null>(null);
  const [editItemNotes, setEditItemNotes] = useState<Record<number, string>>({});

  // History logs store (in memory / mock for demonstrate)
  const [orderHistories, setOrderHistories] = useState<Record<string, OrderHistoryEntry[]>>({
    HD1008: [
      {
        time: '11:20 23/09/2026',
        user: 'vu',
        oldContent: '1x Lẩu Chay, 1x Chả Giò',
        newContent: '1x Lẩu Chay, 2x Chả Giò, 2x Trà Đào',
      },
    ],
  });

  const canSeeAll = hasPermission('ORDERS_ALL') || currentUser.Role === 'ADMIN' || currentUser.Role === 'CASHIER';
  const canEdit = hasPermission('ORDERS_EDIT') || currentUser.Role === 'ADMIN' || currentUser.Role === 'CASHIER';
  const canCancel = hasPermission('ORDERS_CANCEL') || currentUser.Role === 'ADMIN' || currentUser.Role === 'CASHIER';
  const canDelete = hasPermission('ORDERS_DELETE') || currentUser.Role === 'ADMIN';

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Scope
      if (scope === 'MY_ORDERS' && !canSeeAll) {
        const isMyOrder =
          (currentUser.User_name && o.Staff_name?.toLowerCase().includes(currentUser.User_name.toLowerCase())) ||
          (currentUser.Full_name && o.Staff_name?.toLowerCase().includes(currentUser.Full_name.toLowerCase())) ||
          (o.Created_by && String(o.Created_by) === String(currentUser.User_id));
        if (!isMyOrder) return false;
      }

      // 2. Status
      if (statusFilter === 'SERVING') {
        if (o.Status === 'COMPLETED' || o.Status === 'CANCELLED') return false;
      } else if (statusFilter === 'UNPAID') {
        if (o.Payment_status === 'PAID' || o.Status === 'CANCELLED') return false;
      } else if (statusFilter === 'PAID_COMPLETED') {
        if (o.Status !== 'COMPLETED' && o.Payment_status !== 'PAID') return false;
      } else if (statusFilter === 'CANCELED') {
        if (o.Status !== 'CANCELLED') return false;
      }

      // 3. Type
      if (typeFilter === 'DINE_IN' && Boolean(o.Delivery_platform)) return false;
      if (typeFilter === 'TAKE_AWAY_SELF' && !o.Delivery_platform) return false;

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = o.Order_code.toLowerCase().includes(q);
        const matchTable = (o.Table_name || o.Table_number || '').toLowerCase().includes(q);
        const matchCustomer = (o.Customer_name || '').toLowerCase().includes(q);
        const matchStaff = (o.Staff_name || '').toLowerCase().includes(q);
        if (!matchCode && !matchTable && !matchCustomer && !matchStaff) return false;
      }

      return true;
    });
  }, [orders, scope, canSeeAll, statusFilter, typeFilter, searchQuery, currentUser]);

  // KPI Calculations
  const kpiServingCount = useMemo(
    () => orders.filter((o) => o.Status !== 'COMPLETED' && o.Status !== 'CANCELLED').length,
    [orders]
  );
  const kpiUnpaidServing = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.Status !== 'COMPLETED' &&
          o.Status !== 'CANCELLED' &&
          o.Payment_status !== 'PAID'
      ).length,
    [orders]
  );
  const kpiCompletedCount = useMemo(
    () => orders.filter((o) => o.Status === 'COMPLETED').length,
    [orders]
  );
  const kpiCanceledCount = useMemo(
    () => orders.filter((o) => o.Status === 'CANCELLED').length,
    [orders]
  );
  const kpiTotalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.Status === 'COMPLETED' || o.Payment_status === 'PAID')
        .reduce((sum, o) => sum + (o.Total_amount || 0), 0),
    [orders]
  );

  // Actions
  const handleMarkCompleted = (order: Order) => {
    showConfirm(
      'Xác nhận hoàn thành',
      `Đánh dấu đơn #${order.Order_code} là ĐÃ HOÀN THÀNH?`,
      () => {
        updateOrderStatus(order.Order_id, 'COMPLETED');
        showAlert('Thành công', `Đơn #${order.Order_code} đã hoàn thành!`, 'success');
      },
      'Đồng ý',
      'Hủy',
      'success'
    );
  };

  const handleCancelSubmit = () => {
    if (!cancelModalOrder) return;
    const finalReason = customCancelReason.trim() ? customCancelReason.trim() : cancelReason;
    cancelOrder(cancelModalOrder.Order_id, finalReason);
    showAlert('Đã hủy', `Đã hủy đơn hàng #${cancelModalOrder.Order_code}!`, 'danger');
    setCancelModalOrder(null);
    setCustomCancelReason('');
  };

  const handleDeletePermanently = (order: Order) => {
    showConfirm(
      'Cảnh báo xóa đơn',
      `Bạn có chắc chắn muốn XÓA VĨNH VIỄN đơn hàng #${order.Order_code}? Thao tác này không thể hoàn tác!`,
      () => {
        cancelOrder(order.Order_id, 'Đã xóa bởi quản trị viên');
        showAlert('Đã xóa', `Đã xóa đơn hàng #${order.Order_code}!`, 'info');
      },
      'Xác nhận xóa',
      'Hủy',
      'danger'
    );
  };

  const handleOpenHistory = (order: Order) => {
    setHistoryModalOrder(order);
  };

  const handleOpenEdit = (order: Order) => {
    setEditOrderTarget(order);
    const initialNotes: Record<number, string> = {};
    order.items.forEach((it) => {
      initialNotes[it.Item_id] = it.Note || '';
    });
    setEditItemNotes(initialNotes);
  };

  const handleSaveEdit = () => {
    if (!editOrderTarget) return;
    const orderCode = editOrderTarget.Order_code;
    const newEntry: OrderHistoryEntry = {
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      user: currentUser.User_name || 'admin',
      oldContent: editOrderTarget.items.map((i) => `${i.Quantity}x ${i.Item_name}`).join(', '),
      newContent: `Đã chỉnh sửa ghi chú/món bởi ${currentUser.Full_name || currentUser.User_name}`,
    };

    setOrderHistories((prev) => ({
      ...prev,
      [orderCode]: [newEntry, ...(prev[orderCode] || [])],
    }));

    (editOrderTarget as any).Is_edited = 1;
    showAlert('Thành công', `Đã cập nhật đơn hàng #${orderCode}!`, 'success');
    setEditOrderTarget(null);
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản Lý Nhà Hàng';
      case 'CASHIER':
        return 'Thu Ngân';
      case 'WAITER':
        return 'Bồi Bàn';
      case 'KITCHEN':
        return 'Bếp';
      default:
        return role;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 1. Staff Banner & Scope Toggle (Matching Image 3) */}
      <View style={styles.bannerCard}>
        <View style={{ flex: 1 }}>
          <View style={styles.bannerTitleRow}>
            <FontAwesome5 name="clipboard-user" size={18} color="#15803d" />
            <Text style={styles.bannerTitle}>
              Đơn Hàng & Nhật Ký: <Text style={styles.bannerUsername}>{currentUser.Full_name || currentUser.User_name}</Text>{' '}
              <Text style={styles.bannerRoleBadge}>[{getRoleTitle(currentUser.Role)}]</Text>
            </Text>
          </View>
          <Text style={styles.bannerSub}>
            Theo dõi các đơn hàng đang xử lý, trạng thái thanh toán và hiệu suất làm việc
          </Text>
        </View>

        <View style={styles.bannerActionRow}>
          {/* Scope Toggle */}
          <View style={styles.scopeTogglePill}>
            <TouchableOpacity
              style={[styles.scopeBtn, scope === 'MY_ORDERS' && styles.scopeBtnActive]}
              onPress={() => setScope('MY_ORDERS')}>
              <FontAwesome5
                name="user"
                size={11}
                color={scope === 'MY_ORDERS' ? '#ffffff' : '#64748b'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.scopeText, scope === 'MY_ORDERS' && styles.scopeTextActive]}>
                Đơn Của Tôi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.scopeBtn,
                scope === 'ALL_ORDERS' && styles.scopeBtnActive,
                !canSeeAll && { opacity: 0.5 },
              ]}
              onPress={() => {
                if (canSeeAll) setScope('ALL_ORDERS');
                else showAlert('Thông báo', 'Tài khoản của bạn chưa được cấp quyền xem toàn bộ đơn của quán!');
              }}>
              <FontAwesome5
                name="store"
                size={11}
                color={scope === 'ALL_ORDERS' ? '#ffffff' : '#64748b'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.scopeText, scope === 'ALL_ORDERS' && styles.scopeTextActive]}>
                Toàn Bộ Quán
              </Text>
            </TouchableOpacity>
          </View>

          {/* Refresh Button */}
          <TouchableOpacity
            style={styles.btnRefresh}
            onPress={() => showAlert('Thông báo', 'Đã làm mới dữ liệu đơn hàng thành công!', 'info')}
            activeOpacity={0.8}>
            <FontAwesome5 name="rotate" size={11} color="#15803d" style={{ marginRight: 5 }} />
            <Text style={styles.btnRefreshText}>Làm mới</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. 4 KPI Overview Cards (Matching Image 3) */}
      <View style={styles.kpiRow}>
        {/* Đang Phục Vụ */}
        <View style={[styles.kpiCard, { borderLeftColor: '#f59e0b' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>ĐANG PHỤC VỤ / XỬ LÝ</Text>
            <Text style={[styles.kpiValue, { color: '#d97706' }]}>{kpiServingCount}</Text>
            <Text style={styles.kpiSub}>Trong đó: <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>{kpiUnpaidServing}</Text> chưa thu tiền</Text>
          </View>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#fef3c7' }]}>
            <FontAwesome5 name="fire" size={18} color="#d97706" />
          </View>
        </View>

        {/* Đơn Hoàn Thành */}
        <View style={[styles.kpiCard, { borderLeftColor: '#16a34a' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>ĐƠN HOÀN THÀNH</Text>
            <Text style={[styles.kpiValue, { color: '#16a34a' }]}>{kpiCompletedCount}</Text>
            <Text style={styles.kpiSub}>Đã giao & hoàn tất</Text>
          </View>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#dcfce7' }]}>
            <FontAwesome5 name="check-circle" size={18} color="#16a34a" />
          </View>
        </View>

        {/* Đơn Hủy */}
        <View style={[styles.kpiCard, { borderLeftColor: '#ef4444' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>ĐƠN BỊ HỦY</Text>
            <Text style={[styles.kpiValue, { color: '#ef4444' }]}>{kpiCanceledCount}</Text>
            <Text style={styles.kpiSub}>Hủy do khách/bếp</Text>
          </View>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#fee2e2' }]}>
            <FontAwesome5 name="ban" size={18} color="#ef4444" />
          </View>
        </View>

        {/* Tổng Doanh Thu */}
        <View style={[styles.kpiCard, { borderLeftColor: '#0284c7' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>TỔNG GIÁ TRỊ ĐÃ XỬ LÝ</Text>
            <Text style={[styles.kpiValue, { color: '#0284c7' }]}>{formatVND(kpiTotalRevenue)}</Text>
            <Text style={styles.kpiSub}>Tiền thu / Đơn hoàn tất</Text>
          </View>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#e0f2fe' }]}>
            <FontAwesome5 name="coins" size={18} color="#0284c7" />
          </View>
        </View>
      </View>

      {/* 3. Sub Tabs & Quick Filters */}
      <View style={styles.tabsHeaderCard}>
        <View style={styles.subTabsRow}>
          <TouchableOpacity
            style={[styles.subTabItem, activeTab === 'LIST' && styles.subTabItemActive]}
            onPress={() => setActiveTab('LIST')}>
            <FontAwesome5
              name="list-ul"
              size={12}
              color={activeTab === 'LIST' ? '#15803d' : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.subTabText, activeTab === 'LIST' && styles.subTabTextActive]}>
              Danh Sách Đơn Hàng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeTab === 'STATS' && styles.subTabItemActive]}
            onPress={() => setActiveTab('STATS')}>
            <FontAwesome5
              name="chart-line"
              size={12}
              color={activeTab === 'STATS' ? '#15803d' : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.subTabText, activeTab === 'STATS' && styles.subTabTextActive]}>
              Thống Kê Báo Cáo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeTab === 'STAFF_KPI' && styles.subTabItemActive]}
            onPress={() => setActiveTab('STAFF_KPI')}>
            <FontAwesome5
              name="user-check"
              size={12}
              color={activeTab === 'STAFF_KPI' ? '#15803d' : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.subTabText, activeTab === 'STAFF_KPI' && styles.subTabTextActive]}>
              Nhật Ký & KPI Toàn Quán
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.btnToggleChart}
          onPress={() => setShowCharts(!showCharts)}>
          <FontAwesome5 name="chart-pie" size={12} color="#0284c7" style={{ marginRight: 6 }} />
          <Text style={styles.btnToggleChartText}>
            {showCharts ? 'Đóng Biểu Đồ' : 'Xem Biểu Đồ Phân Tích'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Chart Collapsible Section */}
      {showCharts && (
        <View style={styles.chartBox}>
          <Text style={styles.chartTitle}>📊 Thống Kê Phân Bổ Đơn Hàng Trực Quan</Text>
          <View style={styles.chartGrid}>
            <View style={styles.chartCol}>
              <Text style={styles.chartColTitle}>Doanh Thu Đã Thu Được</Text>
              <Text style={styles.chartStatNum}>{formatVND(kpiTotalRevenue)}</Text>
              <Text style={styles.chartStatSub}>Tính trên các đơn COMPLETED / PAID</Text>
            </View>
            <View style={styles.chartCol}>
              <Text style={styles.chartColTitle}>Tỷ Lệ Bàn Chưa Thu Tiền</Text>
              <Text style={[styles.chartStatNum, { color: '#d97706' }]}>
                {kpiServingCount > 0 ? Math.round((kpiUnpaidServing / kpiServingCount) * 100) : 0}%
              </Text>
              <Text style={styles.chartStatSub}>{kpiUnpaidServing} / {kpiServingCount} bàn đang dùng</Text>
            </View>
            <View style={styles.chartCol}>
              <Text style={styles.chartColTitle}>Tỷ Lệ Hoàn Thành Đơn</Text>
              <Text style={[styles.chartStatNum, { color: '#16a34a' }]}>
                {orders.length > 0 ? Math.round((kpiCompletedCount / orders.length) * 100) : 0}%
              </Text>
              <Text style={styles.chartStatSub}>{kpiCompletedCount} / {orders.length} tổng đơn</Text>
            </View>
          </View>
        </View>
      )}

      {/* ==================================================== */}
      {/* TAB 1: DANH SÁCH ĐƠN HÀNG                            */}
      {/* ==================================================== */}
      {activeTab === 'LIST' && (
        <View>
          {/* Multi-Criteria Filters Card (Matching Image 3) */}
          <View style={styles.filtersCard}>
            <View style={styles.filterGridRow}>
              {/* Thời gian */}
              <View style={styles.filterCol}>
                <Text style={styles.filterColLabel}>
                  <FontAwesome5 name="calendar-alt" size={10} color="#64748b" /> Thời gian:
                </Text>
                <View style={styles.filterPillSelector}>
                  {[
                    { id: 'TODAY', label: 'Hôm nay' },
                    { id: 'WEEK', label: 'Tuần này' },
                    { id: 'MONTH', label: 'Tháng này' },
                    { id: 'ALL', label: 'Tất cả' },
                  ].map((tr) => (
                    <TouchableOpacity
                      key={tr.id}
                      style={[styles.filterMiniPill, timeRange === tr.id && styles.filterMiniPillActive]}
                      onPress={() => setTimeRange(tr.id)}>
                      <Text style={[styles.filterMiniPillText, timeRange === tr.id && styles.filterMiniPillTextActive]}>
                        {tr.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Trạng thái xử lý */}
              <View style={styles.filterCol}>
                <Text style={styles.filterColLabel}>
                  <FontAwesome5 name="filter" size={10} color="#64748b" /> Trạng thái xử lý:
                </Text>
                <View style={styles.filterPillSelector}>
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'SERVING', label: '🟡 Đang phục vụ' },
                    { id: 'UNPAID', label: '💳 Chờ thanh toán' },
                    { id: 'PAID_COMPLETED', label: '🟢 Đã xong' },
                    { id: 'CANCELED', label: '🔴 Đã hủy' },
                  ].map((st) => (
                    <TouchableOpacity
                      key={st.id}
                      style={[styles.filterMiniPill, statusFilter === st.id && styles.filterMiniPillActive]}
                      onPress={() => setStatusFilter(st.id)}>
                      <Text style={[styles.filterMiniPillText, statusFilter === st.id && styles.filterMiniPillTextActive]}>
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Hình thức */}
              <View style={styles.filterCol}>
                <Text style={styles.filterColLabel}>
                  <FontAwesome5 name="utensils" size={10} color="#64748b" /> Hình thức:
                </Text>
                <View style={styles.filterPillSelector}>
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'DINE_IN', label: 'Ăn tại quán' },
                    { id: 'TAKE_AWAY_SELF', label: 'Mang về / Giao' },
                  ].map((tf) => (
                    <TouchableOpacity
                      key={tf.id}
                      style={[styles.filterMiniPill, typeFilter === tf.id && styles.filterMiniPillActive]}
                      onPress={() => setTypeFilter(tf.id)}>
                      <Text style={[styles.filterMiniPillText, typeFilter === tf.id && styles.filterMiniPillTextActive]}>
                        {tf.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Search Input */}
            <View style={styles.searchBarRow}>
              <FontAwesome5 name="search" size={13} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm theo số đơn, số bàn, khách, nhân viên..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <FontAwesome5 name="times-circle" size={14} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.filterSummaryRow}>
              <Text style={styles.summaryText}>
                Đang hiển thị đơn {timeRange === 'TODAY' ? 'hôm nay' : timeRange} • ({filteredOrders.length} đơn)
              </Text>
              <Text style={styles.badgeTotalCount}>{filteredOrders.length} đơn</Text>
            </View>
          </View>

          {/* 10-COLUMN ORDERS TABLE (Matching Image 3 Verbatim) */}
          <View style={styles.tableCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={{ minWidth: 1080 }}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thText, { width: 100 }]}>Mã Đơn</Text>
                  <Text style={[styles.thText, { width: 110 }]}>Loại Đơn / Bàn</Text>
                  <Text style={[styles.thText, { width: 110 }]}>Khách Hàng</Text>
                  <Text style={[styles.thText, { width: 130 }]}>Nhân Viên Xử Lý</Text>
                  <Text style={[styles.thText, { width: 220 }]}>Món Đã Đặt</Text>
                  <Text style={[styles.thText, { width: 130, textAlign: 'center' }]}>Thanh Toán & Thu</Text>
                  <Text style={[styles.thText, { width: 120, textAlign: 'center' }]}>Trạng Thái</Text>
                  <Text style={[styles.thText, { width: 130 }]}>Ghi Chú & Lý Do</Text>
                  <Text style={[styles.thText, { width: 110, textAlign: 'right' }]}>Tổng Tiền</Text>
                  <Text style={[styles.thText, { width: 90, textAlign: 'center' }]}>Thời Gian</Text>
                  <Text style={[styles.thText, { width: 240, textAlign: 'center' }]}>Thao Tác</Text>
                </View>

                {/* Table Body */}
                {filteredOrders.length === 0 ? (
                  <View style={styles.emptyTableRow}>
                    <FontAwesome5 name="receipt" size={32} color="#cbd5e1" style={{ marginBottom: 8 }} />
                    <Text style={styles.emptyTableText}>Chưa có đơn hàng nào phù hợp với bộ lọc</Text>
                  </View>
                ) : (
                  filteredOrders.map((order) => {
                    const isCanceled = order.Status === 'CANCELLED';
                    const isEdited = (order as any).Is_edited || Boolean(orderHistories[order.Order_code]);
                    const isPaid = order.Payment_status === 'PAID';
                    const isReady = order.Status === 'READY';
                    const isCompleted = order.Status === 'COMPLETED';

                    let rowBg = '#ffffff';
                    if (isCanceled) rowBg = '#fee2e2'; // Light red for cancelled
                    else if (isEdited) rowBg = '#fef3c7'; // Light yellow for edited

                    return (
                      <View key={order.Order_id} style={[styles.tableBodyRow, { backgroundColor: rowBg }]}>
                        {/* 1. Mã Đơn */}
                        <View style={{ width: 100 }}>
                          <Text style={[styles.tdTextBold, isCanceled && { color: '#991b1b' }]}>
                            #{order.Order_code}
                          </Text>
                          {isEdited ? (
                            <View style={styles.badgeEdited}>
                              <Text style={styles.badgeEditedText}>ĐÃ SỬA</Text>
                            </View>
                          ) : null}
                        </View>

                        {/* 2. Loại Đơn / Bàn */}
                        <View style={{ width: 110 }}>
                          {order.Delivery_platform ? (
                            <View>
                              <View style={styles.badgePlatform}>
                                <Text style={styles.badgePlatformText}>🛵 {order.Delivery_platform}</Text>
                              </View>
                              <Text style={styles.tdSubText}>
                                {order.Payment_type === 'COD' ? '💵 COD' : '📱 CK QR'}
                              </Text>
                            </View>
                          ) : (
                            <View>
                              <Text style={styles.badgeDineIn}>🍽️ {order.Table_name || 'Bàn ' + (order.Table_number || '--')}</Text>
                              <Text style={styles.tdSubText}>Tại bàn</Text>
                            </View>
                          )}
                        </View>

                        {/* 3. Khách Hàng */}
                        <View style={{ width: 110 }}>
                          <Text style={[styles.tdText, isCanceled && { color: '#991b1b' }]}>
                            {order.Customer_name || 'Khách vãng lai'}
                          </Text>
                          {order.Customer_phone ? (
                            <Text style={styles.tdSubText}>📞 {order.Customer_phone}</Text>
                          ) : null}
                        </View>

                        {/* 4. Nhân Viên Xử Lý */}
                        <View style={{ width: 130 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <FontAwesome5 name="user-tie" size={11} color="#15803d" style={{ marginRight: 4 }} />
                            <Text style={styles.tdTextBold} numberOfLines={1}>
                              {order.Staff_name || 'Nhân viên'}
                            </Text>
                          </View>
                        </View>

                        {/* 5. Món Đã Đặt */}
                        <View style={{ width: 220 }}>
                          {order.items.slice(0, 3).map((it, idx) => (
                            <Text key={idx} style={styles.dishSummaryText} numberOfLines={1}>
                              • <Text style={{ fontWeight: '700' }}>{it.Item_name}</Text> x{it.Quantity}
                              {it.Note ? <Text style={styles.dishNoteText}> ({it.Note})</Text> : null}
                            </Text>
                          ))}
                          {order.items.length > 3 && (
                            <Text style={styles.moreItemsText}>+ {order.items.length - 3} món khác...</Text>
                          )}
                        </View>

                        {/* 6. Thanh Toán & Thu */}
                        <View style={{ width: 130, alignItems: 'center', justifyContent: 'center' }}>
                          {isCanceled ? (
                            <View style={styles.badgeCancelState}>
                              <Text style={styles.badgeCancelStateText}>HỦY</Text>
                            </View>
                          ) : isPaid ? (
                            <View style={styles.badgePaidSuccess}>
                              <FontAwesome5 name="check-circle" size={10} color="#15803d" style={{ marginRight: 3 }} />
                              <Text style={styles.badgePaidSuccessText}>ĐÃ THU</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.btnTableCollect}
                              onPress={() => setPaymentOrder(order)}
                              activeOpacity={0.8}>
                              <FontAwesome5 name="coins" size={10} color="#1e293b" style={{ marginRight: 4 }} />
                              <Text style={styles.btnTableCollectText}>Thu tiền bàn</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* 7. Trạng Thái */}
                        <View style={{ width: 120, alignItems: 'center', justifyContent: 'center' }}>
                          {isCanceled ? (
                            <View style={styles.statusPillRed}>
                              <Text style={styles.statusPillRedText}>HỦY</Text>
                            </View>
                          ) : isReady ? (
                            <View style={styles.statusPillReady}>
                              <Text style={styles.statusPillReadyText}>Bếp xong chờ giao</Text>
                            </View>
                          ) : isCompleted ? (
                            <View style={styles.statusPillCompleted}>
                              <Text style={styles.statusPillCompletedText}>ĐÃ GIAO XONG</Text>
                            </View>
                          ) : (
                            <View style={styles.statusPillCooking}>
                              <Text style={styles.statusPillCookingText}>ĐANG LÀM</Text>
                            </View>
                          )}
                        </View>

                        {/* 8. Ghi Chú & Lý Do */}
                        <View style={{ width: 130 }}>
                          <Text style={[styles.tdSubText, isCanceled && { color: '#dc2626', fontWeight: 'bold' }]} numberOfLines={2}>
                            {order.Note || 'Không có ghi chú'}
                          </Text>
                        </View>

                        {/* 9. Tổng Tiền */}
                        <View style={{ width: 110, alignItems: 'flex-end', justifyContent: 'center' }}>
                          <Text style={[styles.tdPriceText, isCanceled && styles.tdPriceCanceled]}>
                            {formatVND(order.Total_amount)}
                          </Text>
                        </View>

                        {/* 10. Thời Gian */}
                        <View style={{ width: 90, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={styles.tdSubText}>{order.Created_at || '--'}</Text>
                        </View>

                        {/* 11. Thao Tác Toolbar Buttons (Matching Image 3) */}
                        <View style={{ width: 240, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                          {/* [Bill] Button */}
                          {/* [Bill] Button */}
                          <TouchableOpacity
                            style={styles.btnActionBill}
                            onPress={() => setBillModalOrder(order)}>
                            <FontAwesome5 name="print" size={10} color="#ffffff" style={{ marginRight: 3 }} />
                            <Text style={styles.btnActionTextWhite}>Bill</Text>
                          </TouchableOpacity>

                          {/* [Thu tiền] Button (if unpaid and not canceled) */}
                          {!isPaid && !isCanceled && (
                            <TouchableOpacity
                              style={styles.btnActionPay}
                              onPress={() => setPaymentOrder(order)}>
                              <FontAwesome5 name="coins" size={10} color="#18181b" style={{ marginRight: 3 }} />
                              <Text style={styles.btnActionTextDark}>Thu tiền</Text>
                            </TouchableOpacity>
                          )}

                          {/* [Sửa] Button */}
                          {canEdit && !isCanceled && (
                            <TouchableOpacity
                              style={styles.btnActionEdit}
                              onPress={() => handleOpenEdit(order)}>
                              <FontAwesome5 name="pen" size={10} color="#ffffff" style={{ marginRight: 3 }} />
                              <Text style={styles.btnActionTextWhite}>Sửa</Text>
                            </TouchableOpacity>
                          )}

                          {/* [Sử] Button (Order history) */}
                          <TouchableOpacity
                            style={[styles.btnActionHistory, !isEdited && { opacity: 0.45 }]}
                            onPress={() => handleOpenHistory(order)}>
                            <FontAwesome5 name="history" size={10} color="#ffffff" style={{ marginRight: 3 }} />
                            <Text style={styles.btnActionTextWhite}>Sử</Text>
                          </TouchableOpacity>

                          {/* [Xong] Button */}
                          {!isCompleted && !isCanceled && (
                            <TouchableOpacity
                              style={styles.btnActionDone}
                              onPress={() => handleMarkCompleted(order)}>
                              <FontAwesome5 name="check" size={10} color="#ffffff" style={{ marginRight: 3 }} />
                              <Text style={styles.btnActionTextWhite}>Xong</Text>
                            </TouchableOpacity>
                          )}

                          {/* [Hủy] Button */}
                          {canCancel && !isCompleted && !isCanceled && (
                            <TouchableOpacity
                              style={styles.btnActionCancel}
                              onPress={() => setCancelModalOrder(order)}>
                              <FontAwesome5 name="ban" size={10} color="#ffffff" style={{ marginRight: 3 }} />
                              <Text style={styles.btnActionTextWhite}>Hủy</Text>
                            </TouchableOpacity>
                          )}

                          {/* [Xóa] Button */}
                          {canDelete && (
                            <TouchableOpacity
                              style={styles.btnActionDelete}
                              onPress={() => handleDeletePermanently(order)}>
                              <FontAwesome5 name="trash-alt" size={10} color="#ffffff" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>

            {/* Bottom Bar with "Đóng" button (Matching Image 3) */}
            <View style={styles.bottomBarRow}>
              <TouchableOpacity
                style={styles.btnBottomClose}
                onPress={() => router.push('/')}
                activeOpacity={0.85}>
                <Text style={styles.btnBottomCloseText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ==================================================== */}
      {/* TAB 2: THỐNG KÊ BÁO CÁO                               */}
      {/* ==================================================== */}
      {activeTab === 'STATS' && (
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>Biểu Đồ Thống Kê Doanh Thu & Cơ Cấu Đơn Hàng</Text>
          <View style={styles.kpiRow}>
            <View style={styles.statMetricBox}>
              <Text style={styles.statMetricTitle}>TỔNG ĐƠN HÔM NAY</Text>
              <Text style={[styles.statMetricNum, { color: '#15803d' }]}>{orders.length}</Text>
              <Text style={styles.statMetricSubtitle}>Bao gồm ăn tại chỗ & mang về</Text>
            </View>

            <View style={styles.statMetricBox}>
              <Text style={styles.statMetricTitle}>TỶ LỆ HOÀN THÀNH</Text>
              <Text style={[styles.statMetricNum, { color: '#16a34a' }]}>
                {orders.length > 0 ? Math.round((kpiCompletedCount / orders.length) * 100) : 0}%
              </Text>
              <Text style={styles.statMetricSubtitle}>Đơn đã phục vụ xong</Text>
            </View>

            <View style={styles.statMetricBox}>
              <Text style={styles.statMetricTitle}>GIÁ TRỊ TRUNG BÌNH / ĐƠN</Text>
              <Text style={[styles.statMetricNum, { color: '#d97706' }]}>
                {formatVND(orders.length > 0 ? Math.round(kpiTotalRevenue / (orders.length || 1)) : 0)}
              </Text>
              <Text style={styles.statMetricSubtitle}>AOV toàn hệ thống</Text>
            </View>
          </View>
        </View>
      )}

      {/* ==================================================== */}
      {/* TAB 3: NHẬT KÝ & KPI TOÀN QUÁN                       */}
      {/* ==================================================== */}
      {activeTab === 'STAFF_KPI' && (
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>Hiệu Suất Phục Vụ & KPI Nhân Viên</Text>
          <View style={styles.kpiRow}>
            {['Vũ (Quản Lý)', 'Thu Ngân Quầy', 'Bồi Bàn', 'Bếp Hoa Sen'].map((stName, idx) => (
              <View key={idx} style={styles.statMetricBox}>
                <Text style={styles.statMetricTitle}>{stName}</Text>
                <Text style={[styles.statMetricNum, { color: '#0284c7' }]}>
                  {orders.filter((o) => o.Staff_name?.includes(stName)).length} đơn
                </Text>
                <Text style={styles.statMetricSubtitle}>Đã tiếp nhận & xử lý</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ==================================================== */}
      {/* MODAL: LỊCH SỬ CHỈNH SỬA ĐƠN HÀNG (Nút "Sử")        */}
      {/* ==================================================== */}
      <Modal
        visible={Boolean(historyModalOrder)}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryModalOrder(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialogLg}>
            <View style={styles.modalHeaderBlue}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome5 name="history" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.modalHeaderTitleWhite}>
                  Lịch Sử Chỉnh Sửa Đơn Hàng: #{historyModalOrder?.Order_code}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryModalOrder(null)}>
                <FontAwesome5 name="times" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <View style={styles.historyTableHeader}>
                <Text style={[styles.thText, { width: 120 }]}>Thời Gian</Text>
                <Text style={[styles.thText, { width: 100 }]}>Người Sửa</Text>
                <Text style={[styles.thText, { flex: 1 }]}>Nội Dung Cũ</Text>
                <Text style={[styles.thText, { flex: 1 }]}>Nội Dung Mới</Text>
              </View>

              {historyModalOrder && orderHistories[historyModalOrder.Order_code]?.length ? (
                orderHistories[historyModalOrder.Order_code].map((entry, idx) => (
                  <View key={idx} style={styles.historyTableRow}>
                    <Text style={[styles.tdSubText, { width: 120 }]}>{entry.time}</Text>
                    <Text style={[styles.tdTextBold, { width: 100 }]}>{entry.user}</Text>
                    <Text style={[styles.tdText, { flex: 1 }]}>{entry.oldContent}</Text>
                    <Text style={[styles.tdText, { flex: 1, color: '#15803d', fontWeight: 'bold' }]}>
                      {entry.newContent}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Text style={styles.emptyTableText}>Đơn hàng này chưa có lần chỉnh sửa nào được ghi nhận.</Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooterGray}>
              <TouchableOpacity
                style={styles.btnModalClose}
                onPress={() => setHistoryModalOrder(null)}>
                <Text style={styles.btnModalCloseText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL: SỬA ĐƠN HÀNG (Nút "Sửa")                     */}
      {/* ==================================================== */}
      <Modal
        visible={Boolean(editOrderTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditOrderTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialogMd}>
            <View style={styles.modalHeaderGreen}>
              <Text style={styles.modalHeaderTitleWhite}>
                Sửa Món & Ghi Chú Đơn #{editOrderTarget?.Order_code}
              </Text>
              <TouchableOpacity onPress={() => setEditOrderTarget(null)}>
                <FontAwesome5 name="times" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16, maxHeight: 380 }}>
              {editOrderTarget?.items.map((it) => (
                <View key={it.Item_id} style={styles.editItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tdTextBold}>{it.Item_name}</Text>
                    <Text style={styles.tdSubText}>SL: {it.Quantity} • {formatVND(it.Price)}</Text>
                  </View>
                  <TextInput
                    style={styles.editItemInput}
                    placeholder="Ghi chú món này..."
                    value={editItemNotes[it.Item_id] || ''}
                    onChangeText={(t) =>
                      setEditItemNotes((prev) => ({ ...prev, [it.Item_id]: t }))
                    }
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooterGray}>
              <TouchableOpacity
                style={styles.btnModalClose}
                onPress={() => setEditOrderTarget(null)}>
                <Text style={styles.btnModalCloseText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnModalSave}
                onPress={handleSaveEdit}>
                <Text style={styles.btnModalSaveText}>Lưu Thay Đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL: HÓA ĐƠN IN NHIỆT (Nút "Bill")                */}
      {/* ==================================================== */}
      <Modal
        visible={Boolean(billModalOrder)}
        transparent
        animationType="fade"
        onRequestClose={() => setBillModalOrder(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.billSlipDialog}>
            <View style={styles.billSlipContent}>
              <Text style={styles.billSlipResName}>{systemSettings.resName || 'NHÀ HÀNG CHAY HOA SEN'}</Text>
              <Text style={styles.billSlipSub}>{systemSettings.resAddr || '123 Đường Hoa Sen, TP.HCM'}</Text>
              <Text style={styles.billSlipSub}>ĐT: {systemSettings.resPhone || '0901 234 567'}</Text>
              <Text style={styles.billSlipSub}>{systemSettings.resWifi || 'Wifi: ChayHoaSen'}</Text>

              <View style={styles.billDashedLine} />
              <Text style={styles.billSlipTitle}>PHIẾU THANH TOÁN</Text>
              <View style={styles.billDashedLine} />

              <View style={styles.billRowBetween}>
                <Text style={styles.billMonoSmall}>HĐ: #{billModalOrder?.Order_code}</Text>
                <Text style={styles.billMonoSmall}>Bàn: {billModalOrder?.Table_name || 'Bàn ' + (billModalOrder?.Table_number || '--')}</Text>
              </View>
              <View style={styles.billRowBetween}>
                <Text style={styles.billMonoSmall}>Ngày: {billModalOrder?.Created_at}</Text>
                <Text style={styles.billMonoSmall}>Thu ngân: {billModalOrder?.Staff_name || 'Vũ'}</Text>
              </View>

              <View style={styles.billDashedLine} />

              {/* Items List */}
              {billModalOrder?.items.map((it, idx) => (
                <View key={idx} style={styles.billRowBetween}>
                  <Text style={[styles.billMonoSmall, { flex: 1 }]}>
                    {it.Item_name} x{it.Quantity}
                  </Text>
                  <Text style={styles.billMonoSmall}>{formatVND(it.Price * it.Quantity)}</Text>
                </View>
              ))}

              <View style={styles.billDashedLine} />

              <View style={styles.billRowBetween}>
                <Text style={styles.billTotalLabel}>TỔNG CỘNG:</Text>
                <Text style={styles.billTotalVal}>{formatVND(billModalOrder?.Total_amount || 0)}</Text>
              </View>

              <Text style={styles.billFooterText}>{systemSettings.billFooter || 'Kính chúc Quý Khách An Lạc & An Nhiên!\nXin cảm ơn & Hẹn gặp lại Quý Khách!'}</Text>
            </View>

            <View style={styles.billModalActions}>
              <TouchableOpacity
                style={styles.btnPrintExecute}
                onPress={() => {
                  showAlert('In Bill', `Đã gửi lệnh in Bill đơn #${billModalOrder?.Order_code} đến máy in ${systemSettings.printer}!`, 'success');
                  setBillModalOrder(null);
                }}>
                <FontAwesome5 name="print" size={13} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.btnPrintExecuteText}>In Hóa Đơn</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnPrintClose}
                onPress={() => setBillModalOrder(null)}>
                <Text style={styles.btnPrintCloseText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL: HỦY ĐƠN HÀNG (Nút "Hủy")                     */}
      {/* ==================================================== */}
      <Modal
        visible={Boolean(cancelModalOrder)}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalOrder(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialogSm}>
            <View style={styles.modalHeaderRed}>
              <Text style={styles.modalHeaderTitleWhite}>Xác Nhận Hủy Đơn Hàng</Text>
              <TouchableOpacity onPress={() => setCancelModalOrder(null)}>
                <FontAwesome5 name="times" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 18 }}>
              <Text style={styles.cancelNoticeText}>
                Bạn có chắc chắn muốn hủy đơn hàng <Text style={{ fontWeight: '800' }}>#{cancelModalOrder?.Order_code}</Text>?
              </Text>

              <Text style={styles.formFieldLabel}>Chọn lý do hủy:</Text>
              {[
                'Khách đổi ý không dùng nữa',
                'Bếp hết nguyên liệu món',
                'Khách nhập sai bàn / trùng đơn',
                'Khác',
              ].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonOptionRow, cancelReason === r && styles.reasonOptionRowActive]}
                  onPress={() => setCancelReason(r)}>
                  <Text style={[styles.reasonOptionText, cancelReason === r && styles.reasonOptionTextActive]}>
                    {r}
                  </Text>
                  {cancelReason === r && <FontAwesome5 name="check" size={12} color="#dc2626" />}
                </TouchableOpacity>
              ))}

              {cancelReason === 'Khác' && (
                <TextInput
                  style={styles.cancelCustomInput}
                  placeholder="Nhập lý do hủy chi tiết..."
                  value={customCancelReason}
                  onChangeText={setCustomCancelReason}
                />
              )}
            </View>

            <View style={styles.modalFooterGray}>
              <TouchableOpacity
                style={styles.btnModalClose}
                onPress={() => setCancelModalOrder(null)}>
                <Text style={styles.btnModalCloseText}>Quay lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnModalCancelConfirm}
                onPress={handleCancelSubmit}>
                <Text style={styles.btnModalCancelConfirmText}>Xác Nhận Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      {paymentOrder && (
        <PaymentModal
          visible={Boolean(paymentOrder)}
          onClose={() => setPaymentOrder(null)}
          order={paymentOrder}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // 1. Staff Banner (Image 3)
  bannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#15803d',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
    }),
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803d',
    marginLeft: 8,
  },
  bannerUsername: {
    color: '#0f172a',
    fontWeight: '800',
  },
  bannerRoleBadge: {
    color: '#15803d',
    fontSize: 13,
  },
  bannerSub: {
    fontSize: 12,
    color: '#64748b',
  },
  bannerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scopeTogglePill: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scopeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  scopeBtnActive: {
    backgroundColor: '#15803d',
  },
  scopeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  scopeTextActive: {
    color: '#ffffff',
  },
  btnRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#15803d',
    backgroundColor: '#ffffff',
  },
  btnRefreshText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },

  // 2. KPI Cards (Image 3)
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
      },
    }),
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748b',
  },
  kpiIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  // 3. Sub Tabs Row
  tabsHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  subTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subTabItemActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#15803d',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  subTabTextActive: {
    color: '#15803d',
  },
  btnToggleChart: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0284c7',
    backgroundColor: '#ffffff',
  },
  btnToggleChartText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },

  // Chart Box
  chartBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  chartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chartCol: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chartColTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  chartStatNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0284c7',
  },
  chartStatSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },

  // Filters Card
  filtersCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  filterCol: {
    flex: 1,
    minWidth: 200,
  },
  filterColLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  filterPillSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  filterMiniPill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  filterMiniPillActive: {
    backgroundColor: '#15803d',
  },
  filterMiniPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterMiniPillTextActive: {
    color: '#ffffff',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginVertical: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0f172a',
  },
  filterSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#64748b',
  },
  badgeTotalCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },

  // 10-Column Table (Image 3)
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
  },
  thText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tdText: {
    fontSize: 12,
    color: '#1e293b',
  },
  tdTextBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  tdSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  dishSummaryText: {
    fontSize: 11,
    color: '#1e293b',
    lineHeight: 16,
  },
  dishNoteText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  moreItemsText: {
    fontSize: 10,
    color: '#0284c7',
    fontWeight: '700',
  },
  tdPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
  },
  tdPriceCanceled: {
    textDecorationLine: 'line-through',
    color: '#dc2626',
  },

  // Badges in Table
  badgeEdited: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  badgeEditedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#18181b',
  },
  badgePlatform: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgePlatformText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  badgeDineIn: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgeCancelState: {
    backgroundColor: '#64748b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCancelStateText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  badgePaidSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  badgePaidSuccessText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  btnTableCollect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fde047',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eab308',
  },
  btnTableCollectText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#18181b',
  },

  // Status Pills
  statusPillRed: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  statusPillRedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  statusPillReady: {
    backgroundColor: '#10b981',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillReadyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  statusPillCompleted: {
    backgroundColor: '#15803d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillCompletedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  statusPillCooking: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillCookingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Toolbar Action Buttons (Matching Image 3)
  btnActionBill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  btnActionPay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  btnActionEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  btnActionHistory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  btnActionDone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  btnActionCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  btnActionDelete: {
    backgroundColor: '#dc2626',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  btnActionTextWhite: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  btnActionTextDark: {
    fontSize: 11,
    fontWeight: '800',
    color: '#18181b',
  },

  // Bottom Bar (Image 3)
  bottomBarRow: {
    backgroundColor: '#1e293b',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBottomClose: {
    backgroundColor: '#334155',
    paddingVertical: 7,
    paddingHorizontal: 32,
    borderRadius: 6,
  },
  btnBottomCloseText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  emptyTableRow: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 13,
    color: '#94a3b8',
  },

  // Stats Card
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statsCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  statMetricBox: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statMetricTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 4,
  },
  statMetricNum: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  statMetricSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },

  // Modal Backdrop
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDialogLg: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalDialogMd: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalDialogSm: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeaderBlue: {
    backgroundColor: '#0284c7',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderGreen: {
    backgroundColor: '#15803d',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderRed: {
    backgroundColor: '#dc2626',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleWhite: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalFooterGray: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  btnModalClose: {
    backgroundColor: '#64748b',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  btnModalCloseText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  btnModalSave: {
    backgroundColor: '#15803d',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  btnModalSaveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  btnModalCancelConfirm: {
    backgroundColor: '#dc2626',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  btnModalCancelConfirmText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // History Table
  historyTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  historyTableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },

  // Edit Modal
  editItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  editItemInput: {
    width: 160,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 12,
  },

  // Bill Thermal Slip Modal
  billSlipDialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  billSlipContent: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  billSlipResName: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
  billSlipSub: {
    fontSize: 10,
    textAlign: 'center',
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  billDashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderStyle: 'dashed',
    marginVertical: 6,
  },
  billSlipTitle: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  billRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 1,
  },
  billMonoSmall: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  billTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  billTotalVal: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  billFooterText: {
    fontSize: 9.5,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  billModalActions: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  btnPrintExecute: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    paddingVertical: 8,
    borderRadius: 6,
  },
  btnPrintExecuteText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  btnPrintClose: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#64748b',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrintCloseText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Cancel Modal
  cancelNoticeText: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 12,
  },
  formFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  reasonOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 6,
  },
  reasonOptionRowActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  reasonOptionText: {
    fontSize: 12,
    color: '#334155',
  },
  reasonOptionTextActive: {
    color: '#dc2626',
    fontWeight: '700',
  },
  cancelCustomInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    marginTop: 4,
  },
});
