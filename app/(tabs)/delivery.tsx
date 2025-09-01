import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { auth, db } from '@/firebase/firebase';
import { doc, updateDoc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';

export default function DeliveryPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { scheme, fontSize } = { scheme: 'light', fontSize: 'md' }; // fallback
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const screenWidth = Dimensions.get('window').width;

  const orderTime = params.orderTime as string;
  const transactionId = params.transactionId as string;
  const deliveryEta = params.deliveryEta as string;
  const isRenew = params.mode === 'renew';

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      if (currentUser) setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const saveOrder = async () => {
      if (!user || !transactionId) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      // Create the document if it doesn't exist
      if (!userSnap.exists()) {
        await setDoc(userRef, { orders: [], deliveryInfo: [] });
      }

      const orderData = {
        transactionId,
        orderTime,
        deliveryEta,
        isRenew,
        name: params.name || 'Unknown Device',
        brand: params.brand || '',
        image: params.image || '',
        amount: Number(params.amount) || 0,
        quantity: Number(params.quantity) || 1,
        rentalStart: params.rentalStart || '',
        rentalEnd: params.rentalEnd || '',
        createdAt: new Date().toISOString(),
      };

      try {
        await updateDoc(userRef, {
          orders: arrayUnion(orderData),
          deliveryInfo: arrayUnion({
            transactionId,
            deliveryEta,
            name: params.name || '',
            brand: params.brand || '',
            image: params.image || '',
            quantity: Number(params.quantity) || 1,
            rentalStart: params.rentalStart || '',
            rentalEnd: params.rentalEnd || '',
          }),
        });
      } catch (error) {
        console.error('Error updating user document:', error);
      }
    };

    saveOrder();
  }, [user, transactionId]);

  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.card(theme), { width: '90%', alignSelf: 'center' }]}>
        <Ionicons name="car" size={48} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>
          Delivery Scheduled
        </Text>

        <Text style={[styles.label(theme), { fontSize: responsiveText(textSize - 2) }]}>Order Time</Text>
        <Text style={[styles.value(theme), { fontSize: responsiveText(textSize) }]}>{orderTime}</Text>

        <Text style={[styles.label(theme), { fontSize: responsiveText(textSize - 2) }]}>Transaction ID</Text>
        <Text style={[styles.value(theme), { fontSize: responsiveText(textSize) }]}>{transactionId}</Text>

        {!isRenew && (
          <>
            <Text style={[styles.label(theme), { fontSize: responsiveText(textSize - 2) }]}>Estimated Delivery</Text>
            <Text style={[styles.eta(theme), { fontSize: responsiveText(textSize + 2) }]}>{deliveryEta}</Text>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button(theme)]}
        onPress={() => router.replace('/(tabs)')}
      >
        <Ionicons name="arrow-back" size={28} color={theme.background} />
        <Text style={{ color: theme.background, fontSize: responsiveText(textSize + 2), fontWeight: 'bold' }}>
          Back to Home
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: (theme: any) => ({
    backgroundColor: theme.background,
    borderColor: theme.unselected,
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  }),
  title: { fontWeight: 'bold', marginVertical: 16 },
  label: (theme: any) => ({ marginTop: 8, color: theme.unselected, fontWeight: '600' }),
  value: (theme: any) => ({ color: theme.text, marginBottom: 4 }),
  eta: (theme: any) => ({ color: theme.primary, fontWeight: 'bold', marginTop: 4 }),
  button: (theme: any) => ({
    backgroundColor: theme.primary,
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
    width: '90%',
    alignSelf: 'center',
  }),
});
