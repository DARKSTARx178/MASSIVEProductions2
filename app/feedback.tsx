import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

// Replace with your feedback email
const FEEDBACK_EMAIL = 'northstarx178@gmail.com';

export default function Feedback() {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Please enter your feedback.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Please select a rating.');
      return;
    }
    const username = await SecureStore.getItemAsync('user');
    setSubmitted(true);
    setMessage('');
    setRating(0);
    router.back();
    try {
      const res = await fetch('http://172.22.129.135:8080/api/send-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, rating, username }),
      });
      if (res.ok) {
        setTimeout(() => {
          setSubmitted(false);
          setMessage('');
          setRating(0);
          router.back();
        }, 3000);
      } else {
        Alert.alert('Failed to send feedback.');
        setSubmitted(false);
      }
    } catch (e) {
      Alert.alert('Network error.');
      setSubmitted(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#222" />
      </TouchableOpacity>
      <Text style={styles.title}>Submit Feedback</Text>
      <TextInput
        style={styles.input}
        placeholder="Your feedback..."
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={5}
      />
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#FFD700' : '#bbb'}
              style={{ marginHorizontal: 2 }}
            />
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.submitButton} onPress={handleSend} disabled={submitted}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
      {submitted && (
        <Text style={styles.info}>Thank you for your feedback!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 18,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 18,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  info: {
    color: '#4a90e2',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
});
