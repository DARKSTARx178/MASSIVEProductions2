import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';

export default function HelpDocs() {
  const router = useRouter();
  const theme = getThemeColors();
  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(24) }]}>Help & Documentation</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.primary, fontSize: responsiveText(20) }]}>Getting Started</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>Welcome! This app helps you rent medical equipment, request caregivers, and manage your orders with ease.</Text>
        <Text style={[styles.sectionTitle, { color: theme.primary, fontSize: responsiveText(20), marginTop: 24 }]}>How to Navigate the App</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>- <Text style={{fontWeight:'bold'}}>Home:</Text> View quick actions, your order history, and access all main features.</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>- <Text style={{fontWeight:'bold'}}>Book Equipment:</Text> Browse and rent medical equipment. Tap on an item for details and to place an order.</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>- <Text style={{fontWeight:'bold'}}>Request a Caregiver:</Text> Submit a request for a professional caregiver to assist you or your loved one.</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>- <Text style={{fontWeight:'bold'}}>Require Assistance:</Text> Quickly get help or support from our team.</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>- <Text style={{fontWeight:'bold'}}>My Rentals:</Text> View and manage your current and past rentals. Renew or return equipment easily.</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>- <Text style={{fontWeight:'bold'}}>Profile:</Text> Tap your profile picture in the top right to view or edit your details, change your password, or log out.</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>- <Text style={{fontWeight:'bold'}}>Help:</Text> Use the floating help button (right side) to access this help page from anywhere in the app.</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>- <Text style={{fontWeight:'bold'}}>AI Chatbot:</Text> Swipe the top of your screen to activate an AI assistant for instant help and answers.</Text>
        <Text style={[styles.sectionTitle, { color: theme.primary, marginTop: 24, fontSize: responsiveText(20) }]}>Frequently Asked Questions</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>Q: How do I reset my password?</Text>
        <Text style={[styles.text, { color: theme.text, marginBottom: 12, fontSize: responsiveText(16) }]}>A: Go to your profile, tap "Change Password" and follow the instructions.</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>Q: How do I contact support?</Text>
        <Text style={[styles.text, { color: theme.text, marginBottom: 12, fontSize: responsiveText(16) }]}>A: Use the help button or email support@example.com.</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>Q: What is AI Mode?</Text>
        <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(16) }]}>A: AI Mode adds a colorful animated border and a floating "island" for a unique experience. Swipe the header to toggle it.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    marginBottom: 6,
    lineHeight: 22,
  },
});
