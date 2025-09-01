import React, { useRef, useState, useCallback, useEffect, createContext, useContext } from 'react';
import { Text, TextInput, Platform, TouchableOpacity, Image, View, Dimensions, StyleSheet, ScrollView, Animated, Easing, Keyboard, PanResponder } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext';
import { GoogleGenAI } from "@google/genai";
import Voice from '@react-native-voice/voice';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { getThemeColors } from '@/utils/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ai = new GoogleGenAI({ apiKey: "AIzaSyAIjiRYwpgibikuLrEsqhlpHD97NA6aR5U" });

const AIModeContext = createContext({ enabled: false, toggle: () => { } });
export const useAIMode = () => useContext(AIModeContext);

const AnimatedAIModeOverlay: React.FC<{
  visible: boolean;
  onAIClick: () => void;
  aiInput: string;
  setAiInput: (v: string) => void;
  aiResponse: string;
  setAiResponse: (v: string) => void;
  showAiInput: boolean;
  setShowAiInput: (v: boolean) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  slideAnim: Animated.Value;
  handleAskGemini: () => void;
}> = ({ visible, onAIClick, aiInput, setAiInput, aiResponse, setAiResponse, showAiInput, setShowAiInput, loading, setLoading, slideAnim, handleAskGemini }) => {
  const borderAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [
      'rgba(123,97,255,0.8)', 
      'rgba(0,180,255,0.8)',  
      'rgba(255,60,80,0.8)', 
      'rgba(123,97,255,0.8)', 
    ],
  });

  const islandAnim = borderAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 10, 0],
  });

  const glintColor = borderAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [
      'rgba(123,97,255,0.7)', 
      'rgba(0,180,255,0.7)',  
      'rgba(255,60,80,0.7)',  
      'rgba(123,97,255,0.7)', 
    ],
  });


  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);


  const [listening, setListening] = useState(false);
  const aiInputRef = useRef(aiInput);
  useEffect(() => { aiInputRef.current = aiInput; }, [aiInput]);

  useEffect(() => {
    Voice.onSpeechResults = (event: { value?: string[] }) => {
      if (event.value && event.value.length > 0) {
        const current = aiInputRef.current;
        setAiInput(current ? current + ' ' + event.value!.join(' ') : event.value!.join(' '));
      }
    };
    Voice.onSpeechEnd = () => setListening(false);
    Voice.onSpeechError = () => setListening(false);
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [setAiInput]); 

  const handleVoiceToText = async () => {
    if (listening) {
      await Voice.stop();
      setListening(false);
      return;
    }
    setListening(true);
    try {
      await Voice.start('en-US');
    } catch (e) {
      setListening(false);
 
      console.error('Voice start error', e);
    }
  };

  const [replyCollapsed, setReplyCollapsed] = useState(false);


  const overlayStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 100 : 0,
    opacity: fadeAnim,
  };
  return (
    <Animated.View style={overlayStyle} pointerEvents="box-none">
      <Animated.View
        pointerEvents="box-none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderWidth: 8,
            borderColor: borderColor,

          },
        ]}
      />
      <Animated.View
        pointerEvents="auto"
        style={{
          position: 'absolute',
          top: 30,
          left: 30,
          width: 120,
          height: 60,
          borderRadius: 45,
          overflow: 'visible',
          zIndex: 10000,
          justifyContent: 'center',
          alignItems: 'center',

          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: 45,
            backgroundColor: glintColor,
            opacity: 0.7,
          }}
        />
        <TouchableOpacity onPress={onAIClick} style={{ position: 'absolute', left: 69, top: 14, width: 36, height: 25, zIndex: 2 }}>
          <MaterialCommunityIcons name="keyboard" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleVoiceToText} style={{ position: 'absolute', left: 20, top: 14, width: 36, height: 25, justifyContent: 'flex-start', zIndex: 2 }}>
          <Ionicons name={listening ? 'mic' : 'mic-outline'} size={28} color={listening ? '#0ff' : '#fff'} />
        </TouchableOpacity>
        <Animated.View
          style={{
            position: 'absolute',
            left: 120,
            top: 0,
            height: 60,
            width: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 260] }),
            opacity: slideAnim,
            backgroundColor: 'rgba(123,97,255,0.15)',
            borderRadius: 45,
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }),
            paddingRight: 12,
            overflow: 'hidden',
            zIndex: 1,

            shadowColor: undefined,
            shadowOpacity: undefined,
            shadowRadius: undefined,
            elevation: undefined,
          }}
        >
          <Animated.View
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 45,
              backgroundColor: glintColor,
              zIndex: 0,
              opacity: 0.7,
              marginLeft: 15,
              padding: 10,
            }}
          />
          {showAiInput && (
            <>
              <TextInput
                style={{
                  flex: 1,
                  color: '#fff',
                  fontSize: 16,
                  padding: 10,
                  marginRight: 8,
                  marginLeft: 15,
                  backgroundColor: 'transparent',
                }}
                placeholder="Ask Gemini..."
                placeholderTextColor="#eee"
                value={aiInput}
                onChangeText={setAiInput}
                editable={!loading}
              />
              <TouchableOpacity onPress={handleAskGemini} disabled={loading || !aiInput.trim()} style={{ zIndex: 2 }}>
                <Ionicons name="send" size={24} color={loading ? '#aaa' : '#fff'} />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </Animated.View>
      {aiResponse ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: 100,
            left: 30,
            minWidth: 220,
            maxWidth: 380,
            backgroundColor: 'rgba(123,97,255,0.15)',
            borderRadius: 45,
            padding: replyCollapsed ? 8 : 16,
            zIndex: 100,
            maxHeight: replyCollapsed ? 48 : 220,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 45,
              backgroundColor: glintColor,
              zIndex: 0,
              opacity: 0.7,
            }}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setReplyCollapsed((c: boolean) => !c)}
            style={{ flexDirection: 'row', alignItems: 'center', zIndex: 2 }}
          >
            <Ionicons
              name={replyCollapsed ? 'chevron-down' : 'chevron-up'}
              size={22}
              color="#fff"
              style={{ marginRight: 8 }}
            />
          </TouchableOpacity>
          {!replyCollapsed && (
            <View style={{ maxHeight: 150, marginTop: 8 }}>
              <ScrollView>
                <Text style={{ color: '#fff', fontSize: 16, zIndex: 1 }}>{aiResponse}</Text>
              </ScrollView>
            </View>
          )}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

function TabLayout({ onHeaderSwipe }: { onHeaderSwipe: () => void }) {
  const { scheme } = useAccessibility()
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const updateUser = async () => {
        const currentUser = await SecureStore.getItemAsync('user');
        if (isActive) setProfileUser(currentUser);
      };
      updateUser();
      return () => { isActive = false; };
    }, [])
  );


  const panX = useRef(new Animated.Value(0)).current;
  const headerPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {

        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 50) {
          onHeaderSwipe();
        }
        panX.setValue(0);
      },
      onPanResponderMove: Animated.event([
        null,
        { dx: panX },
      ], { useNativeDriver: false }),
    })
  ).current;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: (props) => (
          <View
            style={{ height: 95, backgroundColor: theme.background, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center', position: 'relative' }}
            {...headerPanResponder.panHandlers}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding: 10, flex: 1 }}>
              <TouchableOpacity
                onPress={() =>
                  router.push('/profile')
                }
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
                    {profileUser.charAt(0).toUpperCase()}
                  </Text>
                ) : (
                  <Image
                    source={require('@/assets/images/noprofile.jpg')}
                    style={{ width: 36, height: 36, borderRadius: 18 }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ),
        headerShadowVisible: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.unselectedTab,
        tabBarStyle: Platform.select({
          ios: {
            height: 100,
            paddingBottom: 25,
            paddingTop: 15,
            backgroundColor: 'red', 
          },
          android: {
            height: 105,
            paddingBottom: 30,
            paddingTop: 10,
            backgroundColor: theme.background,
          },
          web: {
            height: 85,
            paddingBottom: 20,
            paddingTop: 12,
            backgroundColor: theme.background,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="house.fill" size={32} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>Home</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="work"
        options={{
          title: "Work",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="pencil" size={32} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>Work</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: "Study",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="book" size={32} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>Study</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="delivery"
        options={{
          title: "Delivery",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="car" size={32} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>Delivery</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" size={32} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>Settings</Text>
          ),
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 74, y: SCREEN_HEIGHT / 2 - 40 })).current;
  const panValue = useRef({ x: SCREEN_WIDTH - 74, y: SCREEN_HEIGHT / 2 - 40 });
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();


  useEffect(() => {
    const id = pan.addListener((value) => {
      panValue.current = value;
    });
    return () => pan.removeListener(id);
  }, [pan]);


  const helpPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: panValue.current.x, y: panValue.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([
        null,
        { dx: pan.x, dy: pan.y },
      ], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();

        let { x, y } = panValue.current;
        if (x < 8) x = 8;
        if (x > SCREEN_WIDTH - 64) x = SCREEN_WIDTH - 64;
        if (y < 24) y = 24;
        if (y > SCREEN_HEIGHT - 80) y = SCREEN_HEIGHT - 80;
        pan.setValue({ x, y });
      },
    })
  ).current;


  const [aiMode, setAIMode] = useState(false);

  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [showAiInput, setShowAiInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;


const allowedRoutes = [
    '/profile',
    '/helpdocs',
    '/settings',
    '/explore',
    '/delivery',
    '/index',

  ];



  const handleAICommand = useCallback((responseTextOrRoute: string) => {

    const searchActionMatch = responseTextOrRoute.match?.(/ACTION:search:(.*)/);
    if (searchActionMatch && typeof aiExploreFilterControl.setSearch === 'function') {
      aiExploreFilterControl.setSearch(searchActionMatch[1].trim());
    }


    if (typeof responseTextOrRoute === 'string' && responseTextOrRoute.startsWith('/') && allowedRoutes.includes(responseTextOrRoute)) {
      router.push(responseTextOrRoute as any);
      return;
    }


    const lower = responseTextOrRoute.toLowerCase();
    const routeKeywords = [
      { keywords: ['profile', 'user profile'], route: '/profile' },
      { keywords: ['helpdocs', 'help docs'], route: '/helpdocs' },
      { keywords: ['settings', 'app settings', 'settings tab', 'settings page'], route: '/settings' },
      { keywords: ['explore', 'equipment'], route: '/explore' },
      { keywords: ['delivery'], route: '/delivery' },
      { keywords: ['home', 'index', 'main page'], route: '/index' },
    ];
    for (const { keywords, route } of routeKeywords) {
      for (const keyword of keywords) {
        if (
          lower.includes(`go to ${keyword}`) ||
          lower.includes(`open ${keyword}`) ||
          lower.includes(keyword)
        ) {
          router.push(route as any);
          return;
        }
      }
    }
  }, [router]);


  const handleAIFloatingIslandClick = () => {
    setShowAiInput((prev) => {
      const next = !prev;
      Animated.timing(slideAnim, {
        toValue: next ? 1 : 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      if (!next) Keyboard.dismiss();
      return next;
    });
  };


  const handleAskGemini = async () => {
    setLoading(true);
    try {
      const systemPrompt = `You are an assistant for a medical equipment rental app. When a user asks for equipment or says what they want (e.g. \"I want a wheelchair\", \"I need oxygen\", \"rent a hospital bed\"), reply ONLY with ACTION:search:{the phrase or keywords you would put in the search bar to help them find it}. Do not ask follow-up questions, do not ask for more details, and do not reply with anything else. If the user asks about something unrelated to equipment, reply with NONE.`;
      const userMessage = `${systemPrompt}\n\nUser: ${aiInput}`;
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: userMessage }] }
        ],
      });
      const text = res?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response";

      if (/^ACTION:search:/i.test(text) || text.trim() === 'NONE') {
        setAiResponse("");
      } else {
        setAiResponse(text);
      }

      console.log('[Gemini AI]', text);
      handleAICommand(text);
    } catch (e) {
      setAiResponse("Error: " + (e as Error).message);
    }
    setLoading(false);
  };

  const toggleAIMode = useCallback(() => setAIMode((v) => !v), []);

  return (
    <AIModeContext.Provider value={{ enabled: aiMode, toggle: toggleAIMode }}>
      <AccessibilityProvider>
        <TabLayout onHeaderSwipe={toggleAIMode} />
        {aiMode && (
          <AnimatedAIModeOverlay
            visible={aiMode}
            onAIClick={handleAIFloatingIslandClick}
            aiInput={aiInput}
            setAiInput={setAiInput}
            aiResponse={aiResponse}
            setAiResponse={setAiResponse}
            showAiInput={showAiInput}
            setShowAiInput={setShowAiInput}
            loading={loading}
            setLoading={setLoading}
            slideAnim={slideAnim}
            handleAskGemini={handleAskGemini}
          />
        )}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: Platform.OS === 'ios' ? 100 : 0,
          }}
          pointerEvents="box-none"
        >
          <Animated.View
            style={{
              position: 'absolute',
              transform: [{ translateX: pan.x }, { translateY: pan.y }],
            
            }}
            {...helpPanResponder.panHandlers}
          >
          </Animated.View>
        </Animated.View>
      </AccessibilityProvider>
    </AIModeContext.Provider>
  );
}
