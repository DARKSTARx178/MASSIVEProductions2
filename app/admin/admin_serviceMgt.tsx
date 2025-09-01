import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, StyleSheet, Alert } from 'react-native';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

import { db } from '../../firebase/firebase';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';

interface ScheduleItem {
    date: string;
    from: string;
    to: string;
    pax: number;
}

interface ServiceItem {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: string;
    company: string;
    schedule: ScheduleItem[];
}

export default function AdminServiceMgt() {
    const theme = getThemeColors();
    const textSize = getFontSizeValue('medium');

    // Service fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [company, setCompany] = useState('');

    // Existing services
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Schedule inputs
    const [newDate, setNewDate] = useState('');
    const [newFrom, setNewFrom] = useState('');
    const [newTo, setNewTo] = useState('');
    const [newPax, setNewPax] = useState('');

    // Fetch services from Firestore
    const fetchServices = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'services'));
            const items: ServiceItem[] = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                brand: doc.data().brand,
                description: doc.data().description,
                price: doc.data().price,
                duration: doc.data().duration,
                company: doc.data().company,
                schedule: doc.data().schedule || [],
            }));
            setServices(items);
        } catch (err) {
            console.error('Error fetching services:', err);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // Add new service
    const handleAddService = async () => {
        if (!name || !description || !price || !duration || !company) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        try {
            await addDoc(collection(db, 'services'), {
                name,
                description,
                price: Number(price),
                duration,
                company,
                schedule: [],
            });
            setName(''); setDescription(''); setPrice(''); setDuration(''); setCompany('');
            fetchServices();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to add service');
        }
    };

    // Auto-format date YYYY-MM-DD
    const handleDateChange = (text: string) => {
        let cleaned = text.replace(/\D/g, '').slice(0, 8);
        if (cleaned.length > 4) cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
        if (cleaned.length > 7) cleaned = cleaned.slice(0, 7) + '-' + cleaned.slice(7);
        setNewDate(cleaned);
    };

    // Auto-format time HH:MM
    const handleTimeChange = (text: string, setter: (val: string) => void) => {
        let cleaned = text.replace(/\D/g, '').slice(0, 4);
        if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + ':' + cleaned.slice(2);
        setter(cleaned);
    };

    // Add schedule to service
    const handleAddSchedule = async (serviceId: string) => {
        if (!newDate || !newFrom || !newTo || !newPax) {
            Alert.alert('Error', 'Fill all schedule fields');
            return;
        }

        const service = services.find(s => s.id === serviceId);
        if (!service) return;

        const updatedSchedule = [...service.schedule, {
            date: newDate,
            from: newFrom,
            to: newTo,
            pax: Number(newPax),
        }];

        try {
            await updateDoc(doc(db, 'services', serviceId), { schedule: updatedSchedule });
            setNewDate(''); setNewFrom(''); setNewTo(''); setNewPax('');
            fetchServices();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to add schedule');
        }
    };

    // Delete individual schedule
    const handleDeleteSchedule = async (serviceId: string, index: number) => {
        const service = services.find(s => s.id === serviceId);
        if (!service) return;

        const updatedSchedule = service.schedule.filter((_, i) => i !== index);
        await updateDoc(doc(db, 'services', serviceId), { schedule: updatedSchedule });
        fetchServices();
    };

    const handleDeleteService = async (serviceId: string) => {
        try {
            await deleteDoc(doc(db, 'services', serviceId));
            fetchServices(); // refresh list
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to delete service.');
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text> </Text> // spacing
            <Text style={[styles.heading, { color: theme.text, fontSize: textSize + 6 }]}>Create New Service</Text>

            <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Name" value={name} onChangeText={setName} />
            <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Description" value={description} onChangeText={setDescription} />
            <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Price" value={price} keyboardType="numeric" onChangeText={setPrice} />
            <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Duration (e.g., 60min)" value={duration} onChangeText={setDuration} />
            <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Company" value={company} onChangeText={setCompany} />

            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleAddService}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add Service</Text>
            </TouchableOpacity>

            <Text style={[styles.heading, { color: theme.text, fontSize: textSize + 6, marginTop: 20 }]}>Existing Services</Text>

            {services.map(service => (
                <View key={service.id} style={[styles.serviceBox, { borderColor: theme.primary }]}>
                    <TouchableOpacity onPress={() => setExpandedId(expandedId === service.id ? null : service.id)}>
                        <Text style={[styles.serviceTitle, { color: theme.text, fontSize: textSize + 2 }]}>{service.name}</Text>
                    </TouchableOpacity>

                    {expandedId === service.id && (
                        <View style={{ marginTop: 8 }}>
                            <Text style={{ color: theme.text }}>Description: {service.description}</Text>
                            <Text style={{ color: theme.text }}>Price: ${service.price}</Text>
                            <Text style={{ color: theme.text }}>Duration: {service.duration}</Text>
                            <Text style={{ color: theme.text }}>Company: {service.company}</Text>

                            <Text style={{ color: theme.text, marginTop: 10, fontWeight: 'bold' }}>Add Schedule</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.primary, color: theme.text }]}
                                placeholder="Date (YYYY-MM-DD)"
                                value={newDate}
                                onChangeText={handleDateChange}
                            />
                            <TextInput
                                style={[styles.input, { borderColor: theme.primary, color: theme.text }]}
                                placeholder="From Time (HH:MM)"
                                value={newFrom}
                                onChangeText={(text) => handleTimeChange(text, setNewFrom)}
                            />
                            <TextInput
                                style={[styles.input, { borderColor: theme.primary, color: theme.text }]}
                                placeholder="To Time (HH:MM)"
                                value={newTo}
                                onChangeText={(text) => handleTimeChange(text, setNewTo)}
                            />
                            <TextInput
                                style={[styles.input, { borderColor: theme.primary, color: theme.text }]}
                                placeholder="Pax"
                                value={newPax}
                                keyboardType="numeric"
                                onChangeText={setNewPax}
                            />
                            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleAddSchedule(service.id)}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add Schedule</Text>
                            </TouchableOpacity>

                            {service.schedule.map((s, i) => (
                                <View key={i} style={styles.scheduleItem}>
                                    <Text style={{ color: theme.text, flex: 1 }}>{s.date} | {s.from} - {s.to} | Pax: {s.pax}</Text>
                                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteSchedule(service.id, i)}>
                                        <Text style={{ color: '#fff' }}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {expandedId === service.id && (
                                <View style={{ marginTop: 8 }}>
                                    {/* Existing details and schedule management here */}

                                    <TouchableOpacity
                                        style={[styles.deleteServiceBtn]}
                                        onPress={() => handleDeleteService(service.id)}
                                    >
                                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete Service</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                        </View>
                    )}
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    heading: { fontWeight: 'bold', marginBottom: 12 },
    input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 },
    button: { padding: 10, borderRadius: 8, alignItems: 'center', marginVertical: 6 },
    serviceBox: { borderWidth: 2, borderRadius: 12, padding: 12, marginBottom: 12 },
    serviceTitle: { fontWeight: 'bold' },
    scheduleItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 4, borderWidth: 1, borderRadius: 6, padding: 8 },
    deleteButton: { backgroundColor: '#d32f2f', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
    deleteServiceBtn: {
        backgroundColor: '#d32f2f',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    }
});
