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

  // Quote of the Day logic
  const quotes = [
    "The best way to get started is to quit talking and begin doing. – Walt Disney",
    "Success is not the key to happiness. Happiness is the key to success.",
    "Don’t watch the clock; do what it does. Keep going. – Sam Levenson",
    "The only place where success comes before work is in the dictionary. – Vidal Sassoon",
    "Opportunities don't happen, you create them. – Chris Grosser",
    "Believe you can and you're halfway there. – Theodore Roosevelt",
    "It always seems impossible until it’s done. – Nelson Mandela",
    "Start where you are. Use what you have. Do what you can. – Arthur Ashe",
    "Dream big and dare to fail. – Norman Vaughan",
    "Act as if what you do makes a difference. It does. – William James"
  ];
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Pick a random quote on mount
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 40 }}>
      <Text style={[styles.logo, { fontSize: responsiveText(textSize + 10), color: theme.text }]}>{t.home}</Text>

      {/* Quote of the Day Section */}
      <View style={[styles.quoteContainer, { backgroundColor: theme.unselectedTab, borderColor: theme.primary }]}> 
        <Text style={[styles.quoteTitle, { color: theme.primary, fontSize: responsiveText(textSize + 2) }]}>Quote of the Day</Text>
        <Text style={[styles.quoteText, { color: theme.text, fontSize: responsiveText(textSize) }]}>{quote}</Text>
      </View>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => router.push('/work')} style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth / 2 - 30 }]}>
          <MaterialCommunityIcons name="pencil" size={32} color={theme.text} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>Assignments</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/study')} style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth / 2 - 30 }]}>
          <MaterialCommunityIcons name="book" size={32} color={theme.text} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>Study with friends</Text>
        </TouchableOpacity>
      </View>

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
        </View>
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
  quoteContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    marginVertical: 18,
    marginHorizontal: 20,
    alignItems: 'center',
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quoteText: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
