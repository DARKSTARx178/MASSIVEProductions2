import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import { db } from '../../firebase/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';

export default function AdminEquipmentMgt() {
    const theme = getThemeColors();
    const textSize = getFontSizeValue('medium');

    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [equipmentList, setEquipmentList] = useState<any[]>([]);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    // Fetch all equipment from Firestore
    const fetchEquipment = async () => {
        const snapshot = await getDocs(collection(db, 'equipment'));
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipmentList(items);
    };

    useEffect(() => {
        fetchEquipment();
    }, []);

    // Add new equipment
    const handleAddEquipment = async () => {
        if (!name || !brand || !price || !stock) {
            Alert.alert('Error', 'Please fill all required fields.');
            return;
        }

        try {
            await addDoc(collection(db, 'equipment'), {
                name,
                brand,
                price: Number(price),
                stock: Number(stock),
                description,
                image,
                createdAt: new Date(),
            });

            Alert.alert('Success', 'Equipment added!');
            setName(''); setBrand(''); setPrice(''); setStock(''); setDescription(''); setImage('');
            fetchEquipment();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to add equipment.');
        }
    };

    // Update stock
    const handleUpdateStock = async (id: string, newStock: number) => {
        try {
            await updateDoc(doc(db, 'equipment', id), { stock: newStock });
            fetchEquipment();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to update stock.');
        }
    };

    // Delete equipment
    const handleDeleteEquipment = async (id: string, name: string) => {
        Alert.alert(
            'Delete Equipment',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'equipment', id));
                            fetchEquipment();
                        } catch (e) {
                            console.error(e);
                            Alert.alert('Error', 'Failed to delete equipment.');
                        }
                    },
                },
            ]
        );
    };

    // Toggle expand/collapse
    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text> </Text> // spacing
            <Text style={[styles.heading, { color: theme.text, fontSize: textSize + 6 }]}>Manage Equipment</Text>

            {/* Add New Equipment */}
            <View style={styles.inputContainer}>
                <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Name" placeholderTextColor="#aaa" value={name} onChangeText={setName} />
                <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Brand" placeholderTextColor="#aaa" value={brand} onChangeText={setBrand} />
                <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Price (per day)" placeholderTextColor="#aaa" keyboardType="numeric" value={price} onChangeText={setPrice} />
                <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Stock" placeholderTextColor="#aaa" keyboardType="numeric" value={stock} onChangeText={setStock} />
                <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Description" placeholderTextColor="#aaa" value={description} onChangeText={setDescription} />
                <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Image URL" placeholderTextColor="#aaa" value={image} onChangeText={setImage} />

                <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleAddEquipment}>
                    <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Add Equipment</Text>
                </TouchableOpacity>
            </View>

            {/* Existing Equipment List */}
            <Text style={[styles.subHeading, { color: theme.text, fontSize: textSize + 4 }]}>Existing Equipment</Text>
            <FlatList
                data={equipmentList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                    const isExpanded = expandedItems[item.id];
                    return (
                        <TouchableOpacity
                            onPress={() => toggleExpand(item.id)}
                            activeOpacity={0.8}
                            style={[styles.itemContainer, { borderColor: theme.unselected }]}
                        >
                            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize }}>
                                {item.name} ({item.brand})
                            </Text>

                            {isExpanded && (
                                <View style={{ marginTop: 10 }}>
                                    <Text style={{ color: theme.text, fontSize: textSize }}>Price: ${item.price}</Text>
                                    <Text style={{ color: theme.text, fontSize: textSize }}>Stock: {item.stock}</Text>

                                    <View style={{ flexDirection: 'row', marginTop: 6, gap: 8 }}>
                                        <TouchableOpacity
                                            style={[styles.smallButton, { backgroundColor: theme.primary }]}
                                            onPress={() => handleUpdateStock(item.id, item.stock + 1)}
                                        >
                                            <Text style={{ color: theme.background }}>+1</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.smallButton, { backgroundColor: '#d32f2f' }]}
                                            onPress={() => handleUpdateStock(item.id, Math.max(0, item.stock - 1))}
                                        >
                                            <Text style={{ color: '#fff' }}>-1</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.smallButton, { backgroundColor: '#e53935' }]}
                                            onPress={() => handleDeleteEquipment(item.id, item.name)}
                                        >
                                            <Text style={{ color: '#fff' }}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24 },
    heading: { fontWeight: 'bold', marginBottom: 20 },
    subHeading: { fontWeight: 'bold', marginTop: 20, marginBottom: 12 },
    inputContainer: { marginBottom: 24 },
    input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: 'rgba(0,0,0,0.03)' },
    button: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    itemContainer: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
    smallButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
});
