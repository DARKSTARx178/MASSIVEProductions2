import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';

export default function Admin() {
    const router = useRouter();
    const theme = getThemeColors();
    const textSize = getFontSizeValue('medium');

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <Text> </Text> // spacing
            <Text style={[styles.heading, { color: theme.text, fontSize: textSize + 8 }]}>Admin Dashboard</Text>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => router.push('./admin_equipmentMgt')}
            >
                <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Manage Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => router.push('./admin_serviceMgt')}
            >
                <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Manage Services</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => router.push('./admin_userMgt')}
            >
                <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Manage Users</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24 },
    heading: { fontWeight: 'bold', marginBottom: 24 },
    button: { padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
});
