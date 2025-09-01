import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';

export default function PaymentPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEquipment = params.type === 'equipment';

  const { scheme, fontSize } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);

  const [address, setAddress] = useState('');
  const [transactionId] = useState(Math.random().toString(36).substring(2, 10).toUpperCase());

  const handleConfirm = () => {
    if (isEquipment && !address.trim()) {
      Alert.alert('Error', 'Please enter your delivery address.');
      return;
    }

    const orderTime = new Date().toLocaleString();
    const deliveryEta = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    router.replace({
      pathname: '/delivery',
      params: {
        orderTime,
        transactionId,
        deliveryEta,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text, fontSize: textSize + 6 }]}>Payment</Text>

      {isEquipment && (
        <>
        //@ts-ignore
          <Text style={[styles.label, { color: theme.text, fontSize: textSize }]}>Delivery Address</Text>
          <TextInput
            placeholder="1234 Main St, City, Country"
            placeholderTextColor={theme.unselected}
            value={address}
            onChangeText={setAddress}
            style={[
              styles.input,
              {
                borderColor: theme.unselected,
                color: theme.text,
                fontSize: textSize,
              },
            ]}
            multiline
          />
        </>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleConfirm}
      >
        <Ionicons name="checkmark-circle-outline" size={24} color={theme.background} />
        <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize + 2 }}>
          Confirm Payment
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: 32,
  },
});
