import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

export interface ScheduleItem {
  date: string;
  from: string;
  to: string;
  pax?: number;
}

export interface ServiceItem {
  name: string;
  duration: string;
  company: string;
  price: number;
  image: string;
  description?: string;
  schedule?: ScheduleItem[];
}

export default function Services() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'brand' | 'company' | 'price' | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showValueDropdown, setShowValueDropdown] = useState(false);

  const { scheme, fontSize } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const router = useRouter();

  const screenWidth = Dimensions.get('window').width;
  const numColumns = screenWidth < 950 ? 2 : 3;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);
  const gridTextSize = (base: number) => Math.max(base * (screenWidth / 400), base * 0.8);

  // Fetch services from Firestore
  const fetchServices = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'services'));
      const items: ServiceItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          name: data.name,
          brand: data.brand,
          duration: data.duration,
          company: data.company,
          price: Number(data.price),
          image: data.image || '',
          description: data.description || '',
          schedule: data.schedule || [],
        };
      });
      setServices(items);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const getNextPax = (schedule?: ScheduleItem[]) => {
    if (!schedule || schedule.length === 0) return '-';
    const sorted = schedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted[0].pax || '-';
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices().finally(() => setRefreshing(false));
  };

  if (!services.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <Text style={{ color: theme.text, fontSize: 20 }}>Loading services...</Text>
      </View>
    );
  }

  const allCompanies = Array.from(new Set(services.map(s => s.company)));

  let filteredItems = services.filter(s => (s.name + ' ' + s.company).toLowerCase().includes(search.toLowerCase()));

  if (filter) {
    if (filter === 'company' && filterValue) filteredItems = filteredItems.filter(s => s.company.toLowerCase() === filterValue.toLowerCase());
    if (filter === 'price' && filterValue) filteredItems = filteredItems.filter(s => s.price <= Number(filterValue));
  }

  const getNextAvailability = (schedule?: ScheduleItem[]) => {
    if (!schedule || schedule.length === 0) return 'No slots';
    const sorted = schedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const next = sorted[0];
    return `${next.date} ${next.from}-${next.to}`;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>Services</Text>

        {/* Search Input */}
        <TextInput
          style={[styles.input, { backgroundColor: '#fff', color: '#000', fontSize: responsiveText(textSize) }]}
          placeholder="Search services..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />

        {/* Filter Row */}
        <View style={styles.dropdownRow}>
          <TouchableOpacity
            style={[styles.dropdownBtn, filter && styles.dropdownBtnActive]}
            onPress={() => { setShowFilterDropdown(!showFilterDropdown); setShowValueDropdown(false); }}
          >
            <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
              {filter ? filter.charAt(0).toUpperCase() + filter.slice(1) : 'Filter By'}
            </Text>
          </TouchableOpacity>

          {filter && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => { setFilter(null); setFilterValue(''); setShowValueDropdown(false); }}>
              <Text style={{ color: theme.primary, fontSize: responsiveText(textSize - 2) }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter dropdown */}
        {showFilterDropdown && (
          <View style={styles.dropdownMenu}>
            {['company', 'price'].map(f => (
              <TouchableOpacity
                key={f}
                style={styles.dropdownMenuItem}
                onPress={() => {
                  setFilter(f as any);
                  setShowFilterDropdown(false);
                  setShowValueDropdown(f === 'brand' || f === 'company');
                  setFilterValue('');
                }}
              >
                <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Value dropdown */}
        {showValueDropdown && filter === 'company' && (
          <FlatList
            data={allCompanies}
            keyExtractor={(c) => c}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.dropdownMenuItem} onPress={() => { setFilterValue(item); setShowValueDropdown(false); }}>
                <Text style={{ color: theme.text }}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Price Input */}
        {filter === 'price' && (
          <TextInput
            style={[styles.input, { backgroundColor: '#fff', color: '#000', fontSize: responsiveText(textSize - 2), marginBottom: 10 }]}
            placeholder="Max price..."
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={filterValue}
            onChangeText={setFilterValue}
          />
        )}

        {/* Services Grid */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  input: { height: 45, borderRadius: 12, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#ccc' },
  title: { fontWeight: 'bold', marginBottom: 20, fontSize: 20 },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dropdownBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#eee', marginRight: 8 },
  dropdownBtnActive: { backgroundColor: '#dbeafe' },
  clearBtn: { padding: 6, borderRadius: 8, backgroundColor: '#f3f4f6' },
  dropdownMenu: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, maxHeight: 180, alignSelf: 'stretch' },
  dropdownMenuItem: { paddingVertical: 10, paddingHorizontal: 16 },
  gridItem: { flex: 1, aspectRatio: 0.85, margin: 6, borderWidth: 2, borderColor: '#4a90e2', borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', elevation: 2, overflow: 'hidden' },
  gridImage: { marginBottom: 12, borderRadius: 18, resizeMode: 'cover' },
  gridText: { textAlign: 'center', fontWeight: '500' },
});
