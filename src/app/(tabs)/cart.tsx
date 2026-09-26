import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { formatVND } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const router = useRouter();
  const {
    cart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartTotalAmount,
    cartTotalCount,
    tables,
    selectedTable,
    selectTable,
    cartOrderType,
    setCartOrderType,
    cartTableNumber,
    setCartTableNumber,
    cartCustomerName,
    setCartCustomerName,
    cartPaymentMethod,
    setCartPaymentMethod,
    cartCashPaidImmediate,
    setCartCashPaidImmediate,
    cartNote,
    setCartNote,
    submitOrder,
  } = useApp();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleSubmit = async () => {
    if (cart.length === 0) {
      if (Platform.OS === 'web') alert('Giỏ hàng đang trống!');
      else Alert.alert('Thông báo', 'Giỏ hàng đang trống!');
      return;
    }

    if (cartOrderType === 'DINE_IN' && !cartTableNumber.trim() && !selectedTable) {
      if (Platform.OS === 'web') alert('Vui lòng chọn hoặc nhập số bàn ăn tại quán!');
      else Alert.alert('Thông báo', 'Vui lòng chọn hoặc nhập số bàn ăn tại quán!');
      return;
    }

    setIsSubmitting(true);
    const res = await submitOrder();
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Đã gửi đơn xuống bếp thành công!');
      setTimeout(() => {
        setSuccessMsg('');
        router.push('/kitchen' as any);
      }, 1200);
    }
  };

  const handlePrintTempBill = () => {
    if (cart.length === 0) {
      if (Platform.OS === 'web') alert('Giỏ hàng trống!');
      else Alert.alert('Thông báo', 'Giỏ hàng trống!');
      return;
    }
    const msg = `--- HÓA ĐƠN TẠM TÍNH ---\nNhà Hàng Chay Hoa Sen\n${cartOrderType === 'DINE_IN' ? `Bàn: ${cartTableNumber || selectedTable?.Table_code}` : 'Mang Về / Giao Hàng'}\nSố món: ${cartTotalCount}\nTổng cộng: ${formatVND(cartTotalAmount)}`;
    if (Platform.OS === 'web') alert(msg);
    else Alert.alert('In Tạm Tính', msg);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {successMsg ? (
        <View style={styles.alertSuccess}>
          <FontAwesome5 name="check-circle" size={16} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.alertSuccessText}>{successMsg}</Text>
        </View>
      ) : null}

      {/* Main Cart Form Card Centered */}
      <View style={styles.cartCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <FontAwesome5 name="cart-shopping" size={16} color="#2e7d32" />
            <Text style={styles.cardTitle}>Giỏ Hàng & Thanh Toán</Text>
          </View>
          <View style={styles.headerBtnGroup}>
            <TouchableOpacity style={styles.btnOutlineDark} onPress={handlePrintTempBill}>
              <FontAwesome5 name="print" size={11} color="#333333" style={{ marginRight: 4 }} />
              <Text style={styles.btnOutlineDarkText}>In Tạm Tính</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutlineDanger} onPress={clearCart}>
              <FontAwesome5 name="trash" size={11} color="#d32f2f" style={{ marginRight: 4 }} />
              <Text style={styles.btnOutlineDangerText}>Xóa giỏ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardBody}>
          {/* Order Type & Table Number Row */}
          <View style={styles.formGrid}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Loại đơn:</Text>
              <View style={styles.orderTypeRow}>
                {[
                  { id: 'DINE_IN', label: 'Ăn tại bàn' },
                  { id: 'TAKE_AWAY', label: 'Mang về' },
                  { id: 'DELIVERY', label: 'Giao hàng' },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typePill, cartOrderType === t.id && styles.typePillActive]}
                    onPress={() => setCartOrderType(t.id as any)}>
                    <Text style={[styles.typePillText, cartOrderType === t.id && styles.typePillTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {cartOrderType === 'DINE_IN' ? (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Số bàn / Bàn phục vụ:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {tables.map((tbl) => {
                    const isSelected =
                      cartTableNumber.toUpperCase() === tbl.Table_code.toUpperCase() ||
                      selectedTable?.Table_id === tbl.Table_id;
                    return (
                      <TouchableOpacity
                        key={tbl.Table_id}
                        style={[styles.tblChip, isSelected && styles.tblChipSelected]}
                        onPress={() => {
                          selectTable(tbl);
                          setCartTableNumber(tbl.Table_code);
                        }}>
                        <Text style={[styles.tblChipText, isSelected && styles.tblChipTextSelected]}>
                          {tbl.Table_code}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}
          </View>

          {/* Customer Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tên khách hàng / Mã Shipper:</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Khách vãng lai / Anh Nam"
              value={cartCustomerName}
              onChangeText={setCartCustomerName}
            />
          </View>

          {/* Cart Table of Items */}
          <View style={styles.tableBox}>
            <View style={styles.thRow}>
              <Text style={[styles.th, { flex: 1 }]}>Món</Text>
              <Text style={[styles.th, { width: 80, textAlign: 'center' }]}>SL</Text>
              <Text style={[styles.th, { width: 100, textAlign: 'right' }]}>Tiền</Text>
              <Text style={[styles.th, { width: 36, textAlign: 'center' }]}>#</Text>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>Giỏ hàng đang trống.</Text>
              </View>
            ) : (
              cart.map((ci, idx) => {
                const toppingTotal = (ci.selectedToppings || []).reduce((ts, t) => ts + t.price, 0);
                const lineTotal = (ci.item.Base_price + toppingTotal) * ci.quantity;

                return (
                  <View key={idx} style={styles.trRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tdItemName}>{ci.item.Item_name}</Text>
                      {ci.selectedToppings && ci.selectedToppings.length > 0 ? (
                        <Text style={styles.tdToppings}>
                          + {ci.selectedToppings.map((t) => t.name).join(', ')}
                        </Text>
                      ) : null}
                      {ci.note ? <Text style={styles.tdNote}>Ghi chú: {ci.note}</Text> : null}
                    </View>

                    {/* Quantity controls */}
                    <View style={[styles.stepperWrap, { width: 80 }]}>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => updateCartQty(idx, -1)}>
                        <Text style={styles.stepBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepNum}>{ci.quantity}</Text>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => updateCartQty(idx, 1)}>
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.tdPrice, { width: 100, textAlign: 'right' }]}>
                      {formatVND(lineTotal)}
                    </Text>

                    <TouchableOpacity style={{ width: 36, alignItems: 'center' }} onPress={() => removeFromCart(idx)}>
                      <FontAwesome5 name="times" size={13} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          {/* Payment Method Selector (4 options like HTML) */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: '#2e7d32' }]}>
              <FontAwesome5 name="wallet" size={13} color="#2e7d32" style={{ marginRight: 4 }} />
              Chọn Phương Thức Thanh Toán:
            </Text>
            <View style={styles.paymentMethodsGrid}>
              {[
                { id: 'CASH', label: 'Tiền mặt', icon: 'money-bill-wave', color: '#2e7d32' },
                { id: 'BANK_TRANSFER', label: 'Chuyển khoản QR', icon: 'qrcode', color: '#1976d2' },
                { id: 'MOMO', label: 'Ví MoMo', icon: 'mobile-alt', color: '#c2185b' },
                { id: 'CARD', label: 'Thẻ Visa/MC', icon: 'credit-card', color: '#f57c00' },
              ].map((pm) => {
                const isSelected = cartPaymentMethod === pm.id;
                return (
                  <TouchableOpacity
                    key={pm.id}
                    style={[styles.payOptionCard, isSelected && styles.payOptionCardActive]}
                    onPress={() => setCartPaymentMethod(pm.id as any)}>
                    <FontAwesome5 name={pm.icon as any} size={15} color={pm.color} />
                    <Text style={[styles.payOptionText, isSelected && { fontWeight: '800' }]}>
                      {pm.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Thu tiền mặt ngay Switch (KPI feature from HTML) */}
          <View style={styles.kpiCashSwitchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kpiSwitchTitle}>
                <FontAwesome5 name="money-bill-wave" size={12} color="#2e7d32" /> Thu tiền mặt ngay (Đã nhận tiền)
              </Text>
              <Text style={styles.kpiSwitchSub}>
                Ghi nhận đơn đã thu tiền & tính KPI cho nhân viên đang đăng nhập
              </Text>
            </View>
            <Switch
              value={cartCashPaidImmediate}
              onValueChange={setCartCashPaidImmediate}
              trackColor={{ false: '#cbd5e1', true: '#86efac' }}
              thumbColor={cartCashPaidImmediate ? '#2e7d32' : '#f1f5f9'}
            />
          </View>

          {/* Note Input */}
          <View style={[styles.formGroup, { marginTop: 12 }]}>
            <Text style={styles.label}>Ghi chú chung toàn đơn:</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              multiline
              placeholder="VD: Giao nhanh, dọn bàn sạch, không ớt..."
              value={cartNote}
              onChangeText={setCartNote}
            />
          </View>

          {/* Total Amount Row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền thanh toán:</Text>
            <Text style={styles.totalValue}>{formatVND(cartTotalAmount)}</Text>
          </View>

          {/* Bottom Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.btnAddMore}
              onPress={() => router.push('/menu-cards' as any)}>
              <FontAwesome5 name="arrow-left" size={12} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.btnAddMoreText}>Thêm món</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSubmitOrder, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}>
              <FontAwesome5 name="check" size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.btnSubmitOrderText}>
                {isSubmitting ? 'ĐANG GỬI...' : 'GỬI ĐƠN XUỐNG BẾP'}
              </Text>
            </TouchableOpacity>
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
    paddingBottom: 50,
  },
  alertSuccess: {
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  alertSuccessText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  cartCard: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      },
    }),
  },
  cardHeader: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
  },
  headerBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  btnOutlineDark: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnOutlineDarkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
  },
  btnOutlineDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d32f2f',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnOutlineDangerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d32f2f',
  },
  cardBody: {
    padding: 18,
  },
  formGrid: {
    marginBottom: 10,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 6,
  },
  orderTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  typePillActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typePillTextActive: {
    color: '#ffffff',
  },
  tblChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  tblChipSelected: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  tblChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  tblChipTextSelected: {
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#333333',
    backgroundColor: '#ffffff',
  },
  tableBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 14,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b5e20',
  },
  emptyRow: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tdItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
  },
  tdToppings: {
    fontSize: 11,
    color: '#2e7d32',
  },
  tdNote: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#f1f5f9',
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
  },
  stepNum: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  tdPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  payOptionCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  payOptionCardActive: {
    borderColor: '#2e7d32',
    backgroundColor: '#f0fdf4',
  },
  payOptionText: {
    fontSize: 12,
    color: '#333333',
  },
  kpiCashSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 4,
  },
  kpiSwitchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
  },
  kpiSwitchSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    borderStyle: 'dashed',
    paddingTop: 14,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444444',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2e7d32',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnAddMore: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#6c757d',
    paddingVertical: 11,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAddMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  btnSubmitOrder: {
    flex: 2,
    backgroundColor: '#2e7d32',
    paddingVertical: 11,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSubmitOrderText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
