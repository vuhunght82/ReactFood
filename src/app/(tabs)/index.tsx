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
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DiningTable } from '@/types';
import { LotusTheme, formatVND } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { TableDiagram } from '@/components/TableDiagram';
import { TableDetailModal } from '@/components/TableDetailModal';
import { PaymentModal } from '@/components/PaymentModal';

export default function TablesScreen() {
  const router = useRouter();
  const {
    tables,
    orders,
    addTable,
    updateTable,
    deleteTable,
    updateTableGuests,
    transferTable,
    selectTable,
  } = useApp();

  // State
  const [layoutMode, setLayoutMode] = useState<'HORIZONTAL' | 'VERTICAL'>('HORIZONTAL');
  const [activeSubTab, setActiveSubTab] = useState<'MAP' | 'STATS' | 'MANAGE'>('MAP');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [guestTimeFilter, setGuestTimeFilter] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');

  // Modals state
  const [activeDetailTable, setActiveDetailTable] = useState<DiningTable | null>(null);
  const [paymentTable, setPaymentTable] = useState<DiningTable | null>(null);

  // Transfer Table Modal state
  const [transferSourceTable, setTransferSourceTable] = useState<DiningTable | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<number | null>(null);

  // Open Table Modal state
  const [openModalTable, setOpenModalTable] = useState<DiningTable | null>(null);
  const [openGuestsCount, setOpenGuestsCount] = useState<number>(2);

  // Add / Edit Table Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<DiningTable | null>(null);
  const [tableFormCode, setTableFormCode] = useState<string>('');
  const [tableFormName, setTableFormName] = useState<string>('');
  const [tableFormArea, setTableFormArea] = useState<string>('Tầng 1');
  const [tableFormCapacity, setTableFormCapacity] = useState<string>('4');
  const [tableFormSortOrder, setTableFormSortOrder] = useState<string>('1');

  // Unique areas
  const areas = ['ALL', 'Tầng 1', 'Tầng 2', 'Sân Vườn', 'Phòng VIP'];

  // Filtered tables by area
  const filteredTables = useMemo(() => {
    if (selectedArea === 'ALL') return tables;
    return tables.filter((t) => t.Area === selectedArea);
  }, [tables, selectedArea]);

  // 4 KPI Metrics
  const totalCapacity = useMemo(() => tables.reduce((s, t) => s + (t.Capacity || 0), 0), [tables]);
  const emptyCount = useMemo(
    () => tables.filter((t) => t.Status === 'EMPTY' && (t.Current_amount || 0) === 0).length,
    [tables]
  );
  const occupiedCount = tables.length - emptyCount;
  const currentGuests = useMemo(
    () => tables.reduce((s, t) => s + (t.Current_guests || (t.Status === 'SERVING' ? 1 : 0)), 0),
    [tables]
  );
  const occupancyRate = totalCapacity > 0 ? Math.round((currentGuests / totalCapacity) * 100) : 0;

  // Open Add Table Modal
  const handleOpenAddModal = () => {
    setEditingTable(null);
    setTableFormCode(`B${String(tables.length + 1).padStart(2, '0')}`);
    setTableFormName(`Bàn ${String(tables.length + 1).padStart(2, '0')}`);
    setTableFormArea('Tầng 1');
    setTableFormCapacity('4');
    setTableFormSortOrder(String(tables.length + 1));
    setIsEditModalOpen(true);
  };

  // Open Edit Table Modal
  const handleOpenEditModal = (t: DiningTable) => {
    setEditingTable(t);
    setTableFormCode(t.Table_code);
    setTableFormName(t.Table_name);
    setTableFormArea(t.Area);
    setTableFormCapacity(String(t.Capacity));
    setTableFormSortOrder(String(t.Sort_order || 1));
    setIsEditModalOpen(true);
  };

  // Save Table
  const handleSaveTable = () => {
    if (!tableFormCode.trim() || !tableFormName.trim()) {
      alertMsg('Vui lòng nhập đầy đủ mã bàn và tên bàn!');
      return;
    }
    const cap = parseInt(tableFormCapacity, 10) || 4;
    const sort = parseInt(tableFormSortOrder, 10) || 1;

    if (editingTable) {
      updateTable({
        ...editingTable,
        Table_code: tableFormCode.trim(),
        Table_name: tableFormName.trim(),
        Area: tableFormArea,
        Capacity: cap,
        Sort_order: sort,
      });
      alertMsg('Đã cập nhật thông tin bàn thành công!');
    } else {
      addTable({
        Table_code: tableFormCode.trim(),
        Table_name: tableFormName.trim(),
        Area: tableFormArea,
        Capacity: cap,
        Sort_order: sort,
        Status: 'EMPTY',
        Current_guests: 0,
        Current_amount: 0,
        Payment_status: 'UNPAID',
      });
      alertMsg('Đã thêm bàn mới thành công!');
    }
    setIsEditModalOpen(false);
  };

  // Delete Table
  const handleDeleteTable = (t: DiningTable) => {
    const confirmDelete = () => {
      deleteTable(t.Table_id);
      alertMsg(`Đã xóa bàn ${t.Table_name}!`);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc chắn muốn xóa "${t.Table_name}" không?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa bàn ${t.Table_name}?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  // Open Table & Start Ordering
  const handleOpenTableClick = (t: DiningTable) => {
    setOpenModalTable(t);
    setOpenGuestsCount(t.Capacity >= 2 ? 2 : 1);
  };

  const handleConfirmOpenTable = () => {
    if (!openModalTable) return;
    updateTableGuests(openModalTable.Table_id, openGuestsCount);
    selectTable(openModalTable);
    setOpenModalTable(null);
    router.push('/(tabs)/menu-cards' as any);
  };

  // Direct transfer modal
  const handleOpenTransfer = (t: DiningTable) => {
    setTransferSourceTable(t);
    const available = tables.find((x) => x.Table_id !== t.Table_id && x.Status === 'EMPTY');
    setTransferTargetId(available ? available.Table_id : null);
  };

  const handleConfirmTransfer = () => {
    if (!transferSourceTable || !transferTargetId) {
      alertMsg('Vui lòng chọn bàn trống cần chuyển đến!');
      return;
    }
    transferTable(transferSourceTable.Table_id, transferTargetId);
    alertMsg('Đã chuyển đơn hàng sang bàn mới thành công!');
    setTransferSourceTable(null);
  };

  const alertMsg = (msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Thông báo', msg);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 1. Header & Controls */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleBadgeRow}>
            <FontAwesome5 name="th-large" size={18} color={LotusTheme.primary} />
            <Text style={styles.headerTitle}>Sơ Đồ Phòng Bàn Thời Gian Thực</Text>
          </View>
          <Text style={styles.headerSub}>Theo dõi vị trí, số ghế, trạng thái phục vụ và quản lý lượng khách</Text>
        </View>

        <View style={styles.headerActionGroup}>
          {/* Horizontal vs Vertical Toggle */}
          <View style={styles.layoutTogglePill}>
            <TouchableOpacity
              style={[styles.toggleBtn, layoutMode === 'HORIZONTAL' && styles.toggleBtnActive]}
              onPress={() => setLayoutMode('HORIZONTAL')}>
              <FontAwesome5
                name="th-large"
                size={12}
                color={layoutMode === 'HORIZONTAL' ? '#ffffff' : '#64748b'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.toggleText, layoutMode === 'HORIZONTAL' && styles.toggleTextActive]}>
                Sơ Đồ Ngang
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, layoutMode === 'VERTICAL' && styles.toggleBtnActive]}
              onPress={() => setLayoutMode('VERTICAL')}>
              <FontAwesome5
                name="list"
                size={12}
                color={layoutMode === 'VERTICAL' ? '#ffffff' : '#64748b'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.toggleText, layoutMode === 'VERTICAL' && styles.toggleTextActive]}>
                Sơ Đồ Dọc
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add Table Button */}
          <TouchableOpacity style={styles.addTableBtn} onPress={handleOpenAddModal} activeOpacity={0.8}>
            <FontAwesome5 name="plus" size={12} color="#ffffff" style={{ marginRight: 5 }} />
            <Text style={styles.addTableBtnText}>Thêm Bàn</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. 4 KPI Cards */}
      <View style={styles.kpiGrid}>
        {/* Bàn Trống */}
        <View style={[styles.kpiCard, styles.kpiBorderSuccess]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>BÀN TRỐNG SẴN SÀNG</Text>
            <Text style={[styles.kpiValue, { color: LotusTheme.success }]}>{emptyCount}</Text>
            <Text style={styles.kpiSub}>Đón khách mới</Text>
          </View>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#dcfce7' }]}>
            <FontAwesome5 name="check-circle" size={20} color={LotusTheme.success} />
          </View>
        </View>

        {/* Bàn Đang Phục Vụ */}
        <View style={[styles.kpiCard, styles.kpiBorderWarning]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>BÀN ĐANG PHỤC VỤ</Text>
            <Text style={[styles.kpiValue, { color: '#d97706' }]}>{occupiedCount}</Text>
            <Text style={styles.kpiSub}>Có khách ngồi dùng bữa</Text>
          </View>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#fef3c7' }]}>
            <FontAwesome5 name="utensils" size={18} color="#d97706" />
          </View>
        </View>

        {/* Khách Đang Có Mặt */}
        <View style={[styles.kpiCard, styles.kpiBorderPrimary]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>KHÁCH ĐANG CÓ MẶT</Text>
            <Text style={[styles.kpiValue, { color: '#0284c7' }]}>{currentGuests}</Text>
            <Text style={styles.kpiSub}>Tổng số khách hiện tại</Text>
          </View>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#e0f2fe' }]}>
            <FontAwesome5 name="users" size={18} color="#0284c7" />
          </View>
        </View>

        {/* Tỷ Lệ Lấp Đầy Ghế */}
        <View style={[styles.kpiCard, styles.kpiBorderInfo]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>TỶ LỆ LẤP ĐẦY GHẾ</Text>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{occupancyRate}%</Text>
            <Text style={styles.kpiSub}>Trên tổng số {totalCapacity} ghế</Text>
          </View>
          <View style={[styles.kpiIconCircle, { backgroundColor: '#ccfbf1' }]}>
            <FontAwesome5 name="chair" size={18} color="#059669" />
          </View>
        </View>
      </View>

      {/* 3. Sub Tabs Navigation & Area Filters */}
      <View style={styles.subTabsContainer}>
        <View style={styles.subTabsRow}>
          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'MAP' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('MAP')}>
            <FontAwesome5
              name="th-large"
              size={13}
              color={activeSubTab === 'MAP' ? LotusTheme.primary : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.subTabText, activeSubTab === 'MAP' && styles.subTabTextActive]}>
              Sơ Đồ Bàn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'STATS' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('STATS')}>
            <FontAwesome5
              name="chart-line"
              size={13}
              color={activeSubTab === 'STATS' ? LotusTheme.primary : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.subTabText, activeSubTab === 'STATS' && styles.subTabTextActive]}>
              Thống Kê Lượng Khách
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'MANAGE' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('MANAGE')}>
            <FontAwesome5
              name="cogs"
              size={13}
              color={activeSubTab === 'MANAGE' ? LotusTheme.primary : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.subTabText, activeSubTab === 'MANAGE' && styles.subTabTextActive]}>
              Quản Lý Danh Sách Bàn
            </Text>
          </TouchableOpacity>
        </View>

        {/* Area Filters (Only shown when on MAP sub-tab) */}
        {activeSubTab === 'MAP' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.areaFiltersRow}>
            <Text style={styles.areaFilterLabel}>Khu vực:</Text>
            {areas.map((area) => {
              const isActive = selectedArea === area;
              return (
                <TouchableOpacity
                  key={area}
                  style={[styles.areaFilterPill, isActive && styles.areaFilterPillActive]}
                  onPress={() => setSelectedArea(area)}>
                  <Text style={[styles.areaFilterPillText, isActive && styles.areaFilterPillTextActive]}>
                    {area === 'ALL' ? 'Tất Cả' : area}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ==================================================== */}
      {/* SUB-TAB 1: SƠ ĐỒ BÀN (MAP) */}
      {/* ==================================================== */}
      {activeSubTab === 'MAP' && (
        <View style={layoutMode === 'HORIZONTAL' ? styles.horizontalGrid : styles.verticalList}>
          {filteredTables.map((table) => {
            const isOccupied = table.Status === 'SERVING' || (table.Current_amount || 0) > 0;
            const guests = table.Current_guests || (isOccupied ? 1 : 0);
            const isPaid = table.Payment_status === 'PAID';

            return (
              <View
                key={table.Table_id}
                style={[
                  styles.tableCardBox,
                  layoutMode === 'VERTICAL' && styles.tableCardBoxVertical,
                  isOccupied ? styles.cardBorderOccupied : styles.cardBorderEmpty,
                ]}>
                {/* Header */}
                <View style={[styles.cardHeader, isOccupied ? styles.cardHeaderOccupied : styles.cardHeaderEmpty]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTableName}>{table.Table_name}</Text>
                    <Text style={styles.cardAreaSubtitle}>{table.Area} • {table.Capacity} ghế</Text>
                  </View>

                  <View style={styles.headerBadgesRow}>
                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: isOccupied ? '#fee2e2' : '#dcfce7' },
                      ]}>
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: isOccupied ? '#b91c1c' : '#15803d' },
                        ]}>
                        {isOccupied ? 'Đang Phục Vụ' : 'Trống'}
                      </Text>
                    </View>

                    {isOccupied && (
                      <View
                        style={[
                          styles.statusChip,
                          { backgroundColor: isPaid ? '#dcfce7' : '#fee2e2' },
                        ]}>
                        <Text
                          style={[
                            styles.statusChipText,
                            { color: isPaid ? '#15803d' : '#b91c1c' },
                          ]}>
                          {isPaid ? 'ĐÃ THU' : 'CHƯA THU'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Body with Diagram */}
                <View style={styles.cardBody}>
                  <TableDiagram
                    capacity={table.Capacity}
                    currentGuests={guests}
                    isOccupied={isOccupied}
                    tableName={table.Table_name}
                    isMini={layoutMode === 'VERTICAL'}
                    onChairPress={(seatNum) => {
                      if (isOccupied) updateTableGuests(table.Table_id, seatNum);
                    }}
                  />

                  {/* Stepper for Guests */}
                  <View style={styles.guestStepperRow}>
                    <Text style={styles.guestStepperLabel}>Khách ngồi:</Text>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateTableGuests(table.Table_id, Math.max(0, guests - 1))}>
                        <FontAwesome5 name="minus" size={10} color="#64748b" />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{guests} người</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateTableGuests(table.Table_id, guests + 1)}>
                        <FontAwesome5 name="plus" size={10} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Amount / Order details if occupied */}
                  {isOccupied && (
                    <View style={styles.occupiedInfoBox}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderCodeText}>
                          {table.Current_order_code || (table.Current_order_id ? `#CHAY-${table.Current_order_id}` : 'Đơn hiện tại')}
                        </Text>
                        <Text style={styles.amountText}>{formatVND(table.Current_amount || 0)}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.cardActionsRow}>
                  {isOccupied ? (
                    <>
                      <TouchableOpacity
                        style={styles.btnActionDetail}
                        onPress={() => setActiveDetailTable(table)}>
                        <FontAwesome5 name="file-invoice-dollar" size={11} color="#0284c7" style={{ marginRight: 4 }} />
                        <Text style={styles.btnActionDetailText}>Chi Tiết / Tạm Tính</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.btnActionTransfer}
                        onPress={() => handleOpenTransfer(table)}>
                        <FontAwesome5 name="exchange-alt" size={11} color="#d97706" style={{ marginRight: 4 }} />
                        <Text style={styles.btnActionTransferText}>Đổi Bàn</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.btnActionPay}
                        onPress={() => setPaymentTable(table)}>
                        <FontAwesome5 name="credit-card" size={11} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.btnActionPayText}>Thu Tiền</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.btnActionOpen}
                        onPress={() => handleOpenTableClick(table)}>
                        <FontAwesome5 name="user-plus" size={12} color="#ffffff" style={{ marginRight: 5 }} />
                        <Text style={styles.btnActionOpenText}>Mở Bàn Đón Khách</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.btnActionMenu}
                        onPress={() => {
                          selectTable(table);
                          router.push('/(tabs)/menu-cards' as any);
                        }}>
                        <FontAwesome5 name="utensils" size={12} color="#15803d" style={{ marginRight: 5 }} />
                        <Text style={styles.btnActionMenuText}>Đặt Món</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ==================================================== */}
      {/* SUB-TAB 2: THỐNG KÊ LƯỢNG KHÁCH (STATS)             */}
      {/* ==================================================== */}
      {activeSubTab === 'STATS' && (
        <View style={styles.statsCard}>
          <View style={styles.statsHeaderRow}>
            <View>
              <Text style={styles.statsTitle}>Báo Cáo Phân Tích Lượng Khách & Giờ Cao Điểm</Text>
              <Text style={styles.statsSub}>Dữ liệu thống kê lượt khách ra vào nhà hàng và hành vi tiêu dùng</Text>
            </View>

            <View style={styles.timePillGroup}>
              {(['TODAY', 'WEEK', 'MONTH'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.timePillBtn, guestTimeFilter === mode && styles.timePillBtnActive]}
                  onPress={() => setGuestTimeFilter(mode)}>
                  <Text style={[styles.timePillText, guestTimeFilter === mode && styles.timePillTextActive]}>
                    {mode === 'TODAY' ? 'Hôm nay' : mode === 'WEEK' ? '7 ngày qua' : 'Tháng này'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 4 Stats Cards */}
          <View style={styles.kpiGrid}>
            <View style={styles.statMetricCard}>
              <Text style={styles.statMetricLabel}>TỔNG LƯỢT KHÁCH</Text>
              <Text style={[styles.statMetricVal, { color: '#0284c7' }]}>
                {guestTimeFilter === 'TODAY' ? 42 : guestTimeFilter === 'WEEK' ? 318 : 1240}
              </Text>
              <Text style={styles.statMetricSub}>Số khách đã đến quán</Text>
            </View>

            <View style={styles.statMetricCard}>
              <Text style={styles.statMetricLabel}>KHUNG GIỜ CAO ĐIỂM</Text>
              <Text style={[styles.statMetricVal, { color: '#d97706' }]}>11:30 - 13:00</Text>
              <Text style={styles.statMetricSub}>Khách tập trung đông nhất</Text>
            </View>

            <View style={styles.statMetricCard}>
              <Text style={styles.statMetricLabel}>CHI TIÊU BÌNH QUÂN / KHÁCH</Text>
              <Text style={[styles.statMetricVal, { color: LotusTheme.success }]}>95.000 đ</Text>
              <Text style={styles.statMetricSub}>Doanh thu / lượt khách</Text>
            </View>

            <View style={styles.statMetricCard}>
              <Text style={styles.statMetricLabel}>TỔNG ĐƠN ĐÃ HOÀN TẤT</Text>
              <Text style={[styles.statMetricVal, { color: '#1e293b' }]}>
                {orders.filter((o) => o.Status === 'COMPLETED').length}
              </Text>
              <Text style={styles.statMetricSub}>Bàn phục vụ thành công</Text>
            </View>
          </View>

          {/* 24-Hour Distribution Visualization */}
          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>Phân Bố Lượng Khách Theo Khung Giờ Trong Ngày</Text>
            <View style={styles.chartBarsRow}>
              {[
                { h: '07h', v: 4 },
                { h: '08h', v: 8 },
                { h: '09h', v: 12 },
                { h: '10h', v: 15 },
                { h: '11h', v: 38 },
                { h: '12h', v: 45 },
                { h: '13h', v: 28 },
                { h: '14h', v: 10 },
                { h: '15h', v: 8 },
                { h: '16h', v: 14 },
                { h: '17h', v: 26 },
                { h: '18h', v: 42 },
                { h: '19h', v: 40 },
                { h: '20h', v: 22 },
                { h: '21h', v: 8 },
              ].map((item, idx) => (
                <View key={idx} style={styles.barItem}>
                  <View style={[styles.barFill, { height: `${(item.v / 50) * 100}%` }]} />
                  <Text style={styles.barLabel}>{item.h}</Text>
                  <Text style={styles.barValue}>{item.v}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ==================================================== */}
      {/* SUB-TAB 3: QUẢN LÝ DANH SÁCH BÀN (MANAGE)          */}
      {/* ==================================================== */}
      {activeSubTab === 'MANAGE' && (
        <View style={styles.manageCard}>
          <View style={styles.manageHeaderRow}>
            <Text style={styles.manageTitle}>Danh Sách Cấu Hình Bàn Ghế Nhà Hàng</Text>
            <TouchableOpacity style={styles.addTableBtn} onPress={handleOpenAddModal}>
              <FontAwesome5 name="plus" size={12} color="#ffffff" style={{ marginRight: 5 }} />
              <Text style={styles.addTableBtnText}>Thêm Bàn Mới</Text>
            </TouchableOpacity>
          </View>

          {/* Table list */}
          <View style={styles.manageTable}>
            <View style={styles.manageTableHeaderRow}>
              <Text style={[styles.manageTh, { width: 70 }]}>Mã Bàn</Text>
              <Text style={[styles.manageTh, { flex: 1 }]}>Tên Bàn</Text>
              <Text style={[styles.manageTh, { width: 110 }]}>Khu Vực</Text>
              <Text style={[styles.manageTh, { width: 80, textAlign: 'center' }]}>Số Ghế</Text>
              <Text style={[styles.manageTh, { width: 70, textAlign: 'center' }]}>Thứ Tự</Text>
              <Text style={[styles.manageTh, { width: 110, textAlign: 'center' }]}>Thao Tác</Text>
            </View>

            {tables.map((t) => (
              <View key={t.Table_id} style={styles.manageTableRow}>
                <Text style={[styles.manageTd, { width: 70, fontWeight: '800' }]}>{t.Table_code}</Text>
                <Text style={[styles.manageTd, { flex: 1, fontWeight: '700', color: LotusTheme.primaryDark }]}>
                  {t.Table_name}
                </Text>
                <Text style={[styles.manageTd, { width: 110 }]}>{t.Area}</Text>
                <Text style={[styles.manageTd, { width: 80, textAlign: 'center', fontWeight: '800' }]}>
                  {t.Capacity}
                </Text>
                <Text style={[styles.manageTd, { width: 70, textAlign: 'center' }]}>{t.Sort_order || 1}</Text>
                <View style={[styles.manageActionCol, { width: 110 }]}>
                  <TouchableOpacity
                    style={styles.actionIconBtnEdit}
                    onPress={() => handleOpenEditModal(t)}>
                    <FontAwesome5 name="edit" size={13} color="#0284c7" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionIconBtnDelete}
                    onPress={() => handleDeleteTable(t)}>
                    <FontAwesome5 name="trash-alt" size={13} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: MỞ BÀN ĐÓN KHÁCH (OPEN TABLE MODAL)         */}
      {/* ==================================================== */}
      <Modal
        visible={Boolean(openModalTable)}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenModalTable(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialogSm}>
            <View style={styles.modalHeaderGreen}>
              <Text style={styles.modalHeaderTitleWhite}>Mở Bàn Đón Khách</Text>
              <TouchableOpacity onPress={() => setOpenModalTable(null)}>
                <FontAwesome5 name="times" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.openModalBody}>
              <Text style={styles.openModalTableName}>{openModalTable?.Table_name}</Text>
              <Text style={styles.openModalSub}>Khu vực: {openModalTable?.Area} • Sức chứa {openModalTable?.Capacity} ghế</Text>

              <Text style={styles.guestSelectLabel}>Số lượng khách ngồi bàn:</Text>
              <View style={styles.bigStepperRow}>
                <TouchableOpacity
                  style={styles.bigStepperBtnRed}
                  onPress={() => setOpenGuestsCount((p) => Math.max(1, p - 1))}>
                  <FontAwesome5 name="minus" size={16} color="#dc2626" />
                </TouchableOpacity>

                <Text style={styles.bigStepperText}>{openGuestsCount}</Text>

                <TouchableOpacity
                  style={styles.bigStepperBtnGreen}
                  onPress={() => setOpenGuestsCount((p) => p + 1)}>
                  <FontAwesome5 name="plus" size={16} color="#16a34a" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setOpenModalTable(null)}>
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirmGreen}
                onPress={handleConfirmOpenTable}>
                <FontAwesome5 name="utensils" size={13} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.modalBtnConfirmText}>Bắt Đầu Chọn Món</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 2: ĐỔI BÀN / CHUYỂN BÀN                       */}
      {/* ==================================================== */}
      <Modal
        visible={Boolean(transferSourceTable)}
        transparent
        animationType="fade"
        onRequestClose={() => setTransferSourceTable(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialogSm}>
            <View style={styles.modalHeaderYellow}>
              <Text style={styles.modalHeaderTitleDark}>Chuyển Đơn Hàng Sang Bàn Mới</Text>
              <TouchableOpacity onPress={() => setTransferSourceTable(null)}>
                <FontAwesome5 name="times" size={16} color="#1e293b" />
              </TouchableOpacity>
            </View>

            <View style={styles.transferModalBody}>
              <View style={styles.infoNoticeBox}>
                <FontAwesome5 name="info-circle" size={14} color="#0284c7" style={{ marginRight: 6 }} />
                <Text style={styles.infoNoticeText}>
                  Toàn bộ món ăn, số tiền và số khách sẽ được chuyển sang bàn đích. Bàn hiện tại sẽ trở về trống.
                </Text>
              </View>

              <Text style={styles.formFieldLabel}>Bàn Hiện Tại (Đang Phục Vụ):</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyInputText}>{transferSourceTable?.Table_name}</Text>
              </View>

              <Text style={styles.formFieldLabel}>Chọn Bàn Chuyển Đến (Bàn Trống):</Text>
              <ScrollView style={{ maxHeight: 180 }}>
                {tables
                  .filter((t) => t.Table_id !== transferSourceTable?.Table_id && t.Status === 'EMPTY')
                  .map((t) => {
                    const isSelected = transferTargetId === t.Table_id;
                    return (
                      <TouchableOpacity
                        key={t.Table_id}
                        style={[styles.tableChoiceRow, isSelected && styles.tableChoiceRowActive]}
                        onPress={() => setTransferTargetId(t.Table_id)}>
                        <Text style={[styles.tableChoiceText, isSelected && styles.tableChoiceTextActive]}>
                          {t.Table_name} ({t.Area} - {t.Capacity} ghế)
                        </Text>
                        {isSelected && <FontAwesome5 name="check" size={12} color={LotusTheme.primary} />}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setTransferSourceTable(null)}>
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirmYellow}
                onPress={handleConfirmTransfer}>
                <FontAwesome5 name="check" size={13} color="#1e293b" style={{ marginRight: 6 }} />
                <Text style={styles.modalBtnConfirmDarkText}>Xác Nhận Đổi Bàn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 3: THÊM / SỬA BÀN GHẾ                         */}
      {/* ==================================================== */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialogSm}>
            <View style={styles.modalHeaderGreen}>
              <Text style={styles.modalHeaderTitleWhite}>
                {editingTable ? 'Sửa Thông Tin Bàn' : 'Thêm Bàn Mới'}
              </Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <FontAwesome5 name="times" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.editModalBody}>
              <Text style={styles.formFieldLabel}>Mã Bàn (VD: B01, VIP01):</Text>
              <TextInput
                style={styles.formTextInput}
                value={tableFormCode}
                onChangeText={setTableFormCode}
                placeholder="Mã bàn..."
              />

              <Text style={styles.formFieldLabel}>Tên Bàn (Hiển thị):</Text>
              <TextInput
                style={styles.formTextInput}
                value={tableFormName}
                onChangeText={setTableFormName}
                placeholder="Tên bàn..."
              />

              <View style={styles.formRow2Col}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Khu Vực:</Text>
                  <View style={styles.areaSelectRow}>
                    {['Tầng 1', 'Tầng 2', 'Sân Vườn', 'Phòng VIP'].map((a) => (
                      <TouchableOpacity
                        key={a}
                        style={[styles.areaSmallChip, tableFormArea === a && styles.areaSmallChipActive]}
                        onPress={() => setTableFormArea(a)}>
                        <Text style={[styles.areaSmallChipText, tableFormArea === a && styles.areaSmallChipTextActive]}>
                          {a}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ width: 100 }}>
                  <Text style={styles.formFieldLabel}>Số Ghế:</Text>
                  <TextInput
                    style={[styles.formTextInput, { textAlign: 'center', fontWeight: '800' }]}
                    value={tableFormCapacity}
                    onChangeText={setTableFormCapacity}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.formFieldLabel}>Thứ Tự Sắp Xếp:</Text>
              <TextInput
                style={[styles.formTextInput, { textAlign: 'center' }]}
                value={tableFormSortOrder}
                onChangeText={setTableFormSortOrder}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setIsEditModalOpen(false)}>
                <Text style={styles.modalBtnCancelText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirmGreen}
                onPress={handleSaveTable}>
                <FontAwesome5 name="save" size={13} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.modalBtnConfirmText}>Lưu Thông Tin Bàn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 4: CHI TIẾT BÀN / PHIẾU TẠM TÍNH               */}
      {/* ==================================================== */}
      <TableDetailModal
        table={activeDetailTable}
        visible={Boolean(activeDetailTable)}
        onClose={() => setActiveDetailTable(null)}
        onPay={(tbl) => {
          setActiveDetailTable(null);
          setPaymentTable(tbl);
        }}
      />

      {/* ==================================================== */}
      {/* MODAL 5: THANH TOÁN TIỀN BÀN                         */}
      {/* ==================================================== */}
      <PaymentModal
        table={paymentTable}
        visible={Boolean(paymentTable)}
        onClose={() => setPaymentTable(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 70,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: LotusTheme.primaryDark,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  headerActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  layoutTogglePill: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
  },
  toggleBtnActive: {
    backgroundColor: '#1e293b',
  },
  toggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  addTableBtn: {
    backgroundColor: LotusTheme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(46, 125, 50, 0.25)' },
    }),
  },
  addTableBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    width: Platform.OS === 'web' ? ('calc(25% - 8px)' as any) : '48%',
    minWidth: 150,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    }),
  },
  kpiBorderSuccess: { borderLeftColor: LotusTheme.success },
  kpiBorderWarning: { borderLeftColor: '#f59e0b' },
  kpiBorderPrimary: { borderLeftColor: '#0284c7' },
  kpiBorderInfo: { borderLeftColor: '#059669' },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  kpiIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.03)' },
    }),
  },
  subTabsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  subTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  subTabItemActive: {
    backgroundColor: '#e8f5e9',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  subTabTextActive: {
    color: LotusTheme.primaryDark,
    fontWeight: '800',
  },
  areaFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  areaFilterLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginRight: 4,
  },
  areaFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  areaFilterPillActive: {
    backgroundColor: LotusTheme.primary,
    borderColor: LotusTheme.primaryDark,
  },
  areaFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  areaFilterPillTextActive: {
    color: '#ffffff',
  },
  horizontalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  verticalList: {
    flexDirection: 'column',
    gap: 10,
  },
  tableCardBox: {
    width: Platform.OS === 'web' ? ('calc(25% - 9px)' as any) : '100%',
    minWidth: 260,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.8,
    ...Platform.select({
      web: { boxShadow: '0 3px 12px rgba(0,0,0,0.05)' },
    }),
  },
  tableCardBoxVertical: {
    width: '100%',
  },
  cardBorderEmpty: {
    borderColor: '#bbf7d0',
  },
  cardBorderOccupied: {
    borderColor: '#fde047',
  },
  cardHeader: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  cardHeaderEmpty: {
    backgroundColor: '#f0fdf4',
    borderBottomColor: '#dcfce7',
  },
  cardHeaderOccupied: {
    backgroundColor: '#fefce8',
    borderBottomColor: '#fef08a',
  },
  cardTableName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1e293b',
  },
  cardAreaSubtitle: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '900',
  },
  cardBody: {
    padding: 10,
  },
  guestStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  guestStepperLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  stepperValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: LotusTheme.primaryDark,
    minWidth: 50,
    textAlign: 'center',
  },
  occupiedInfoBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  orderCodeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400e',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '900',
    color: LotusTheme.danger,
    marginTop: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  btnActionDetail: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    backgroundColor: '#f0f9ff',
    borderRightWidth: 1,
    borderRightColor: '#e0f2fe',
  },
  btnActionDetailText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0284c7',
  },
  btnActionTransfer: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    backgroundColor: '#fffbeb',
    borderRightWidth: 1,
    borderRightColor: '#fef3c7',
  },
  btnActionTransferText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#d97706',
  },
  btnActionPay: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    backgroundColor: LotusTheme.danger,
  },
  btnActionPayText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  btnActionOpen: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    backgroundColor: LotusTheme.primary,
  },
  btnActionOpenText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  btnActionMenu: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    backgroundColor: '#f0fdf4',
  },
  btnActionMenuText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    }),
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: LotusTheme.primaryDark,
  },
  statsSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  timePillGroup: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    padding: 3,
  },
  timePillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  timePillBtnActive: {
    backgroundColor: LotusTheme.primary,
  },
  timePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  timePillTextActive: {
    color: '#ffffff',
  },
  statMetricCard: {
    width: Platform.OS === 'web' ? ('calc(25% - 8px)' as any) : '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  statMetricVal: {
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 4,
  },
  statMetricSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  chartBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: 20,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 14,
    backgroundColor: LotusTheme.primary,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 6,
  },
  barValue: {
    fontSize: 8.5,
    color: '#94a3b8',
  },
  manageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    }),
  },
  manageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  manageTable: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  manageTableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 10,
  },
  manageTh: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  manageTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  manageTd: {
    fontSize: 12,
    color: '#334155',
  },
  manageActionCol: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionIconBtnEdit: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBtnDelete: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalDialogSm: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
    }),
  },
  modalHeaderGreen: {
    backgroundColor: LotusTheme.primary,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderYellow: {
    backgroundColor: LotusTheme.accent,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleWhite: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalHeaderTitleDark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  openModalBody: {
    padding: 20,
    alignItems: 'center',
  },
  openModalTableName: {
    fontSize: 20,
    fontWeight: '900',
    color: LotusTheme.primaryDark,
  },
  openModalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 16,
  },
  guestSelectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  bigStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 10,
  },
  bigStepperBtnRed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#f87171',
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigStepperBtnGreen: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#4ade80',
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigStepperText: {
    fontSize: 32,
    fontWeight: '900',
    color: LotusTheme.primaryDark,
    minWidth: 40,
    textAlign: 'center',
  },
  modalFooter: {
    backgroundColor: '#f8fafc',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalBtnCancel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  modalBtnCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalBtnConfirmGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: LotusTheme.primary,
  },
  modalBtnConfirmYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: LotusTheme.accent,
  },
  modalBtnConfirmText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalBtnConfirmDarkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
  },
  transferModalBody: {
    padding: 16,
  },
  infoNoticeBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  infoNoticeText: {
    fontSize: 11,
    color: '#0369a1',
    flex: 1,
    lineHeight: 16,
  },
  formFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4,
  },
  readOnlyInput: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  readOnlyInputText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  tableChoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableChoiceRowActive: {
    backgroundColor: '#e8f5e9',
    borderColor: LotusTheme.primary,
  },
  tableChoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  tableChoiceTextActive: {
    color: LotusTheme.primaryDark,
    fontWeight: '800',
  },
  editModalBody: {
    padding: 16,
  },
  formTextInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    color: '#1e293b',
  },
  formRow2Col: {
    flexDirection: 'row',
    gap: 10,
  },
  areaSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  areaSmallChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  areaSmallChipActive: {
    backgroundColor: LotusTheme.primary,
    borderColor: LotusTheme.primaryDark,
  },
  areaSmallChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  areaSmallChipTextActive: {
    color: '#ffffff',
  },
});
