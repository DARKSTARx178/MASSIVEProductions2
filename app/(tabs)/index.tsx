import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getFontSizeValue } from '@/utils/fontSizes';
import { getThemeColors } from '@/utils/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Sample quotes
const quotes = [
  "Success is the sum of small efforts repeated day in and day out.",
  "Don't let what you cannot do interfere with what you can do.",
  "The expert in anything was once a beginner.",
  "Push yourself, because no one else is going to do it for you.",
  "Small progress is still progress."
];

export default function HomeScreen() {
  const { scheme, fontSize } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

  const [quote, setQuote] = useState('');

  useEffect(() => {
    // Pick a random quote daily (simple version)
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}>
      {/* App Logo */}
      <Text style={[styles.logo, { fontSize: responsiveText(textSize + 12), color: theme.text }]}>📚 app name</Text>

      {/* Daily Quote */}
      <View style={[styles.quoteBox, { backgroundColor: theme.unselectedTab, width: screenWidth - 40 }]}>
        <Text style={{ color: theme.text, fontSize: responsiveText(textSize), fontStyle: 'italic', textAlign: 'center' }}>
          “{quote}”
        </Text>
      </View>

      {/* Cards for study features */}
      <View style={styles.row}>
        <TouchableOpacity onPress={() => router.push('/assignments')} style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth / 2 - 30 }]}>
          <MaterialCommunityIcons name="pencil" size={32} color={theme.text} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>Work</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/study')} style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth / 2 - 30 }]}>
          <MaterialCommunityIcons name="book" size={32} color={theme.text} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>Focus</Text>
        </TouchableOpacity>
      </View>
      {/* Extra Button */}
      <TouchableOpacity onPress={() => router.push('/settings')} style={[styles.fullButton, { backgroundColor: theme.primary, width: screenWidth - 40 }]}>
        <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>⚙️ Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontWeight: 'bold',
    marginVertical: 20,
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
  cardText: {
    marginTop: 10,
    textAlign: 'center',
  },
  fullButton: {
    padding: 18,
    borderRadius: 12,
    marginVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  quoteBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
