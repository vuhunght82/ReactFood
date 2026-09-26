import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LotusTheme } from '@/constants/theme';

interface TableDiagramProps {
  capacity: number;
  currentGuests: number;
  isOccupied: boolean;
  tableName: string;
  isMini?: boolean;
  onChairPress?: (seatNum: number) => void;
}

export const TableDiagram: React.FC<TableDiagramProps> = ({
  capacity,
  currentGuests,
  isOccupied,
  tableName,
  isMini = false,
  onChairPress,
}) => {
  const cap = Math.max(1, capacity || 4);
  const guests = Math.max(0, currentGuests || 0);

  // Determine top, bottom, left, right chairs
  let top = 0;
  let bottom = 0;
  let left = 0;
  let right = 0;

  if (cap === 1) {
    top = 1;
  } else if (cap === 2) {
    top = 1;
    bottom = 1;
  } else if (cap === 3) {
    top = 1;
    bottom = 1;
    left = 1;
  } else if (cap === 4) {
    top = 2;
    bottom = 2;
  } else if (cap === 5) {
    top = 2;
    bottom = 2;
    left = 1;
  } else {
    left = 1;
    right = 1;
    const remaining = cap - 2;
    top = Math.ceil(remaining / 2);
    bottom = Math.floor(remaining / 2);
  }

  let seatTracker = 0;

  const renderChair = (orient: 'H' | 'V') => {
    seatTracker++;
    const seatNum = seatTracker;
    const isSeatOccupied = isOccupied && seatNum <= guests;

    const chairWidth = orient === 'H' ? (isMini ? 18 : 24) : isMini ? 10 : 13;
    const chairHeight = orient === 'H' ? (isMini ? 10 : 13) : isMini ? 18 : 24;

    return (
      <TouchableOpacity
        key={seatNum}
        activeOpacity={onChairPress ? 0.7 : 1}
        onPress={() => onChairPress && onChairPress(seatNum)}
        style={[
          styles.chairBase,
          {
            width: chairWidth,
            height: chairHeight,
            backgroundColor: isSeatOccupied
              ? '#f59e0b'
              : isOccupied
              ? '#f8fafc'
              : '#ecfdf5',
            borderColor: isSeatOccupied
              ? '#b45309'
              : isOccupied
              ? '#94a3b8'
              : '#10b981',
          },
        ]}>
        {isSeatOccupied && (
          <View style={styles.occupiedDot} />
        )}
      </TouchableOpacity>
    );
  };

  const topChairs = Array.from({ length: top }).map(() => renderChair('H'));
  const leftChairs = Array.from({ length: left }).map(() => renderChair('V'));
  const rightChairs = Array.from({ length: right }).map(() => renderChair('V'));
  const bottomChairs = Array.from({ length: bottom }).map(() => renderChair('H'));

  return (
    <View style={[styles.container, isMini && styles.containerMini]}>
      {/* Top Chairs Row */}
      {top > 0 && <View style={styles.topRow}>{topChairs}</View>}

      {/* Middle Row: Left chairs, Table Surface, Right chairs */}
      <View style={styles.middleRow}>
        {left > 0 ? <View style={styles.sideCol}>{leftChairs}</View> : <View style={styles.sideSpacer} />}

        {/* Table Surface */}
        <View
          style={[
            styles.tableSurface,
            isMini ? styles.tableSurfaceMini : styles.tableSurfaceNormal,
            isOccupied ? styles.tableOccupied : styles.tableEmpty,
          ]}>
          <Text
            style={[
              styles.tableNameText,
              isMini && styles.tableNameTextMini,
              { color: isOccupied ? '#92400e' : '#065f46' },
            ]}
            numberOfLines={1}>
            {tableName}
          </Text>
          <Text
            style={[
              styles.tableSubText,
              isMini && styles.tableSubTextMini,
              { color: isOccupied ? '#b45309' : '#047857' },
            ]}>
            {isOccupied ? `${guests}/${cap} khách` : `${cap} ghế`}
          </Text>
        </View>

        {right > 0 ? <View style={styles.sideCol}>{rightChairs}</View> : <View style={styles.sideSpacer} />}
      </View>

      {/* Bottom Chairs Row */}
      {bottom > 0 && <View style={styles.bottomRow}>{bottomChairs}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  containerMini: {
    paddingVertical: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  sideCol: {
    justifyContent: 'center',
    gap: 6,
  },
  sideSpacer: {
    width: 6,
  },
  chairBase: {
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  occupiedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  tableSurface: {
    borderRadius: 10,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableSurfaceNormal: {
    minWidth: 100,
    minHeight: 52,
  },
  tableSurfaceMini: {
    minWidth: 70,
    minHeight: 38,
    paddingVertical: 4,
  },
  tableEmpty: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  tableOccupied: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  tableNameText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tableNameTextMini: {
    fontSize: 10,
  },
  tableSubText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  tableSubTextMini: {
    fontSize: 8.5,
  },
});
