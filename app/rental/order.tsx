import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Animated, PanResponder, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Animated as RNAnimated } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function OrderPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { scheme, fontSize } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);

  const [quantity, setQuantity] = useState(1);
  const [rentalStart, setRentalStart] = useState(new Date());
  const [rentalEnd, setRentalEnd] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [swipeX] = useState(new Animated.Value(0));
  const [swiped, setSwiped] = useState(false);

  const price = Number(params.price) || 0;
  const rentPrice = price;
  const stock = Number(params.stock) || 0;
  const maxQty = Math.max(1, stock);

  const getRentalDays = () => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.ceil((rentalEnd.getTime() - rentalStart.getTime()) / msPerDay);
    return days > 0 ? days : 1;
  };

  let startX = 0;
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
    },
    onPanResponderGrant: (evt: any, gestureState: any) => {
      swipeX.setValue(0);
      startX = gestureState.x0;
    },
    onPanResponderMove: (evt: any, gestureState: any) => {
      const dx = Math.max(0, Math.min(gestureState.moveX - startX, 260 - 64));
      swipeX.setValue(dx);
      if (dx >= 260 - 64 - 2 && stock > 0 && !swiped) {
        handleSwipe();
      }
    },
    onPanResponderRelease: (_: any, gestureState: any) => {
      if (!swiped) {
        const swipeDistance = gestureState.moveX - startX;
        const threshold = 260 - 64 - 10;
        if (swipeDistance >= threshold && stock > 0) {
          handleSwipe();
        } else {
          Animated.spring(swipeX, { toValue: 0, useNativeDriver: false }).start();
        }
      }
    },
  });

  function handleSwipe() {
    setSwiped(true);
    setTimeout(() => {
      router.replace({
        pathname: '/rental/payment',
        params: {
          name: params.name,
          brand: params.brand,
          price: rentPrice,
          quantity: quantity.toString(),
          mode: 'rent',
          rentalStart: rentalStart.toISOString(),
          rentalEnd: rentalEnd.toISOString(),
          image: params.image,
          description: params.description,
          type: 'equipment',
          stock: stock.toString(),
        },
      });
    }, 400);
  }

  function BackButton() {
    return (
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>
    );
  }

  interface RentalCalendarProps {
    rentalStart: Date;
    rentalEnd: Date;
    setRentalStart: (date: Date) => void;
    setRentalEnd: (date: Date) => void;
  }

  function RentalCalendar({ rentalStart, rentalEnd, setRentalStart, setRentalEnd }: RentalCalendarProps) {
    const [showStartDate, setShowStartDate] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);

    const theme = getThemeColors();
    const textSize = 16;

    const rentalDays = Math.max(Math.ceil((rentalEnd.getTime() - rentalStart.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1);

    return (
      <View style={styles.calendarBox}>
        <Text style={[styles.calendarLabel, { color: theme.text, fontSize: textSize, textAlign: 'center' }]}>
          Select rental period:
        </Text>

        <View style={{ flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <TouchableOpacity
            style={[styles.calendarBtn, { backgroundColor: theme.unselected }]}
            onPress={() => setShowStartDate(true)}
          >
            <Text style={[styles.calendarBtnText, { color: theme.primary, fontSize: textSize - 2 }]}>
              From: {rentalStart.toDateString()}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.calendarLabel, { color: theme.text, fontSize: textSize - 2, textAlign: 'center' }]}>
            ({rentalDays} day{rentalDays > 1 ? 's' : ''})
          </Text>
          <TouchableOpacity
            style={[styles.calendarBtn, { backgroundColor: theme.unselected }]}
            onPress={() => setShowEndDate(true)}
          >
            <Text style={[styles.calendarBtnText, { color: theme.primary, fontSize: textSize - 2 }]}>
              To: {rentalEnd.toDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        {showStartDate && (
          <DateTimePicker
            value={rentalStart}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, date) => {
              setShowStartDate(false);
              if (date) {
                setRentalStart(date);
                if (date > rentalEnd) setRentalEnd(date);
              }
            }}
            minimumDate={new Date()}
          />
        )}
        {showEndDate && (
          <DateTimePicker
            value={rentalEnd}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, date) => {
              setShowEndDate(false);
              if (date && date >= rentalStart) setRentalEnd(date);
            }}
            minimumDate={rentalStart}
          />
        )}
      </View>
    );
  }

  const responsiveText = (base: number) => Math.max(base * (SCREEN_WIDTH / 400), base * 0.85);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ height: 32 }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <BackButton />
        <Image source={{ uri: params.image as string }} style={styles.image} />
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>{params.name}</Text>
        <Text style={[styles.brand, { color: theme.text, fontSize: responsiveText(textSize) }]}>{params.brand}</Text>
        <Text style={[styles.modeBtnText, { color: theme.primary, fontSize: responsiveText(textSize) }]}>
          Rent <Text style={[styles.modePrice, { color: theme.primary, fontSize: responsiveText(textSize - 2) }]}>${rentPrice}/day</Text>
        </Text>
        <Text style={[styles.stock, { color: theme.text, fontSize: responsiveText(textSize) }]}>Stock: {stock}</Text>
        <Text style={[styles.description, { color: theme.text, fontSize: responsiveText(textSize - 2) }]}>{params.description || 'No description available.'}</Text>

        <View style={styles.qtyRow}>
          <Text style={[styles.qtyLabel, { color: theme.text, fontSize: responsiveText(textSize) }]}>Quantity:</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, { backgroundColor: theme.unselected }, quantity === 1 || stock === 0 ? styles.qtyBtnDisabled : null]}
            onPress={() => setQuantity((q: number) => Math.max(1, q - 1))}
            disabled={quantity === 1 || stock === 0}
          >
            <Text style={[styles.qtyBtnText, { color: theme.text, fontSize: responsiveText(textSize + 2) }]}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.qtyValue, { color: theme.text, fontSize: responsiveText(textSize + 2) }]}>{quantity}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, { backgroundColor: theme.unselected }, quantity === maxQty || stock === 0 ? styles.qtyBtnDisabled : null]}
            onPress={() => setQuantity((q: number) => Math.min(maxQty, q + 1))}
            disabled={quantity === maxQty || stock === 0}
          >
            <Text style={[styles.qtyBtnText, { color: theme.text, fontSize: responsiveText(textSize + 2) }]}>+</Text>
          </TouchableOpacity>
        </View>

        <RentalCalendar
          rentalStart={rentalStart}
          rentalEnd={rentalEnd}
          setRentalStart={setRentalStart}
          setRentalEnd={setRentalEnd}
        />

        {stock === 0 && (
          <Text style={[styles.outOfStock, { color: '#D32F2F', fontSize: responsiveText(textSize + 2) }]}>Out of stock</Text>
        )}
      </View>

      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderColor: theme.unselected }]}>
        <View style={styles.totalPriceBox}>
          <Text style={[styles.totalPriceLabel, { color: theme.unselected, fontSize: responsiveText(textSize - 4) }]}>Total</Text>
          <Text style={[styles.totalPrice, { color: theme.text, fontSize: responsiveText(textSize + 4) }]}>
            ${(rentPrice * quantity * getRentalDays()).toFixed(2)}
          </Text>
        </View>
        <View style={styles.swipeContainerCentered}>
          <Text style={[styles.swipeLabel, { color: theme.unselected, fontSize: responsiveText(textSize - 2) }]}>Swipe to Order</Text>
          <View style={[styles.swipeTrack, { backgroundColor: theme.unselected }]} {...(stock > 0 ? panResponder.panHandlers : {})}>
            <RNAnimated.View
              style={[
                styles.swipeThumb,
                { backgroundColor: stock === 0 ? theme.unselected : theme.primary },
                { transform: [{ translateX: swipeX }] },
                swiped && { backgroundColor: '#4CAF50' },
              ]}
            >
              <Text style={[styles.swipeThumbText, { fontSize: responsiveText(textSize + 10) }]}>{swiped ? '✓' : '→'}</Text>
            </RNAnimated.View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 24, flexGrow: 1, paddingBottom: 120 },
  backButton: { alignSelf: 'flex-start', marginBottom: 16, padding: 0, borderRadius: 0, backgroundColor: 'transparent' },
  image: { width: 240, height: 240, borderRadius: 16, marginBottom: 20, backgroundColor: '#eee' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  brand: { fontSize: 20, marginBottom: 8, textAlign: 'center' },
  modeBtnText: { fontSize: 18, fontWeight: 'bold' },
  modePrice: { fontSize: 16, fontWeight: 'normal' },
  stock: { fontSize: 18, marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  qtyLabel: { fontSize: 18, marginRight: 10 },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  qtyBtnDisabled: { backgroundColor: '#ddd' },
  qtyBtnText: { fontSize: 22 },
  qtyValue: { fontSize: 20, fontWeight: 'bold', minWidth: 32, textAlign: 'center' },
  outOfStock: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  calendarBox: { alignItems: 'center', marginBottom: 16 },
  calendarLabel: { fontSize: 16, marginBottom: 4 },
  calendarBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginHorizontal: 4 },
  calendarBtnText: { fontSize: 16 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 40, paddingTop: 8, borderTopWidth: 1, paddingHorizontal: 24 },
  totalPriceBox: { alignItems: 'flex-start', justifyContent: 'flex-end', flex: 1, marginBottom: 8 },
  totalPriceLabel: { fontSize: 14, marginBottom: 2 },
  totalPrice: { fontSize: 22, fontWeight: 'bold' },
  swipeContainerCentered: { flex: 2, alignItems: 'center', justifyContent: 'flex-end', marginLeft: 0 },
  swipeLabel: { fontSize: 16, marginBottom: 8 },
  swipeTrack: { width: 260, height: 64, borderRadius: 32, justifyContent: 'center', overflow: 'hidden' },
  swipeThumb: { position: 'absolute', left: 0, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  swipeThumbText: { fontWeight: 'bold' },
});
