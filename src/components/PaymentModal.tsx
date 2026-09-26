import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { DiningTable, Order } from '@/types';
import { LotusTheme, formatVND } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

interface PaymentModalProps {
  table?: DiningTable | null;
  order?: Order | null;
  visible: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  table,
  order,
  visible,
  onClose,
}) => {
  const { payTableOrder, orders, updateOrderStatus } = useApp();
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CARD'>('TRANSFER');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const activeOrder =
    order ||
    (table
      ? orders.find(
          (o) =>
            o.Order_id === table.Current_order_id ||
            o.Order_code === table.Current_order_code
        )
      : null);

  const totalAmount = activeOrder
    ? activeOrder.Final_amount || activeOrder.Total_amount
    : table?.Current_amount || 0;

  const handleConfirmPayment = () => {
    if (table) {
      payTableOrder(table.Table_id, paymentMethod === 'TRANSFER' ? 'TRANSFER' : 'CASH');
    } else if (order) {
      updateOrderStatus(order.Order_id, 'COMPLETED');
    }
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.headerTitle}>HÓA ĐƠN THANH TOÁN</Text>
              <Text style={styles.headerSub}>
                {table ? `${table.Table_name} (${table.Area})` : activeOrder?.Customer_name || 'Đơn hàng'}
                {activeOrder ? ` • Mã: ${activeOrder.Order_code}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <FontAwesome5 name="times" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {isSuccess ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <FontAwesome5 name="check" size={32} color="#ffffff" />
              </View>
              <Text style={styles.successTitle}>Thanh Toán Thành Công!</Text>
              <Text style={styles.successSub}>
                Đã thu: {formatVND(totalAmount)}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.modalBody}>
              {/* Receipt Items Preview */}
              <View style={styles.billBox}>
                <Text style={styles.billTitle}>Chi tiết dịch vụ:</Text>
                {activeOrder?.items && activeOrder.items.length > 0 ? (
                  activeOrder.items.map((it, idx) => (
                    <View key={idx} style={styles.billRow}>
                      <Text style={styles.billItemName} numberOfLines={1}>
                        {it.Quantity}x {it.Item_name}
                      </Text>
                      <Text style={styles.billItemPrice}>
                        {formatVND(it.Price * it.Quantity)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.billRow}>
                    <Text style={styles.billItemName}>Dịch vụ ẩm thực bàn</Text>
                    <Text style={styles.billItemPrice}>{formatVND(totalAmount)}</Text>
                  </View>
                )}

                <View style={styles.billDivider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TỔNG CỘNG:</Text>
                  <Text style={styles.totalAmount}>{formatVND(totalAmount)}</Text>
                </View>
              </View>

              {/* Payment Methods */}
              <Text style={styles.methodTitle}>Chọn phương thức thanh toán:</Text>
              <View style={styles.methodsRow}>
                <TouchableOpacity
                  style={[
                    styles.methodBtn,
                    paymentMethod === 'TRANSFER' && styles.methodBtnActive,
                  ]}
                  onPress={() => setPaymentMethod('TRANSFER')}>
                  <FontAwesome5
                    name="qrcode"
                    size={18}
                    color={paymentMethod === 'TRANSFER' ? '#ffffff' : '#0284c7'}
                  />
                  <Text
                    style={[
                      styles.methodBtnText,
                      paymentMethod === 'TRANSFER' && styles.methodBtnTextActive,
                    ]}>
                    Chuyển Khoản QR
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodBtn,
                    paymentMethod === 'CASH' && styles.methodBtnActive,
                  ]}
                  onPress={() => setPaymentMethod('CASH')}>
                  <FontAwesome5
                    name="money-bill-wave"
                    size={18}
                    color={paymentMethod === 'CASH' ? '#ffffff' : '#16a34a'}
                  />
                  <Text
                    style={[
                      styles.methodBtnText,
                      paymentMethod === 'CASH' && styles.methodBtnTextActive,
                    ]}>
                    Tiền Mặt
                  </Text>
                </TouchableOpacity>
              </View>

              {/* VietQR View */}
              {paymentMethod === 'TRANSFER' ? (
                <View style={styles.qrContainer}>
                  <Image
                    source={require('@/assets/images/qrcode_acb.png')}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.bankName}>Ngân hàng TMCP Á Châu (ACB)</Text>
                  <Text style={styles.bankAcc}>STK: 12345678 • HOA SEN RESTAURANT</Text>
                  <Text style={styles.qrHint}>
                    Quét mã VietQR trên bất kỳ ứng dụng ngân hàng nào
                  </Text>
                </View>
              ) : (
                <View style={styles.cashNoticeBox}>
                  <FontAwesome5 name="hand-holding-usd" size={28} color="#16a34a" />
                  <Text style={styles.cashNoticeText}>
                    Thu ngân nhận tiền mặt trực tiếp từ khách: {formatVND(totalAmount)}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer */}
          {!isSuccess ? (
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmPayment}
                activeOpacity={0.85}>
                <FontAwesome5 name="check-circle" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.confirmBtnText}>XÁC NHẬN THANH TOÁN</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: LotusTheme.primaryDark,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: LotusTheme.accent,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: '#86efac',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 16,
    maxHeight: 460,
  },
  billBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  billTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  billItemName: {
    fontSize: 13,
    color: '#1e293b',
    flex: 1,
  },
  billItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: LotusTheme.danger,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  methodBtnActive: {
    backgroundColor: LotusTheme.primary,
    borderColor: LotusTheme.primary,
  },
  methodBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  methodBtnTextActive: {
    color: '#ffffff',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 14,
  },
  qrImage: {
    width: 140,
    height: 140,
    marginBottom: 8,
  },
  bankName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  bankAcc: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2,
    fontWeight: '600',
  },
  qrHint: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  cashNoticeBox: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 20,
    gap: 8,
  },
  cashNoticeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    textAlign: 'center',
  },
  successContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: LotusTheme.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: LotusTheme.primaryDark,
  },
  successSub: {
    fontSize: 15,
    fontWeight: '700',
    color: LotusTheme.success,
    marginTop: 6,
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  confirmBtn: {
    backgroundColor: LotusTheme.success,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
