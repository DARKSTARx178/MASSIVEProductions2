import React, { useRef, useState, useCallback } from 'react';
import {
  Text,
  TouchableOpacity,
  Image,
  View,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { auth, db } from '@/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function TabLayout() {
  const { scheme } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchUsername = async () => {
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && isActive) {
            const data = userSnap.data();
            setProfileUser(data.username || user.email || null);
          }
        }
      };

      fetchUsername();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const panX = useRef(new Animated.Value(0)).current;
  const headerPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 20,
      onPanResponderRelease: () => {
        panX.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dx: panX }], { useNativeDriver: false }),
    })
  ).current;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => (
          <View
            style={{
              height: 95,
              backgroundColor: theme.background,
              justifyContent: 'flex-end',
              flexDirection: 'row',
              alignItems: 'center',
              position: 'relative',
            }}
            {...headerPanResponder.panHandlers}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding: 10, flex: 1 }}>
              <TouchableOpacity
                onPress={() => router.push('/profile')}
                style={{
                  borderRadius: 50,
                  overflow: 'hidden',
                  width: 50,
                  height: 50,
                  backgroundColor: profileUser ? theme.primary : '#ccc',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 15,
                  marginTop: 25,
                }}
              >
                {profileUser ? (
                  <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: 28 }}>
                    {typeof profileUser === 'string' && profileUser.length > 0
                      ? profileUser.includes('@')
                        ? profileUser.split('@')[0].charAt(0).toUpperCase()
                        : profileUser.charAt(0).toUpperCase()
                      : '?'}
                  </Text>
                ) : (
                  <Image source={require('@/assets/images/noprofile.jpg')} style={{ width: 36, height: 36, borderRadius: 18 }} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ),
        headerShadowVisible: false,
        headerTitle: '',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.unselected,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 100 : 105,
          paddingBottom: Platform.OS === 'ios' ? 25 : 30,
          paddingTop: Platform.OS === 'ios' ? 15 : 10,
          backgroundColor: theme.background,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <IconSymbol name="house.fill" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Home</Text> }} />
      <Tabs.Screen name="assignments" options={{ title: 'Assignments', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="pencil" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Assignments</Text> }} />
      <Tabs.Screen name="study" options={{ title: 'Study', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="book" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Study</Text> }} />
      <Tabs.Screen name="friends" options={{ title: 'Friends', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-group" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Friends</Text> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cog" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Settings</Text> }} />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AccessibilityProvider>
      <TabLayout />
    </AccessibilityProvider>
  );
}
