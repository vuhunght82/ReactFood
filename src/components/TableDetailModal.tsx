import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { DiningTable, Order } from '@/types';
import { LotusTheme, formatVND } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';

interface TableDetailModalProps {
  table: DiningTable | null;
  visible: boolean;
  onClose: () => void;
  onPay: (table: DiningTable) => void;
}

export const TableDetailModal: React.FC<TableDetailModalProps> = ({
  table,
  visible,
  onClose,
  onPay,
}) => {
  const router = useRouter();
  const {
    tables,
    orders,
    selectTable,
    updateTableGuests,
    transferTable,
    clearTable,
  } = useApp();

  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [selectedTargetTableId, setSelectedTargetTableId] = useState<number | null>(null);

  if (!table) return null;

  const currentOrder: Order | undefined = orders.find(
    (o) => o.Order_id === table.Current_order_id || o.Order_code === table.Current_order_code
  );

  const emptyTables = tables.filter(
    (t) => t.Table_id !== table.Table_id && t.Status === 'EMPTY'
  );

  const handleOrderMore = () => {
    selectTable(table);
    onClose();
    router.push('/(tabs)/menu' as any);
  };

  const handleTransferConfirm = () => {
    if (selectedTargetTableId) {
      transferTable(table.Table_id, selectedTargetTableId);
      setIsTransferring(false);
      onClose();
    }
  };

  const isServing = table.Status === 'SERVING' || (table.Current_amount || 0) > 0;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={[styles.modalHeader, isServing ? styles.headerServing : styles.headerEmpty]}>
            <View>
              <Text style={styles.tableTitle}>
                {table.Table_name} ({table.Table_code})
              </Text>
              <Text style={styles.tableSubtitle}>
                Khu vực: {table.Area} • Sức chứa: {table.Capacity} ghế
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <FontAwesome5 name="times" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Status & Guest Counter Stepper */}
            <View style={styles.statusRow}>
              <View style={styles.statusTagContainer}>
                <Text style={styles.statusLabel}>Trạng thái:</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isServing ? '#fee2e2' : '#dcfce7' },
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: isServing ? LotusTheme.danger : LotusTheme.success },
                    ]}>
                    {isServing ? 'ĐANG DÙNG BỮA' : 'BÀN TRỐNG'}
                  </Text>
                </View>
              </View>

              {/* Guest Stepper */}
              <View style={styles.stepperContainer}>
                <Text style={styles.stepperLabel}>Số khách:</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => updateTableGuests(table.Table_id, -1)}>
                    <FontAwesome5 name="minus" size={12} color="#166534" />
                  </TouchableOpacity>
                  <Text style={styles.stepCount}>{table.Current_guests || 0}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => updateTableGuests(table.Table_id, 1)}>
                    <FontAwesome5 name="plus" size={12} color="#166534" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Active Order Details */}
            {isServing ? (
              <View style={styles.orderSection}>
                <View style={styles.orderHeaderRow}>
                  <Text style={styles.orderHeaderTitle}>
                    Đơn: {table.Current_order_code || 'CHAY-...'}{' '}
                  </Text>
                  <Text style={styles.orderHeaderAmount}>
                    {formatVND(table.Current_amount || currentOrder?.Total_amount || 0)}
                  </Text>
                </View>

                {currentOrder?.items && currentOrder.items.length > 0 ? (
                  <View style={styles.itemsList}>
                    {currentOrder.items.map((it, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>
                            {it.Quantity}x {it.Item_name}
                          </Text>
                          {it.Note ? <Text style={styles.itemNote}>Ghi chú: {it.Note}</Text> : null}
                        </View>
                        <Text style={styles.itemPrice}>
                          {formatVND(it.Price * it.Quantity)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyItemsText}>
                    Bàn đã được mở và ghi nhận khách ngồi.
                  </Text>
                )}
              </View>
            ) : null}

            {/* Transfer table selector */}
            {isTransferring ? (
              <View style={styles.transferSection}>
                <Text style={styles.transferTitle}>Chọn bàn trống để chuyển:</Text>
                <View style={styles.transferChipsRow}>
                  {emptyTables.map((et) => (
                    <TouchableOpacity
                      key={et.Table_id}
                      style={[
                        styles.transferChip,
                        selectedTargetTableId === et.Table_id && styles.transferChipActive,
                      ]}
                      onPress={() => setSelectedTargetTableId(et.Table_id)}>
                      <Text
                        style={[
                          styles.transferChipText,
                          selectedTargetTableId === et.Table_id && styles.transferChipTextActive,
                        ]}>
                        {et.Table_name} ({et.Area})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.transferActionRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setIsTransferring(false)}>
                    <Text style={styles.cancelBtnText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmTransferBtn,
                      !selectedTargetTableId && { opacity: 0.5 },
                    ]}
                    disabled={!selectedTargetTableId}
                    onPress={handleTransferConfirm}>
                    <Text style={styles.confirmTransferBtnText}>Xác nhận chuyển bàn</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Action Buttons Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.orderBtn}
              onPress={handleOrderMore}
              activeOpacity={0.85}>
              <FontAwesome5 name="utensils" size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.orderBtnText}>
                {isServing ? 'GỌI THÊM MÓN' : 'MỞ BÀN & CHỌN MÓN'}
              </Text>
            </TouchableOpacity>

            {isServing ? (
              <>
                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={() => {
                    onClose();
                    onPay(table);
                  }}
                  activeOpacity={0.85}>
                  <FontAwesome5 name="receipt" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.payBtnText}>THANH TOÁN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moreActionBtn}
                  onPress={() => setIsTransferring(!isTransferring)}
                  activeOpacity={0.85}>
                  <FontAwesome5 name="exchange-alt" size={14} color="#0369a1" />
                  <Text style={styles.moreActionText}>Đổi bàn</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    clearTable(table.Table_id);
                    onClose();
                  }}
                  activeOpacity={0.85}>
                  <FontAwesome5 name="trash-alt" size={14} color="#b91c1c" />
                  <Text style={styles.clearBtnText}>Trả bàn</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerServing: {
    backgroundColor: '#b91c1c',
  },
  headerEmpty: {
    backgroundColor: LotusTheme.primary,
  },
  tableTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  tableSubtitle: {
    color: '#e2e8f0',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  modalBody: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statusTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    paddingHorizontal: 4,
  },
  stepBtn: {
    padding: 6,
  },
  stepCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
    paddingHorizontal: 8,
  },
  orderSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  orderHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  orderHeaderAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: LotusTheme.danger,
  },
  itemsList: {
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  itemNote: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyItemsText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  transferSection: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  transferTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 8,
  },
  transferChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  transferChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#7dd3fc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transferChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  transferChipText: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '600',
  },
  transferChipTextActive: {
    color: '#ffffff',
  },
  transferActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#64748b',
  },
  confirmTransferBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  confirmTransferBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  orderBtn: {
    flex: 1,
    minWidth: 140,
    backgroundColor: LotusTheme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  orderBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  payBtn: {
    flex: 1,
    minWidth: 120,
    backgroundColor: LotusTheme.accentDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  moreActionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreActionText: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '700',
  },
  clearBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 11,
    color: '#b91c1c',
    fontWeight: '700',
  },
});
