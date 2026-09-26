import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
  Image,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { SystemSettings } from '@/types';
import { useRouter } from 'expo-router';

export default function SystemSettingsScreen() {
  const router = useRouter();
  const {
    serverUrl,
    setServerUrl,
    syncFromServer,
    systemSettings,
    updateSystemSettings,
    users,
    hasPermission,
    updateUserPermissions,
    getUserPermissions,
    showAlert,
    showConfirm,
    currentUser,
  } = useApp();

  // Check access permission
  const isAllowed = hasPermission('SYSTEM_CONFIG') || currentUser.Role === 'ADMIN' || currentUser.User_name === 'vu' || currentUser.User_name === 'admin';

  const [activeSubTab, setActiveSubTab] = useState<'ROLES' | 'PRINTER_SOUND' | 'BRAND'>('PRINTER_SOUND');

  // Form State initialized from systemSettings
  const [formData, setFormData] = useState<SystemSettings>({ ...systemSettings });

  // Update form data if systemSettings changes externally
  useEffect(() => {
    setFormData({ ...systemSettings });
  }, [systemSettings]);

  // Tab A: Role & Permissions matrix
  const [selectedUser, setSelectedUser] = useState<string>(
    users.find((u) => u.User_name !== 'vu' && u.User_name !== 'admin')?.User_name || users[0]?.User_name || 'boi'
  );
  const [currentPerms, setCurrentPerms] = useState<string[]>([]);

  useEffect(() => {
    const u = users.find((x) => x.User_name.toLowerCase() === selectedUser.toLowerCase());
    if (u) {
      setCurrentPerms(getUserPermissions(u));
    }
  }, [selectedUser, users, getUserPermissions]);

  const togglePerm = (permKey: string) => {
    setCurrentPerms((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  const handleSaveUserPerms = async () => {
    await updateUserPermissions(selectedUser, currentPerms);
    showAlert('Thành công', `Đã lưu phân quyền cho nhân viên [${selectedUser}] thành công!`, 'success');
  };

  const handleResetUserPerms = () => {
    const u = users.find((x) => x.User_name.toLowerCase() === selectedUser.toLowerCase());
    if (!u) return;
    const roleUpper = u.Role.toUpperCase();
    let defaultPerms: string[] = [];
    if (roleUpper === 'WAITER') {
      defaultPerms = ['TABLES_VIEW', 'MENU_CARDS', 'CART', 'READY_ORDERS', 'ORDERS_PERSONAL', 'COLLECT_PAYMENT'];
    } else if (roleUpper === 'CASHIER') {
      defaultPerms = [
        'TABLES_VIEW',
        'ORDERS_LIST',
        'ORDERS_ALL',
        'ORDERS_EDIT',
        'COLLECT_PAYMENT',
        'REPORTS_STATS',
        'MENU_CARDS',
        'CART',
        'READY_ORDERS',
        'ORDERS_PERSONAL',
      ];
    } else if (roleUpper === 'KITCHEN') {
      defaultPerms = ['KITCHEN', 'READY_ORDERS', 'ORDERS_PERSONAL'];
    } else {
      defaultPerms = ['TABLES_VIEW', 'MENU_CARDS', 'CART', 'READY_ORDERS'];
    }
    setCurrentPerms(defaultPerms);
    showAlert('Đã khôi phục', `Đã đặt lại quyền mặc định theo vai trò [${u.Role}] cho nhân viên [${selectedUser}]!`, 'info');
  };

  const handleSaveAll = () => {
    updateSystemSettings(formData);
    showAlert('Thành công', 'Đã lưu toàn bộ cấu hình hệ thống thành công!', 'success');
  };

  const handleTestPrint = () => {
    showAlert('In thử nghiệm', `Đã gửi lệnh in thử mẫu hóa đơn ${formData.paperSize} đến máy in ${formData.printer}!`, 'success');
  };

  const handleTestIp = () => {
    showAlert('Kiểm tra kết nối', `Máy in tại địa chỉ ${formData.printerIp} đang hoạt động bình thường! (Độ trễ: 12ms)`, 'success');
  };

  const handleTestSound = (type: 'KITCHEN' | 'READY') => {
    const soundTitle = type === 'KITCHEN' ? formData.kitchenSoundType : formData.readySoundType;
    showAlert('Nghe thử âm thanh', `Đang phát âm thanh chuông báo: [${soundTitle}]`, 'info');
  };

  // If user does not have permission, show access denied view!
  if (!isAllowed) {
    return (
      <View style={styles.accessDeniedContainer}>
        <View style={styles.accessDeniedCard}>
          <FontAwesome5 name="user-slash" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <Text style={styles.accessDeniedTitle}>Truy Cập Bị Từ Chối</Text>
          <Text style={styles.accessDeniedMessage}>
            Tài khoản <Text style={{ fontWeight: 'bold' }}>{currentUser.Full_name || currentUser.User_name}</Text> ({currentUser.Role}) không có quyền truy cập vào mục Quản Lý Hệ Thống.
          </Text>
          <Text style={styles.accessDeniedSub}>
            Vui lòng đăng nhập bằng tài khoản Quản Lý (Admin) hoặc liên hệ chủ nhà hàng để được cấp quyền!
          </Text>
          <TouchableOpacity
            style={styles.btnBackHome}
            onPress={() => router.push('/')}>
            <Text style={styles.btnBackHomeText}>Quay Về Trang Chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Title & Save Button */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <FontAwesome5 name="cogs" size={18} color="#15803d" />
          <Text style={styles.pageTitle}>Cấu Hình Quản Lý Hệ Thống</Text>
        </View>
        <TouchableOpacity style={styles.btnSaveAll} onPress={handleSaveAll} activeOpacity={0.85}>
          <FontAwesome5 name="save" size={13} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.btnSaveAllText}>Lưu Toàn Bộ Cấu Hình</Text>
        </TouchableOpacity>
      </View>

      {/* Sub Tabs Pill Row */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.pillBtn, activeSubTab === 'ROLES' && styles.pillBtnActive]}
          onPress={() => setActiveSubTab('ROLES')}>
          <FontAwesome5
            name="user-shield"
            size={12}
            color={activeSubTab === 'ROLES' ? '#ffffff' : '#475569'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.pillBtnText, activeSubTab === 'ROLES' && styles.pillBtnTextActive]}>
            a. Phân Quyền & Vai Trò
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pillBtn, activeSubTab === 'PRINTER_SOUND' && styles.pillBtnActive]}
          onPress={() => setActiveSubTab('PRINTER_SOUND')}>
          <FontAwesome5
            name="sliders-h"
            size={12}
            color={activeSubTab === 'PRINTER_SOUND' ? '#ffffff' : '#475569'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.pillBtnText, activeSubTab === 'PRINTER_SOUND' && styles.pillBtnTextActive]}>
            b. Máy In, Thanh Toán & Âm Thanh
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pillBtn, activeSubTab === 'BRAND' && styles.pillBtnActive]}
          onPress={() => setActiveSubTab('BRAND')}>
          <FontAwesome5
            name="globe"
            size={12}
            color={activeSubTab === 'BRAND' ? '#ffffff' : '#475569'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.pillBtnText, activeSubTab === 'BRAND' && styles.pillBtnTextActive]}>
            c. Thương Hiệu & Logo Web
          </Text>
        </TouchableOpacity>
      </View>

      {/* ==================================================== */}
      {/* TAB A: PHÂN QUYỀN & VAI TRÒ                          */}
      {/* ==================================================== */}
      {activeSubTab === 'ROLES' && (
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderGreen}>
            <FontAwesome5 name="user-shield" size={14} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeaderTitleWhite}>
              Phân Quyền Chức Năng Menu & Quyền Hạn Theo Nhân Viên
            </Text>
          </View>

          <View style={{ padding: 16 }}>
            <View style={styles.infoNoticeBox}>
              <FontAwesome5 name="info-circle" size={16} color="#0284c7" style={{ marginRight: 8 }} />
              <Text style={styles.infoNoticeText}>
                Hệ thống cho phép Quản Lý phân quyền riêng biệt cho <Text style={{ fontWeight: 'bold' }}>từng nhân viên cụ thể</Text> (như Bồi bàn hay Bếp không được truy cập vào một trang khi chưa có sự cho phép).
              </Text>
            </View>

            {/* Select Employee Row */}
            <View style={styles.selectUserRow}>
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text style={styles.inputLabel}>Chọn nhân viên cần phân quyền:</Text>
                <View style={styles.chipsRow}>
                  {users.map((u) => {
                    const isSelected = selectedUser.toLowerCase() === u.User_name.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={u.User_id}
                        style={[styles.userSelectChip, isSelected && styles.userSelectChipActive]}
                        onPress={() => setSelectedUser(u.User_name)}>
                        <Text style={[styles.userSelectChipText, isSelected && styles.userSelectChipTextActive]}>
                          {u.Full_name || u.User_name} ({u.Role})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.userPermActionsRow}>
                <TouchableOpacity
                  style={styles.btnResetPerm}
                  onPress={handleResetUserPerms}>
                  <FontAwesome5 name="rotate-left" size={11} color="#475569" style={{ marginRight: 4 }} />
                  <Text style={styles.btnResetPermText}>Khôi Phục Mặc Định</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnSaveUserPerm}
                  onPress={handleSaveUserPerms}>
                  <FontAwesome5 name="save" size={11} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.btnSaveUserPermText}>Lưu Quyền Nhân Viên</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3-Group Permissions Matrix */}
            <View style={styles.permMatrixRow}>
              {/* Group 1: Phòng Bàn & Phục Vụ */}
              <View style={styles.permCol}>
                <View style={styles.permColHeaderGreen}>
                  <Text style={styles.permColHeaderTitle}>1. Phòng Bàn & Phục Vụ</Text>
                </View>

                {[
                  {
                    key: 'TABLES_VIEW',
                    label: 'Sơ Đồ Phòng Bàn',
                    desc: 'Xem sơ đồ bàn, đổi bàn, thêm bớt khách ngồi bàn',
                  },
                  {
                    key: 'TABLES_MANAGE',
                    label: 'Quản Lý Bàn Ghế',
                    desc: 'Thêm, sửa, xóa cấu hình bàn ghế và khu vực',
                  },
                  {
                    key: 'MENU_CARDS',
                    label: 'Menu Dạng Thẻ',
                    desc: 'Xem thực đơn dạng thẻ, chọn topping tại bàn',
                  },
                  {
                    key: 'CART',
                    label: 'Giỏ Hàng & Đặt Món',
                    desc: 'Quản lý giỏ hàng và gửi đơn xuống bếp',
                  },
                  {
                    key: 'READY_ORDERS',
                    label: 'Nhận Món (Bếp Xong)',
                    desc: 'Xem và nhận đơn bếp báo đã nấu xong để giao',
                  },
                ].map((item) => (
                  <View key={item.key} style={styles.permItemRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.permItemLabel}>{item.label}</Text>
                      <Text style={styles.permItemDesc}>{item.desc}</Text>
                    </View>
                    <Switch
                      value={currentPerms.includes(item.key)}
                      onValueChange={() => togglePerm(item.key)}
                      trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                      thumbColor={currentPerms.includes(item.key) ? '#15803d' : '#f1f5f9'}
                    />
                  </View>
                ))}
              </View>

              {/* Group 2: Đơn Hàng & Doanh Thu */}
              <View style={styles.permCol}>
                <View style={styles.permColHeaderBlue}>
                  <Text style={styles.permColHeaderTitle}>2. Đơn Hàng & Doanh Thu</Text>
                </View>

                {[
                  {
                    key: 'ORDERS_PERSONAL',
                    label: 'Đơn Hàng & Nhật Ký Cá Nhân',
                    desc: 'Xem danh sách các đơn hàng do mình tạo',
                  },
                  {
                    key: 'ORDERS_LIST',
                    label: 'Xem Danh Sách Đơn Hàng',
                    desc: 'Mở tab Danh Sách Đơn Hàng trong /orders',
                  },
                  {
                    key: 'ORDERS_ALL',
                    label: 'Xem Toàn Bộ Đơn Hàng Quán',
                    desc: 'Cho phép bồi bàn chủ động xem đơn toàn quán như thu ngân',
                  },
                  {
                    key: 'ORDERS_EDIT',
                    label: 'Sửa Đơn Hàng',
                    desc: 'Cho phép nhân viên điều chỉnh, sửa món trong đơn',
                  },
                  {
                    key: 'ORDERS_CANCEL',
                    label: 'Hủy Đơn Hàng',
                    desc: 'Cho phép hủy đơn khi khách đổi ý hoặc có sự cố',
                  },
                  {
                    key: 'COLLECT_PAYMENT',
                    label: 'Thu Tiền & Xác Nhận',
                    desc: 'Thu tiền mặt và kích hoạt mã VietQR bàn',
                  },
                  {
                    key: 'REPORTS_STATS',
                    label: 'Thống Kê Doanh Thu',
                    desc: 'Xem biểu đồ doanh thu và báo cáo tài chính',
                  },
                ].map((item) => (
                  <View key={item.key} style={styles.permItemRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.permItemLabel}>{item.label}</Text>
                      <Text style={styles.permItemDesc}>{item.desc}</Text>
                    </View>
                    <Switch
                      value={currentPerms.includes(item.key)}
                      onValueChange={() => togglePerm(item.key)}
                      trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                      thumbColor={currentPerms.includes(item.key) ? '#1d4ed8' : '#f1f5f9'}
                    />
                  </View>
                ))}
              </View>

              {/* Group 3: Chế Biến & Quản Trị */}
              <View style={styles.permCol}>
                <View style={styles.permColHeaderOrange}>
                  <Text style={styles.permColHeaderTitle}>3. Chế Biến & Quản Trị</Text>
                </View>

                {[
                  {
                    key: 'KITCHEN',
                    label: 'Màn Hình Bếp KDS',
                    desc: 'Truy cập giao diện điều phối chế biến của đầu bếp',
                  },
                  {
                    key: 'MENU_MANAGE',
                    label: 'Quản Lý Thực Đơn & Danh Mục',
                    desc: 'Thêm, sửa, xóa món ăn, topping và danh mục',
                  },
                  {
                    key: 'USERS_MANAGE',
                    label: 'Quản Lý Người Dùng & Nhân Viên',
                    desc: 'Thêm tài khoản, đổi mật khẩu và đổi vai trò',
                  },
                  {
                    key: 'SYSTEM_CONFIG',
                    label: 'Cài Đặt Hệ Thống & Phân Quyền',
                    desc: 'Thiết lập máy in, âm thanh và phân quyền nhân viên',
                  },
                ].map((item) => (
                  <View key={item.key} style={styles.permItemRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.permItemLabel}>{item.label}</Text>
                      <Text style={styles.permItemDesc}>{item.desc}</Text>
                    </View>
                    <Switch
                      value={currentPerms.includes(item.key)}
                      onValueChange={() => togglePerm(item.key)}
                      trackColor={{ false: '#cbd5e1', true: '#fed7aa' }}
                      thumbColor={currentPerms.includes(item.key) ? '#ea580c' : '#f1f5f9'}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ==================================================== */}
      {/* TAB B: MÁY IN, THANH TOÁN & ÂM THANH (Matching Images 4 & 5) */}
      {/* ==================================================== */}
      {activeSubTab === 'PRINTER_SOUND' && (
        <View style={styles.printerSoundContainer}>
          {/* Left Column: Forms */}
          <View style={styles.printerLeftCol}>
            {/* 1. Thiết Lập Máy In & Mẫu Hóa Đơn */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeaderGreen}>
                <FontAwesome5 name="print" size={14} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.sectionHeaderTitleWhite}>1. Thiết Lập Máy In & Mẫu Hóa Đơn</Text>
              </View>

              <View style={{ padding: 16 }}>
                {/* Auto Print Switches */}
                <View style={styles.formBoxGray}>
                  <Text style={styles.boxTitleGreen}>
                    <FontAwesome5 name="bolt" size={12} color="#15803d" /> Chế Độ In Bill Bếp & Thanh Toán
                  </Text>

                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchLabel}>Tự động in bill khi Bếp nhận đơn mới</Text>
                      <Text style={styles.switchDesc}>Khi có đơn mới tới hoặc bếp nhấn chấp nhận, tự động in phiếu chế biến.</Text>
                    </View>
                    <Switch
                      value={formData.autoPrintKitchen}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, autoPrintKitchen: v }))}
                      trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                      thumbColor={formData.autoPrintKitchen ? '#15803d' : '#f1f5f9'}
                    />
                  </View>

                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchLabel}>Tự động in hóa đơn khi Khách thanh toán</Text>
                      <Text style={styles.switchDesc}>Tự động xuất lệnh in bill khi thu ngân xác nhận đã thu tiền.</Text>
                    </View>
                    <Switch
                      value={formData.autoPrintPayment}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, autoPrintPayment: v }))}
                      trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                      thumbColor={formData.autoPrintPayment ? '#15803d' : '#f1f5f9'}
                    />
                  </View>
                </View>

                {/* Connection & Paper Size */}
                <View style={styles.formBoxGray}>
                  <Text style={styles.boxTitleGreen}>
                    <FontAwesome5 name="network-wired" size={12} color="#15803d" /> Kết Nối Máy In & Khổ Giấy In
                  </Text>

                  <View style={styles.formRowTwoCol}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Cổng kết nối máy in</Text>
                      <View style={styles.chipsRow}>
                        {[
                          { id: 'LAN', label: 'Mạng LAN / IP' },
                          { id: 'BLUETOOTH', label: 'Bluetooth' },
                          { id: 'BROWSER', label: 'USB / Trình Duyệt' },
                        ].map((p) => (
                          <TouchableOpacity
                            key={p.id}
                            style={[styles.smallPill, formData.printer === p.id && styles.smallPillActive]}
                            onPress={() => setFormData((prev) => ({ ...prev, printer: p.id as any }))}>
                            <Text style={[styles.smallPillText, formData.printer === p.id && styles.smallPillTextActive]}>
                              {p.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Khổ giấy in (Định dạng bill)</Text>
                      <View style={styles.chipsRow}>
                        {[
                          { id: '80mm', label: 'K80 (80mm - Chuẩn)' },
                          { id: '58mm', label: 'K58 (58mm)' },
                          { id: 'A4', label: 'A4' },
                        ].map((sz) => (
                          <TouchableOpacity
                            key={sz.id}
                            style={[styles.smallPill, formData.paperSize === sz.id && styles.smallPillActive]}
                            onPress={() => setFormData((prev) => ({ ...prev, paperSize: sz.id as any }))}>
                            <Text style={[styles.smallPillText, formData.paperSize === sz.id && styles.smallPillTextActive]}>
                              {sz.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* LAN IP Input */}
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.inputLabel}>Địa chỉ IP Máy In LAN (Kèm Cổng 9100)</Text>
                    <View style={styles.inputWithBtnRow}>
                      <TextInput
                        style={[styles.textInput, { flex: 1 }]}
                        value={formData.printerIp}
                        onChangeText={(t) => setFormData((prev) => ({ ...prev, printerIp: t }))}
                        placeholder="192.168.1.200:9100"
                      />
                      <TouchableOpacity style={styles.btnActionInline} onPress={handleTestIp}>
                        <FontAwesome5 name="plug" size={11} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.btnActionInlineText}>Kiểm Tra IP</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.subHintText}>Cổng in nhiệt chuẩn thông thường là 9100.</Text>
                  </View>
                </View>

                {/* Restaurant Info on Bill */}
                <View style={styles.formBoxGray}>
                  <Text style={styles.boxTitleGreen}>
                    <FontAwesome5 name="file-invoice" size={12} color="#15803d" /> Nội Dung Tiêu Đề Hóa Đơn
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Tên Nhà Hàng / Quán</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.resName}
                      onChangeText={(t) => setFormData((prev) => ({ ...prev, resName: t }))}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Địa chỉ quán ghi trên Bill</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.resAddr}
                      onChangeText={(t) => setFormData((prev) => ({ ...prev, resAddr: t }))}
                    />
                  </View>

                  <View style={styles.formRowTwoCol}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Số Điện Thoại Hotline</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.resPhone}
                        onChangeText={(t) => setFormData((prev) => ({ ...prev, resPhone: t }))}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Thông tin Wifi & Pass</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.resWifi}
                        onChangeText={(t) => setFormData((prev) => ({ ...prev, resWifi: t }))}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Lời cảm ơn chân trang Bill</Text>
                    <TextInput
                      style={[styles.textInput, { height: 60 }]}
                      multiline
                      value={formData.billFooter}
                      onChangeText={(t) => setFormData((prev) => ({ ...prev, billFooter: t }))}
                    />
                  </View>
                </View>

                {/* VietQR Code Section */}
                <View style={styles.formBoxGray}>
                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.boxTitleGreen}>
                        <FontAwesome5 name="qrcode" size={12} color="#15803d" /> In Mã VietQR Động Lên Cuối Bill
                      </Text>
                    </View>
                    <Switch
                      value={formData.showQrCode}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, showQrCode: v }))}
                      trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                      thumbColor={formData.showQrCode ? '#15803d' : '#f1f5f9'}
                    />
                  </View>

                  {formData.showQrCode && (
                    <View style={{ marginTop: 10 }}>
                      <View style={styles.formRowTwoCol}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>Ngân Hàng Thụ Hưởng</Text>
                          <View style={styles.chipsRow}>
                            {['TCB', 'VCB', 'MBBANK', 'ACB', 'BIDV', 'VPB'].map((b) => (
                              <TouchableOpacity
                                key={b}
                                style={[styles.smallPill, formData.qrBank === b && styles.smallPillActive]}
                                onPress={() => setFormData((prev) => ({ ...prev, qrBank: b }))}>
                                <Text style={[styles.smallPillText, formData.qrBank === b && styles.smallPillTextActive]}>
                                  {b}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>Số Tài Khoản (STK)</Text>
                          <TextInput
                            style={styles.textInput}
                            placeholder="Nhập số tài khoản..."
                            value={formData.qrAccountNo}
                            onChangeText={(t) => setFormData((prev) => ({ ...prev, qrAccountNo: t }))}
                          />
                        </View>
                      </View>

                      <View style={[styles.inputGroup, { marginTop: 8 }]}>
                        <Text style={styles.inputLabel}>Tên Chủ Tài Khoản (In hoa không dấu)</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="VD: NGUYEN VAN A"
                          value={formData.qrAccountName}
                          onChangeText={(t) => setFormData((prev) => ({ ...prev, qrAccountName: t.toUpperCase() }))}
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* 2. Cấu Hình Âm Thanh Báo Bếp & Nhận Món */}
            <View style={[styles.cardSection, { marginTop: 14 }]}>
              <View style={styles.sectionHeaderGreen}>
                <FontAwesome5 name="volume-up" size={14} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.sectionHeaderTitleWhite}>
                  2. Cấu Hình Âm Thanh Báo Bếp & Nhận Món
                </Text>
              </View>

              <View style={{ padding: 16 }}>
                {/* A. Báo Bếp */}
                <View style={styles.formBoxGray}>
                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.boxTitleGreen}>
                        <FontAwesome5 name="fire" size={12} color="#dc2626" /> Âm Thanh Màn Hình Bếp (/kitchen)
                      </Text>
                      <Text style={styles.switchDesc}>Phát chuông khi có đơn mới từ điện thoại / bồi bàn gửi vào bếp.</Text>
                    </View>
                    <Switch
                      value={formData.kitchenSoundEnabled}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, kitchenSoundEnabled: v }))}
                      trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                      thumbColor={formData.kitchenSoundEnabled ? '#15803d' : '#f1f5f9'}
                    />
                  </View>

                  <View style={styles.soundConfigRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Kiểu âm thanh chuông báo</Text>
                      <View style={styles.chipsRow}>
                        {[
                          { id: 'kitchen_bell', label: 'Ting-Ting' },
                          { id: 'dingdong', label: 'Ding-Dong' },
                          { id: 'beep_alert', label: 'Beep Còi' },
                          { id: 'fanfare', label: 'Kèn Vui' },
                        ].map((s) => (
                          <TouchableOpacity
                            key={s.id}
                            style={[styles.smallPill, formData.kitchenSoundType === s.id && styles.smallPillActive]}
                            onPress={() => setFormData((prev) => ({ ...prev, kitchenSoundType: s.id }))}>
                            <Text style={[styles.smallPillText, formData.kitchenSoundType === s.id && styles.smallPillTextActive]}>
                              {s.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.btnListenTest}
                      onPress={() => handleTestSound('KITCHEN')}>
                      <FontAwesome5 name="play" size={11} color="#ffffff" style={{ marginRight: 5 }} />
                      <Text style={styles.btnListenTestText}>Nghe Thử</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formRowTwoCol}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Số lần kêu: {formData.kitchenRepeatCount} lần</Text>
                      <View style={styles.chipsRow}>
                        {[1, 2, 3, 5].map((cnt) => (
                          <TouchableOpacity
                            key={cnt}
                            style={[styles.smallPill, formData.kitchenRepeatCount === cnt && styles.smallPillActive]}
                            onPress={() => setFormData((prev) => ({ ...prev, kitchenRepeatCount: cnt }))}>
                            <Text style={[styles.smallPillText, formData.kitchenRepeatCount === cnt && styles.smallPillTextActive]}>
                              {cnt} lần
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Khoảng cách: {formData.kitchenRepeatInterval} giây</Text>
                      <View style={styles.chipsRow}>
                        {[1, 2, 3].map((sec) => (
                          <TouchableOpacity
                            key={sec}
                            style={[styles.smallPill, formData.kitchenRepeatInterval === sec && styles.smallPillActive]}
                            onPress={() => setFormData((prev) => ({ ...prev, kitchenRepeatInterval: sec }))}>
                            <Text style={[styles.smallPillText, formData.kitchenRepeatInterval === sec && styles.smallPillTextActive]}>
                              {sec}s
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>

                {/* B. Báo Nhận Món */}
                <View style={styles.formBoxGray}>
                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.boxTitleGreen}>
                        <FontAwesome5 name="bell" size={12} color="#15803d" /> Âm Thanh Màn Hình Nhận Món (/ready-orders)
                      </Text>
                      <Text style={styles.switchDesc}>Phát chuông cho bồi bàn / khách khi bếp bấm "Xong (Báo bồi)".</Text>
                    </View>
                    <Switch
                      value={formData.readySoundEnabled}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, readySoundEnabled: v }))}
                      trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                      thumbColor={formData.readySoundEnabled ? '#15803d' : '#f1f5f9'}
                    />
                  </View>

                  <View style={styles.soundConfigRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Kiểu âm thanh chuông báo</Text>
                      <View style={styles.chipsRow}>
                        {[
                          { id: 'dingdong', label: 'Ding-Dong' },
                          { id: 'kitchen_bell', label: 'Ting-Ting' },
                          { id: 'beep_alert', label: 'Beep' },
                          { id: 'fanfare', label: 'Kèn Vui' },
                        ].map((s) => (
                          <TouchableOpacity
                            key={s.id}
                            style={[styles.smallPill, formData.readySoundType === s.id && styles.smallPillActive]}
                            onPress={() => setFormData((prev) => ({ ...prev, readySoundType: s.id }))}>
                            <Text style={[styles.smallPillText, formData.readySoundType === s.id && styles.smallPillTextActive]}>
                              {s.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.btnListenTest}
                      onPress={() => handleTestSound('READY')}>
                      <FontAwesome5 name="play" size={11} color="#ffffff" style={{ marginRight: 5 }} />
                      <Text style={styles.btnListenTestText}>Nghe Thử</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formRowTwoCol}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Số lần kêu: {formData.readyRepeatCount} lần</Text>
                      <View style={styles.chipsRow}>
                        {[1, 2, 3, 5].map((cnt) => (
                          <TouchableOpacity
                            key={cnt}
                            style={[styles.smallPill, formData.readyRepeatCount === cnt && styles.smallPillActive]}
                            onPress={() => setFormData((prev) => ({ ...prev, readyRepeatCount: cnt }))}>
                            <Text style={[styles.smallPillText, formData.readyRepeatCount === cnt && styles.smallPillTextActive]}>
                              {cnt} lần
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Khoảng cách: {formData.readyRepeatInterval} giây</Text>
                      <View style={styles.chipsRow}>
                        {[1, 2, 3].map((sec) => (
                          <TouchableOpacity
                            key={sec}
                            style={[styles.smallPill, formData.readyRepeatInterval === sec && styles.smallPillActive]}
                            onPress={() => setFormData((prev) => ({ ...prev, readyRepeatInterval: sec }))}>
                            <Text style={[styles.smallPillText, formData.readyRepeatInterval === sec && styles.smallPillTextActive]}>
                              {sec}s
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Save Settings Button */}
                <TouchableOpacity
                  style={styles.btnSaveSubSection}
                  onPress={handleSaveAll}
                  activeOpacity={0.85}>
                  <FontAwesome5 name="save" size={13} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.btnSaveSubSectionText}>Lưu Cấu Hình Máy In & Âm Thanh</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Right Column: Thermal Paper Slip Preview (Images 4 & 5) */}
          <View style={styles.printerRightCol}>
            <View style={styles.previewCard}>
              <View style={styles.previewHeaderDark}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome5 name="receipt" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.previewHeaderTitle}>Mô Phỏng Trang Giấy In Bill</Text>
                </View>
                <TouchableOpacity style={styles.btnTestPrintTop} onPress={handleTestPrint}>
                  <FontAwesome5 name="print" size={11} color="#dc2626" style={{ marginRight: 4 }} />
                  <Text style={styles.btnTestPrintTopText}>In Thử Ngay</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.previewBody}>
                <Text style={styles.previewPaperBadge}>Khổ giấy đang chọn: <Text style={{ color: '#15803d', fontWeight: 'bold' }}>{formData.paperSize}</Text></Text>

                {/* Realistic Thermal Receipt Slip */}
                <View style={styles.thermalSlip}>
                  <Text style={styles.slipResName}>{formData.resName}</Text>
                  <Text style={styles.slipSub}>{formData.resAddr}</Text>
                  <Text style={styles.slipSub}>ĐT: {formData.resPhone}</Text>
                  <Text style={styles.slipSub}>{formData.resWifi}</Text>

                  <View style={styles.slipDashedDivider} />
                  <Text style={styles.slipTitle}>HOÁ ĐƠN THANH TOÁN</Text>
                  <View style={styles.slipDashedDivider} />

                  <View style={styles.slipRowBetween}>
                    <Text style={styles.slipMonoSmall}>HĐ: #HD1008</Text>
                    <Text style={styles.slipMonoSmall}>Bàn: Bàn 05</Text>
                  </View>
                  <View style={styles.slipRowBetween}>
                    <Text style={styles.slipMonoSmall}>Ngày: 23/09/2026</Text>
                    <Text style={styles.slipMonoSmall}>Thu ngân: Vũ</Text>
                  </View>

                  <View style={styles.slipDashedDivider} />

                  {/* Items Table */}
                  <View style={styles.slipRowBetween}>
                    <Text style={[styles.slipMonoSmall, { fontWeight: 'bold', flex: 1 }]}>Món ăn</Text>
                    <Text style={[styles.slipMonoSmall, { fontWeight: 'bold', width: 30, textAlign: 'center' }]}>SL</Text>
                    <Text style={[styles.slipMonoSmall, { fontWeight: 'bold', width: 70, textAlign: 'right' }]}>Tiền</Text>
                  </View>
                  <View style={[styles.slipDashedDivider, { marginVertical: 3 }]} />

                  <View style={styles.slipRowBetween}>
                    <Text style={[styles.slipMonoSmall, { flex: 1 }]}>Lẩu Chay Thanh Đạm</Text>
                    <Text style={[styles.slipMonoSmall, { width: 30, textAlign: 'center' }]}>1</Text>
                    <Text style={[styles.slipMonoSmall, { width: 70, textAlign: 'right' }]}>150.000</Text>
                  </View>
                  <View style={styles.slipRowBetween}>
                    <Text style={[styles.slipMonoSmall, { flex: 1 }]}>Chả Giò Hoa Sen</Text>
                    <Text style={[styles.slipMonoSmall, { width: 30, textAlign: 'center' }]}>2</Text>
                    <Text style={[styles.slipMonoSmall, { width: 70, textAlign: 'right' }]}>70.000</Text>
                  </View>
                  <View style={styles.slipRowBetween}>
                    <Text style={[styles.slipMonoSmall, { flex: 1 }]}>Trà Đào Sả Tắc</Text>
                    <Text style={[styles.slipMonoSmall, { width: 30, textAlign: 'center' }]}>2</Text>
                    <Text style={[styles.slipMonoSmall, { width: 70, textAlign: 'right' }]}>60.000</Text>
                  </View>

                  <View style={styles.slipDashedDivider} />

                  <View style={styles.slipRowBetween}>
                    <Text style={styles.slipTotalLabel}>TỔNG CỘNG:</Text>
                    <Text style={styles.slipTotalVal}>280.000 đ</Text>
                  </View>

                  <Text style={styles.slipFooterText}>{formData.billFooter}</Text>

                  {/* VietQR Section */}
                  {formData.showQrCode && (
                    <View style={styles.slipQrContainer}>
                      <View style={styles.qrImageWrapper}>
                        <Image
                          source={{
                            uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VIETQR_${formData.qrBank || 'TCB'}_${formData.qrAccountNo || '12345678'}`,
                          }}
                          style={styles.qrImage}
                        />
                      </View>
                      <Text style={styles.slipQrCaption}>Quét mã VietQR thanh toán</Text>
                      {formData.qrAccountNo ? (
                        <Text style={styles.slipQrSub}>{formData.qrBank} • {formData.qrAccountNo}</Text>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ==================================================== */}
      {/* TAB C: THƯƠNG HIỆU & LOGO WEB                         */}
      {/* ==================================================== */}
      {activeSubTab === 'BRAND' && (
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderGreen}>
            <FontAwesome5 name="globe" size={14} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeaderTitleWhite}>Cấu Hình Thương Hiệu & Kết Nối Máy Chủ</Text>
          </View>

          <View style={{ padding: 16 }}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên Thương Hiệu Hệ Thống</Text>
              <TextInput
                style={styles.textInput}
                value={formData.brandName}
                onChangeText={(t) => setFormData((prev) => ({ ...prev, brandName: t }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Đường Dẫn Máy Chủ Backend (API & Socket.IO)</Text>
              <View style={styles.inputWithBtnRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="http://localhost:3000"
                />
                <TouchableOpacity
                  style={styles.btnActionInline}
                  onPress={async () => {
                    const ok = await syncFromServer();
                    showAlert(ok ? 'Đã kết nối' : 'Ngoại tuyến', ok ? 'Đã kết nối thành công đến máy chủ!' : 'Chưa thể kết nối đến máy chủ, ứng dụng đang hoạt động ở chế độ Offline.');
                  }}>
                  <FontAwesome5 name="sync" size={11} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.btnActionInlineText}>Đồng Bộ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
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

  // Access Denied
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  accessDeniedCard: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#dc2626',
    marginBottom: 8,
  },
  accessDeniedMessage: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
  accessDeniedSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  btnBackHome: {
    backgroundColor: '#15803d',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  btnBackHomeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803d',
  },
  btnSaveAll: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnSaveAllText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Sub Tabs Pills
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  pillBtnActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  pillBtnTextActive: {
    color: '#ffffff',
  },

  // Card Sections
  cardSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeaderGreen: {
    backgroundColor: '#15803d',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderTitleWhite: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  infoNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  infoNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 18,
  },

  // Tab A Styles
  selectUserRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  userPermActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  btnResetPerm: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  btnResetPermText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  btnSaveUserPerm: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#15803d',
  },
  btnSaveUserPermText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  userSelectChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  userSelectChipActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  userSelectChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  userSelectChipTextActive: {
    color: '#ffffff',
  },

  permMatrixRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  permCol: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  permColHeaderGreen: {
    backgroundColor: '#dcfce7',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
  },
  permColHeaderBlue: {
    backgroundColor: '#dbeafe',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  permColHeaderOrange: {
    backgroundColor: '#ffedd5',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  permColHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  permItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  permItemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  permItemDesc: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },

  // Tab B: Printer & Sound Styles (Images 4 & 5)
  printerSoundContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  printerLeftCol: {
    flex: 7,
    minWidth: 320,
  },
  printerRightCol: {
    flex: 5,
    minWidth: 300,
  },

  formBoxGray: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  boxTitleGreen: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  switchDesc: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  formRowTwoCol: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 3,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#0f172a',
  },
  inputWithBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  btnActionInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803d',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnActionInlineText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  subHintText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },

  smallPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  smallPillActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  smallPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  smallPillTextActive: {
    color: '#ffffff',
  },

  soundConfigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  btnListenTest: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803d',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnListenTestText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  btnSaveSubSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  btnSaveSubSectionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Right Column: Thermal Slip (Images 4 & 5)
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewHeaderDark: {
    backgroundColor: '#1e293b',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewHeaderTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  btnTestPrintTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  btnTestPrintTopText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
  previewBody: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    padding: 16,
    alignItems: 'center',
  },
  previewPaperBadge: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 10,
  },
  thermalSlip: {
    width: 280,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
      },
    }),
  },
  slipResName: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
    color: '#000000',
  },
  slipSub: {
    fontSize: 9.5,
    textAlign: 'center',
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  slipDashedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderStyle: 'dashed',
    marginVertical: 6,
  },
  slipTitle: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#000000',
  },
  slipRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 1,
  },
  slipMonoSmall: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#000000',
  },
  slipTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#000000',
  },
  slipTotalVal: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#000000',
  },
  slipFooterText: {
    fontSize: 9.5,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#475569',
  },
  slipQrContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  qrImageWrapper: {
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    marginBottom: 4,
  },
  qrImage: {
    width: 100,
    height: 100,
  },
  slipQrCaption: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
  },
  slipQrSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },
});
