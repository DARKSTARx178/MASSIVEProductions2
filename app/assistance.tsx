import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

// Replace with your service email
const SERVICE_EMAIL = 'northstarx178@gmail.com';

export default function Assistance() {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Please enter your request.');
      return;
    }
    const username = await SecureStore.getItemAsync('user');
    setSubmitted(true);
    setMessage('');
    router.back();
    try {
      const res = await fetch('http://172.22.129.135:8080/api/send-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, rating: 'Assistance', username }),
      });
      if (res.ok) {
        setTimeout(() => {
          setSubmitted(false);
          setMessage('');
          router.back();
        }, 3000);
      } else {
        Alert.alert('Failed to send request.');
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
      <Text style={styles.title}>Request Assistance</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe your issue or request..."
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={5}
      />
      <TouchableOpacity style={styles.submitButton} onPress={handleSend} disabled={submitted}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
      {submitted && (
        <Text style={styles.info}>We are attending to your request, please hold on!</Text>
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
