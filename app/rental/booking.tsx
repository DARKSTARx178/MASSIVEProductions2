import React, { useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  Animated as RNAnimated,
  PanResponder,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function BookingScreen() {
  const params = useLocalSearchParams() as any;
  const router = useRouter();

  const { scheme, fontSize } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const responsiveText = (size: number) => Math.max(size * (SCREEN_WIDTH / 400), size * 0.85);

  const bookPrice = Number(params.price || 0);
  const [bookingDate, setBookingDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [swiped, setSwiped] = useState(false);

  const swipeX = useRef(new RNAnimated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: RNAnimated.event([null, { dx: swipeX }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 200) {
          setSwiped(true);
          setTimeout(() => {
            router.replace({
              pathname: '/rental/payment',
              params: {
                ...params,
                price: bookPrice.toString(),
                fromBooking: 'true',
                bookingDate: bookingDate.toISOString(),
                type: 'service',
              },
            });
          }, 300);
        } else {
          RNAnimated.spring(swipeX, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  function BackButton() {
    return (
      <TouchableOpacity style={{ alignSelf: 'flex-start', padding: 16 }} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>
    );
  }

  function BookingCalendar() {
    return (
      <View style={{ marginVertical: 16, width: '100%', alignItems: 'center' }}>
        <Text style={{ color: theme.text, fontSize: responsiveText(textSize) }}>Choose booking date:</Text>
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={bookingDate}
            mode="date"
            display="inline"
            onChange={(_, d) => d && setBookingDate(d)}
          />
        ) : (
          <>
            {showDate && (
              <DateTimePicker
                value={bookingDate}
                mode="date"
                display="calendar"
                onChange={(_, d) => {
                  setShowDate(false);
                  d && setBookingDate(d);
                }}
              />
            )}
            <TouchableOpacity onPress={() => setShowDate(true)} style={{ marginTop: 8 }}>
              <Text style={{ color: theme.primary }}>Pick Date</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ height: 32 }} />
      <View style={styles.container}>
        <BackButton />
        {params.image && <Image source={{ uri: params.image }} style={styles.image} />}
        <Text style={[styles.title, { fontSize: responsiveText(textSize + 8), color: theme.text }]}>
          {params.name}
        </Text>
        <Text style={[styles.brand, { fontSize: responsiveText(textSize), color: theme.text }]}>
          {params.specialty}
        </Text>
        {params.description ? (
          <Text style={[styles.description, { fontSize: responsiveText(textSize - 1), color: theme.text }]}>
            {params.description}
          </Text>
        ) : null}
        <Text style={[styles.modeBtnText, { color: theme.primary, fontSize: responsiveText(textSize) }]}>
          Book <Text style={[styles.modePrice, { fontSize: responsiveText(textSize - 2) }]}>${bookPrice}</Text>
        </Text>

        <BookingCalendar />
      </View>

      <View style={[styles.bottomBar, { borderColor: theme.unselected, backgroundColor: theme.background }]}>
        <View style={styles.totalPriceBox}>
          <Text style={[styles.totalPriceLabel, { color: theme.unselected, fontSize: responsiveText(textSize - 4) }]}>
            Total
          </Text>
          <Text style={[styles.totalPrice, { color: theme.text, fontSize: responsiveText(textSize + 4) }]}>
            ${bookPrice.toFixed(2)}
          </Text>
        </View>
        <View style={styles.swipeContainerCentered}>
          <Text style={[styles.swipeLabel, { color: theme.unselected, fontSize: responsiveText(textSize - 2) }]}>
            Swipe to Book
          </Text>
          <View style={[styles.swipeTrack, { backgroundColor: theme.unselected }]} {...panResponder.panHandlers}>
            <RNAnimated.View
              style={[
                styles.swipeThumb,
                { backgroundColor: swiped ? '#4CAF50' : theme.primary, transform: [{ translateX: swipeX }] },
              ]}
            >
              <Text style={[styles.swipeThumbText, { fontSize: responsiveText(textSize + 10) }]}>
                {swiped ? '✓' : '→'}
              </Text>
            </RNAnimated.View>
          </View>
        </View>
      </View>

      {swiped && (
        <View style={{ padding: 24, marginTop: 16 }}>
          <Text style={[styles.summaryTitle, { color: theme.text, fontSize: responsiveText(textSize + 4) }]}>
            Booking Summary
          </Text>

          <Text style={[styles.summaryItem, { color: theme.text, fontSize: responsiveText(textSize) }]}>
            <Text style={styles.summaryLabel}>Name: </Text>{params.name}
          </Text>

          <Text style={[styles.summaryItem, { color: theme.text, fontSize: responsiveText(textSize) }]}>
            <Text style={styles.summaryLabel}>Type: </Text>{params.type || 'service'}
          </Text>

          <Text style={[styles.summaryItem, { color: theme.text, fontSize: responsiveText(textSize) }]}>
            <Text style={styles.summaryLabel}>Date: </Text>{bookingDate.toDateString()}
          </Text>

          <Text style={[styles.summaryItem, { color: theme.text, fontSize: responsiveText(textSize) }]}>
            <Text style={styles.summaryLabel}>Price: </Text>${bookPrice.toFixed(2)}
          </Text>

          {params.description && (
            <Text style={[styles.summaryItem, { color: theme.text, fontSize: responsiveText(textSize) }]}>
              <Text style={styles.summaryLabel}>Description: </Text>{params.description}
            </Text>
          )}

          {params.device && (
            <Text style={[styles.summaryItem, { color: theme.text, fontSize: responsiveText(textSize) }]}>
              <Text style={styles.summaryLabel}>Device: </Text>
              {params.device === 'unknown' ? 'Unidentified Device' : params.device.replace('Expo Go', 'Your Device')}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 120 },
  image: { width: 240, height: 240, borderRadius: 16, marginVertical: 16, alignSelf: 'center' },
  title: { fontWeight: 'bold', textAlign: 'center' },
  brand: { fontSize: 18, marginBottom: 8, textAlign: 'center' },
  description: {
    marginVertical: 12,
    textAlign: 'left',
    lineHeight: 20,
    alignSelf: 'stretch',
    flexShrink: 1,
  },
  modeBtnText: { marginBottom: 16, textAlign: 'center' },
  modePrice: { fontWeight: 'bold' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  totalPriceBox: { flex: 1, justifyContent: 'flex-end' },
  totalPriceLabel: {},
  totalPrice: { fontWeight: 'bold' },
  swipeContainerCentered: { flex: 2, alignItems: 'center' },
  swipeLabel: { marginBottom: 8 },
  swipeTrack: { width: 260, height: 64, borderRadius: 32, justifyContent: 'center' },
  swipeThumb: {
    position: 'absolute',
    left: 0,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeThumbText: { color: '#fff', fontWeight: 'bold' },

  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryItem: {
    marginBottom: 8,
    lineHeight: 20,
  },
  summaryLabel: {
    fontWeight: 'bold',
  },
});
