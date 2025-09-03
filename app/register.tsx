import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // ✅ dropdown
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import * as SecureStore from 'expo-secure-store';

export default function Register() {
  const router = useRouter();
  const { fontSize } = useAccessibility();
  const theme = getThemeColors();
  const textSize = getFontSizeValue(fontSize);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    if (!email || !password || !username || !studentClass) {
      setError('Please fill all fields.');
      return;
    }

    try {
      // ✅ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Add Firestore document with default role
      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        createdAt: new Date(),
        class: studentClass,
        friends: [],
        online: true, 
      });

      // ✅ Save locally for profile
      await SecureStore.setItemAsync('uid', user.uid);
      await SecureStore.setItemAsync('user', username);

      router.replace('/profile');
    } catch (e: any) {
      console.error('Registration error:', e);
      setError(e.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize + 8, marginBottom: 20 }}>
        Register
      </Text>

      {/* Username */}
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
        placeholder="Username"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      {/* Class Dropdown */}
      <View style={[styles.pickerContainer, { borderColor: theme.primary }]}>
        <Picker
          selectedValue={studentClass}
          onValueChange={(itemValue) => setStudentClass(itemValue)}
          style={{ color: theme.text }}
        >
          <Picker.Item label="Select your class" value="" />
          <Picker.Item label="S2-01" value="assignments201" />
          <Picker.Item label="S2-02" value="assignments202" />
          <Picker.Item label="S2-03" value="assignments203" />
          <Picker.Item label="S2-04" value="assignments204" />
          <Picker.Item label="S2-05" value="assignments205" />
          <Picker.Item label="S2-06" value="assignments206" />
          <Picker.Item label="S2-07" value="assignments207" />
          <Picker.Item label="S2-08" value="assignments208" />
          <Picker.Item label="S2-09" value="assignments209" />
          <Picker.Item label="S2-10" value="assignments210" />
        </Picker>
      </View>

      {/* Email */}
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
        placeholder="Email"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password */}
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}

      {/* Register Button */}
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleRegister}>
        <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={{ color: theme.primary, marginTop: 10 }}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 35,
    left: 20,
    zIndex: 1,
    backgroundColor: 'transparent',
    padding: 6,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
});
