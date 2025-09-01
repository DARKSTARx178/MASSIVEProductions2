import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Animated, PanResponder, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import StepBar from '@/components/StepBar';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function RenewPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { scheme, fontSize } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const quantity = Number(params.quantity) || 1;
  const rentPrice = Math.max(1, Math.round((Number(params.price) || 0) * 0.18));
  const stock = Number(params.stock) || 0;
  const originalReturnDate = params.returnDate ? new Date(params.returnDate as string) : new Date();
  const [showEndDate, setShowEndDate] = useState(false);
  const maxQty = Number(params.quantity) || 1;
  const [renewQty, setRenewQty] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [renewEnd, setRenewEnd] = useState(new Date(originalReturnDate.getTime() + 24 * 60 * 60 * 1000));
  const getRenewDays = () => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.ceil((renewEnd.getTime() - originalReturnDate.getTime()) / msPerDay);
    return days > 0 ? days : 1;
  };
  const rentalEnd = new Date(originalReturnDate.getTime() + 1 * 24 * 60 * 60 * 1000);
  const [swipeX] = useState(new Animated.Value(0));
  const [swiped, setSwiped] = useState(false);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20,
    onPanResponderMove: Animated.event([
      null,
      { dx: swipeX },
    ], { useNativeDriver: false }),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > SCREEN_WIDTH * 0.35 && stock > 0) {
        setSwiped(true);
        setTimeout(() => {
          router.replace({ pathname: '/rental/payment', params: {
            ...params,
            quantity: renewQty,
            rentalStart: originalReturnDate.toISOString(),
            rentalEnd: renewEnd.toISOString(),
            mode: 'renew',
            total: (rentPrice * renewQty * getRenewDays()).toFixed(2),
          }});
        }, 400);
      } else {
        Animated.spring(swipeX, { toValue: 0, useNativeDriver: false }).start();
      }
    },
  });

  function PageProgressBar({ step }: { step: 'order' | 'payment' | 'delivery' }) {
    const isSmallScreen = SCREEN_WIDTH < 400;
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: isSmallScreen ? 8 : 16, marginBottom: isSmallScreen ? 8 : 16 }}>
        <MaterialCommunityIcons
          name="clipboard-list-outline"
          size={isSmallScreen ? 32 : 40}
          color={step === 'order' ? theme.primary : theme.unselected}
          style={{ opacity: step === 'order' ? 1 : 0.5 }}
        />
        <View style={{ width: isSmallScreen ? 18 : 32, height: 3, backgroundColor: theme.unselected, marginHorizontal: 4, opacity: 0.5, borderRadius: 2 }} />
        <MaterialCommunityIcons
          name="credit-card-outline"
          size={isSmallScreen ? 32 : 40}
          color={step === 'payment' ? theme.primary : theme.unselected}
          style={{ opacity: step === 'payment' ? 1 : 0.5 }}
        />
        <View style={{ width: isSmallScreen ? 18 : 32, height: 3, backgroundColor: theme.unselected, marginHorizontal: 4, opacity: 0.5, borderRadius: 2 }} />
        <MaterialCommunityIcons
          name="truck"
          size={isSmallScreen ? 32 : 40}
          color={step === 'delivery' ? theme.primary : theme.unselected}
          style={{ opacity: step === 'delivery' ? 1 : 0.5 }}
        />
      </View>
    );
  }

  function BackButton() {
    return (
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>
    );
  }

  function RentalCalendar() {
    const daysRented = getRenewDays();
    return (
      <View style={styles.calendarBox}>
        <Text style={[styles.calendarLabel, { color: theme.text, fontSize: textSize }]}>Renewal period:</Text>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={[styles.calendarBtn, { backgroundColor: theme.unselected }]}> 
            <Text style={[styles.calendarBtnText, { color: theme.primary, fontSize: textSize - 2 }]}>From: {originalReturnDate.toDateString()}</Text>
          </View>
          <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }}>
            <Text style={[styles.calendarLabel, { color: theme.text, fontSize: textSize - 2 }]}>({daysRented} day{daysRented > 1 ? 's' : ''})</Text>
          </View>
          <TouchableOpacity style={[styles.calendarBtn, { backgroundColor: theme.unselected }]} onPress={() => setShowCalendar(true)}>
            <Text style={[styles.calendarBtnText, { color: theme.primary, fontSize: textSize - 2 }]}>To: {renewEnd.toDateString()}</Text>
          </TouchableOpacity>
        </View>
        {showCalendar && (
          <DateTimePicker
            value={renewEnd}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, date) => {
              setShowCalendar(false);
              if (date && date > originalReturnDate) setRenewEnd(date);
            }}
            minimumDate={new Date(originalReturnDate.getTime() + 24 * 60 * 60 * 1000)}
          />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          <Text style={[styles.calendarLabel, { color: theme.text, fontSize: textSize - 2, marginRight: 8 }]}>Quantity to renew:</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, { backgroundColor: theme.unselected }, renewQty === 1 ? styles.qtyBtnDisabled : null]}
            onPress={() => setRenewQty((q: number) => Math.max(1, q - 1))}
            disabled={renewQty === 1}
          >
            <Text style={[styles.qtyBtnText, { color: theme.text, fontSize: textSize + 2 }]}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.qtyValue, { color: theme.text, fontSize: textSize + 2, minWidth: 32, textAlign: 'center' }]}>{renewQty}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, { backgroundColor: theme.unselected }, renewQty === maxQty ? styles.qtyBtnDisabled : null]}
            onPress={() => setRenewQty((q: number) => Math.min(maxQty, q + 1))}
            disabled={renewQty === maxQty}
          >
            <Text style={[styles.qtyBtnText, { color: theme.text, fontSize: textSize + 2 }]}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.calendarLabel, { color: theme.text, fontSize: textSize - 2, marginTop: 8 }]}>You originally booked {maxQty} item{maxQty > 1 ? 's' : ''}. Select how many to renew above.</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <PageProgressBar step="order" />
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <BackButton />
        <Image source={{ uri: params.image as string }} style={styles.image} />
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>{params.name}</Text>
        <Text style={[styles.brand, { color: theme.text, fontSize: responsiveText(textSize) }]}>{params.brand}</Text>
        <View style={styles.modeRow}>
          <View style={[styles.modeBtn, { backgroundColor: theme.primary }]}> 
            <Text style={[styles.modeBtnText, { color: theme.background, fontSize: responsiveText(textSize) }]}>Renewal
              <Text style={[styles.modePrice, { color: theme.background, fontSize: responsiveText(textSize - 2) }]}>  ${rentPrice}/day</Text>
            </Text>
          </View>
        </View>
        <Text style={[styles.stock, { color: theme.text, fontSize: responsiveText(textSize) } ]}>Stock: {stock}</Text>
        <Text style={[styles.description, { color: theme.text, fontSize: responsiveText(textSize - 2) }]}>{params.description || 'No description available.'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
          <Text style={[styles.qtyLabel, { color: theme.text, fontSize: responsiveText(textSize) }]}>Quantity to renew:</Text>
          <View style={[styles.qtyBtn, { backgroundColor: theme.unselected }]}> 
            <Text style={[styles.qtyBtnText, { color: theme.text, fontSize: responsiveText(textSize + 2) }]}>{renewQty}</Text>
          </View>
        </View>
        <RentalCalendar />
        {stock === 0 && (
          <Text style={[styles.outOfStock, { color: '#D32F2F', fontSize: responsiveText(textSize + 2) }]}>Out of stock</Text>
        )}
      </View>
      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderColor: theme.unselected }]}> 
        <View style={styles.totalPriceBox}>
          <Text style={[styles.totalPriceLabel, { color: theme.unselected, fontSize: responsiveText(textSize - 4) }]}>Total</Text>
          <Text style={[styles.totalPrice, { color: theme.text, fontSize: responsiveText(textSize + 4) }]}> 
            {`$${(rentPrice * renewQty * getRenewDays()).toFixed(2)}`}
          </Text>
        </View>
        <View style={styles.swipeContainerCentered}>
          <Text style={[styles.swipeLabel, { color: theme.unselected, fontSize: responsiveText(textSize - 2) }]}>Swipe to Renew</Text>
          <View style={[styles.swipeTrack, { backgroundColor: theme.unselected }]}> 
            <Animated.View
              style={[
                styles.swipeThumb,
                { backgroundColor: stock === 0 ? theme.unselected : theme.primary },
                { transform: [{ translateX: swipeX }] },
                swiped && { backgroundColor: '#4CAF50' },
              ]}
              {...(stock > 0 ? panResponder.panHandlers : {})}
            >
              <Text style={[styles.swipeThumbText, { fontSize: responsiveText(textSize + 10) }]}>{swiped ? '✓' : '→'}</Text>
            </Animated.View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stepActive: {
  },
  stepText: {
    marginLeft: 6,
    marginTop: 2,
  },
  stepTextActive: {
    marginLeft: 6,
    marginTop: 2,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  stepCircleText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepLine: {
    width: 32,
    height: 3,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  container: {
    alignItems: 'center',
    padding: 24,
    flexGrow: 1,
    paddingBottom: 120,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    padding: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  image: {
    width: 240,
    height: 240,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  brand: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 12,
  },
  modeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    marginHorizontal: 6,
  },
  modeBtnActive: {
  },
  modeBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modeBtnTextActive: {
  },
  modePrice: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  stock: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  qtyLabel: {
    fontSize: 18,
    marginRight: 10,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  qtyBtnDisabled: {
    backgroundColor: '#ddd',
  },
  qtyBtnText: {
    fontSize: 22,
  },
  qtyValue: {
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 32,
    textAlign: 'center',
  },
  outOfStock: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  calendarBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  calendarBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  calendarBtnText: {
    fontSize: 16,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 40, // increased from 24 for more space below
    paddingTop: 8,
    borderTopWidth: 1,
    paddingHorizontal: 24,
  },
  totalPriceBox: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    flex: 1,
    marginBottom: 8,
  },
  totalPriceLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  swipeContainerCentered: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 0,
  },
  swipeLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  swipeTrack: {
    width: 260,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  swipeThumb: {
    position: 'absolute',
    left: 0,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  swipeThumbText: {
    fontWeight: 'bold',
  },
});
