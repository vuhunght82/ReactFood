import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MenuItem, Topping } from '@/types';
import { formatVND } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

interface DishOptionsModalProps {
  dish: MenuItem | null;
  visible: boolean;
  onClose: () => void;
}

export const DishOptionsModal: React.FC<DishOptionsModalProps> = ({
  dish,
  visible,
  onClose,
}) => {
  const { addToCart } = useApp();
  const [qty, setQty] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);

  if (!dish) return null;

  // Parse toppings from dish if available
  let availableToppings: Topping[] = [];
  try {
    if (Array.isArray(dish.Toppings)) {
      availableToppings = dish.Toppings;
    } else if (typeof dish.Toppings === 'string') {
      availableToppings = JSON.parse(dish.Toppings);
    }
  } catch {}

  // Fallback sample toppings for delicious vegetarian options if dish has none
  if (availableToppings.length === 0) {
    availableToppings = [
      { name: 'Thêm Đậu Hũ Chiên Giòn', price: 10000 },
      { name: 'Thêm Nấm Đông Cô / Nấm Rơm', price: 15000 },
      { name: 'Thêm Chả Lụa Chay', price: 10000 },
    ];
  }

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => t.name === topping.name);
      if (exists) {
        return prev.filter((t) => t.name !== topping.name);
      }
      return [...prev, topping];
    });
  };

  const toppingsPrice = selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0);
  const unitPrice = dish.Base_price + toppingsPrice;
  const totalPrice = unitPrice * qty;

  const handleConfirmAddToCart = () => {
    addToCart(dish, qty, note.trim(), selectedToppings);
    setQty(1);
    setNote('');
    setSelectedToppings([]);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <FontAwesome5 name="utensils" size={14} color="#ffffff" />
              <Text style={styles.headerTitle}>Tùy Chọn Món</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <FontAwesome5 name="times" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.cardBody}>
            {/* Dish Info Card */}
            <View style={styles.dishPreviewRow}>
              <Image
                source={{ uri: dish.Image_url }}
                style={styles.dishThumb as any}
                defaultSource={require('@/assets/images/dish-sample.jpg')}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.dishName}>{dish.Item_name}</Text>
                <Text style={styles.dishPrice}>{formatVND(dish.Base_price)}</Text>
              </View>
            </View>

            {/* Toppings Selection */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>
                <FontAwesome5 name="layer-group" size={12} color="#2e7d32" /> Chọn Topping thêm (tùy chọn):
              </Text>
              <View style={styles.toppingsList}>
                {availableToppings.map((top, idx) => {
                  const isChecked = selectedToppings.some((t) => t.name === top.name);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.toppingItem, isChecked && styles.toppingItemChecked]}
                      onPress={() => toggleTopping(top)}>
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked ? <FontAwesome5 name="check" size={10} color="#ffffff" /> : null}
                      </View>
                      <Text style={styles.toppingName}>{top.name}</Text>
                      <Text style={styles.toppingPrice}>+{formatVND(top.price)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Note input */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>
                <FontAwesome5 name="comment-dots" size={12} color="#666666" /> Ghi chú riêng cho món này:
              </Text>
              <TextInput
                style={styles.noteInput}
                placeholder="VD: Ít cay, không đường, nhiều rau..."
                placeholderTextColor="#999999"
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Quantity Stepper & Total */}
            <View style={styles.totalRow}>
              <View style={styles.qtyContainer}>
                <Text style={styles.qtyLabel}>Số lượng:</Text>
                <View style={styles.stepperBox}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setQty(Math.max(1, qty - 1))}>
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepVal}>{qty}</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setQty(qty + 1)}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.totalHint}>Thành tiền:</Text>
                <Text style={styles.totalPriceText}>{formatVND(totalPrice)}</Text>
              </View>
            </View>

            {/* Confirm Add Button */}
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmAddToCart}
              activeOpacity={0.85}>
              <FontAwesome5 name="cart-plus" size={15} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText}>Thêm Vào Giỏ Hàng</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#2e7d32', // bg-success
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  cardBody: {
    padding: 16,
    maxHeight: 500,
  },
  dishPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    gap: 12,
    marginBottom: 14,
  },
  dishThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  dishName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2e7d32',
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 6,
  },
  toppingsList: {
    gap: 6,
  },
  toppingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toppingItemChecked: {
    borderColor: '#2e7d32',
    backgroundColor: '#f0fdf4',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  toppingName: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  toppingPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginBottom: 14,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f1f5f9',
  },
  stepBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  stepVal: {
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalHint: {
    fontSize: 11,
    color: '#64748b',
  },
  totalPriceText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2e7d32',
  },
  confirmBtn: {
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
