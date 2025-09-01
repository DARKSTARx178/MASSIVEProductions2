import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { getOrderHistory, addOrderToHistory, OrderHistoryItem } from '@/utils/userHistory';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { homeTranslations } from '@/utils/translations';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HomeScreen() {
  const { scheme, fontSize } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

  const [user, setUser] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const { lang } = useLanguage();
  const t = homeTranslations[lang];

  useEffect(() => {
    (async () => {
      const username = await SecureStore.getItemAsync('user');
      setUser(username);
      if (username) {
        const history = await getOrderHistory(username);
        setOrderHistory(history);
      } else {
        setOrderHistory([]);
      }
    })();
  }, []);
//@ts-ignore
  const handleRenew = (order) => {
    router.push({ pathname: '/rental/renew', params: { ...order, stock: order.stock || 1 } });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 40 }}>
      <Text style={[styles.logo, { fontSize: responsiveText(textSize + 10), color: theme.text }]}>{t.home}</Text>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => router.push('/explore')} style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth / 2 - 30 }]}>
          <MaterialCommunityIcons name="hospital-box" size={32} color={theme.text} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>{t.bookEquipment}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/services')} style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth / 2 - 30 }]}>
          <MaterialCommunityIcons name="account-heart" size={32} color={theme.text} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>{t.services}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity onPress={() => router.push('/assistance')} style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth - 40 }]}>
          <MaterialCommunityIcons name="hand-heart" size={32} color={theme.text} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>{t.requireAssistance}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/delivery' as any)} style={[styles.fullButton, { backgroundColor: theme.primary, width: screenWidth - 40 }]}>
        <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>{t.myRentals}</Text>
      </TouchableOpacity>

      {!user ? (
        <>
          <Text style={[styles.welcome, { fontSize: responsiveText(textSize + 6), color: theme.text }]}>{t.welcome}</Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => router.push('/register' as any)} style={[styles.button, { backgroundColor: theme.primary, width: screenWidth / 2 - 20 }]}>
              <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>{t.createAccount}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/login' as any)} style={[styles.button, { backgroundColor: theme.primary, width: screenWidth / 2 - 20 }]}>
              <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>{t.login}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.row}>
          <TouchableOpacity onPress={() => router.push('/feedback' as any)} style={[styles.button, { backgroundColor: theme.primary, width: screenWidth - 40 }]}>
            <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>{t.submitFeedback}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Order History Section */}
      <Text style={{ color: theme.text, fontSize: responsiveText(textSize + 4), fontWeight: 'bold', marginTop: 32, marginBottom: 8 }}>{t.orderHistory}</Text>
      {!user ? (
        <Text style={{ color: theme.unselected, fontSize: textSize }}>{t.signInToSeeHistory}</Text>
      ) : orderHistory.length === 0 ? (
        <Text style={{ color: theme.unselected, fontSize: textSize }}>{t.noOrders}</Text>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%', paddingLeft: 10 }}>
            {orderHistory.slice(0, 3).map(order => (
              <View key={order.id} style={{
                backgroundColor: theme.unselectedTab,
                borderRadius: 12,
                padding: 16,
                marginRight: 16,
                minWidth: 180,
                maxWidth: 220,
                alignItems: 'flex-start',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
                position: 'relative',
              }}>
                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: responsiveText(textSize) }}>{order.name}</Text>
                <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>{t.date}: {order.date}</Text>
                <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>{t.status}: {order.status}</Text>
                <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>{t.amount}: ${order.amount}</Text>
                <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>{t.quantity}: {order.quantity}</Text>
                {order.mode === 'rent' && (
                  <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>{t.rental}: {order.rentalStart} - {order.rentalEnd}</Text>
                )}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => router.push('/delivery')} style={{ marginTop: 12, alignSelf: 'flex-end', marginRight: 24 }}>
            <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: textSize }}>{t.seeFullHistory}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logo: {
    fontWeight: 'bold',
    marginVertical: 20,
  },
  logoPart: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  card: {
    padding: 20,
    margin: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullButton: {
    padding: 18,
    borderRadius: 12,
    marginVertical: 16,
    alignItems: 'center',
  },
  cardText: {
    marginTop: 10,
    textAlign: 'center',
  },
  welcome: {
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    margin: 10,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
