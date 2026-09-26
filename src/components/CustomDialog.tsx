import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LotusTheme } from '@/constants/theme';

export interface DialogOptions {
  visible: boolean;
  type?: 'danger' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface CustomDialogProps {
  dialog: DialogOptions;
  onClose: () => void;
}

export const CustomDialog: React.FC<CustomDialogProps> = ({ dialog, onClose }) => {
  if (!dialog.visible) return null;

  const isConfirm = dialog.isConfirm ?? Boolean(dialog.onConfirm && dialog.cancelText);
  const type = dialog.type || 'warning';

  const getIcon = () => {
    switch (type) {
      case 'danger':
      case 'warning':
        return {
          name: 'exclamation-triangle',
          color: '#dc2626',
          bg: '#fee2e2',
        };
      case 'success':
        return {
          name: 'check-circle',
          color: '#16a34a',
          bg: '#dcfce7',
        };
      case 'info':
      default:
        return {
          name: 'info-circle',
          color: '#0284c7',
          bg: '#e0f2fe',
        };
    }
  };

  const iconInfo = getIcon();

  const handleConfirm = () => {
    if (dialog.onConfirm) {
      dialog.onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (dialog.onCancel) {
      dialog.onCancel();
    }
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={dialog.visible}
      onRequestClose={handleCancel}>
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Icon and Content Row */}
          <View style={styles.contentRow}>
            <View style={[styles.iconWrapper, { backgroundColor: iconInfo.bg }]}>
              <FontAwesome5 name={iconInfo.name} size={22} color={iconInfo.color} />
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.titleText}>{dialog.title}</Text>
              <Text style={styles.messageText}>{dialog.message}</Text>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.buttonsRow}>
            {isConfirm && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>{dialog.cancelText || 'Hủy'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                type === 'danger' || type === 'warning' ? styles.confirmBtnDanger : styles.confirmBtnSuccess,
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>{dialog.confirmText || (isConfirm ? 'Đồng ý' : 'Đóng')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 99999,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
  },
  messageText: {
    fontSize: 13.5,
    color: '#64748b',
    lineHeight: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 8,
  },
  confirmBtnDanger: {
    backgroundColor: '#dc2626', // Matching red button in Image 2
  },
  confirmBtnSuccess: {
    backgroundColor: LotusTheme.primary,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
