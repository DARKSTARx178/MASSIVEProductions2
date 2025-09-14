import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';

export default function ChangePassword() {
  const router = useRouter();
  const { fontSize } = useAccessibility();
  const theme = getThemeColors();
  const textSize = getFontSizeValue(fontSize);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  const handleChangePassword = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in!');
      return;
    }
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // ✅ Reauthenticate first
      const credential = EmailAuthProvider.credential(user.email!, currentPw);
      await reauthenticateWithCredential(user, credential);

      // ✅ Update password
      await updatePassword(user, newPw);
      Alert.alert('Success', 'Password changed successfully.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      router.back();
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Current password is incorrect.');
      } else {
        Alert.alert('Error', err.message || 'Failed to change password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize + 8, marginBottom: 24, marginTop: 16 }}>
        Change Password
      </Text>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
        placeholder="Current Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={currentPw}
        onChangeText={setCurrentPw}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
        placeholder="New Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={newPw}
        onChangeText={setNewPw}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
        placeholder="Confirm New Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={confirmPw}
        onChangeText={setConfirmPw}
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary, marginTop: 16 }]}
        onPress={handleChangePassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.background} />
        ) : (
          <Text style={{ color: theme.background, fontWeight: 'bold' }}>Change</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    width: 300,
  },
  backButton: {
    position: 'absolute',
    top: 35,
    left: 20,
    zIndex: 1,
    backgroundColor: 'transparent',
    padding: 6,
  },
  button: {
    width: 300,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
});
