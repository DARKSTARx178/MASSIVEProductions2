import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PanResponder, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import app from '../../firebase/firebase';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = 300;
const MAX_TIME = 180; // max 180 mins

interface Friend {
  uid: string;
  username: string;
}

export default function StudyRoom({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore(app);
  const user = auth.currentUser;

  const roomRef = doc(db, 'studyRooms', sessionId);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [timer, setTimer] = useState<number>(0); // in mins
  const [running, setRunning] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [angle, setAngle] = useState(0);

  // create/join room
  useEffect(() => {
    if (!user) return;

    const init = async () => {
      await setDoc(roomRef, {
        host: user.uid,
        timer,
        running,
        friends: [],
      }, { merge: true });
    };
    init();

    // listen to room updates
    const unsubscribe = onSnapshot(roomRef, (snap) => {
      const data = snap.data();
      if (!data) return;

      setTimer(data.timer);
      setRunning(data.running);
      setFriends(data.friends || []);
    });

    // remove room if host leaves
    const cleanup = async () => {
      if (user.uid === (await roomRef.get()).data()?.host) {
        await deleteDoc(roomRef);
      }
    };

    return () => {
      unsubscribe();
      cleanup();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 0) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            return 0;
          }
          const newTime = prev - 1;
          setDoc(roomRef, { timer: newTime }, { merge: true });
          return newTime;
        });
      }, 60000); // 1 min
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Drag timer dot
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const x = gestureState.moveX - width / 2;
        const y = gestureState.moveY - 250; // roughly center Y
        const theta = Math.atan2(y, x);
        let newAngle = theta >= 0 ? theta : 2 * Math.PI + theta;
        setAngle(newAngle);
        const newTimer = Math.round((newAngle / (2 * Math.PI)) * MAX_TIME);
        setTimer(newTimer);
      },
      onPanResponderRelease: () => { },
    })
  ).current;

  const startStopTimer = () => {
    if (!user) return;
    setRunning(!running);
    setDoc(roomRef, { running: !running }, { merge: true });
  };

  const closeRoom = async () => {
    if (!user) return;
    await deleteDoc(roomRef);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🕒 Study Room</Text>

      <View style={styles.circleContainer}>
        <View style={styles.circle}>
          <View
            style={[
              styles.dot,
              {
                transform: [
                  { rotate: `${(angle * 180) / Math.PI}deg` },
                  { translateX: CIRCLE_SIZE / 2 - 15 },
                  { translateY: -15 },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          />
          <Text style={styles.timerText}>{timer} min</Text>
        </View>

        <TouchableOpacity style={styles.playButton} onPress={startStopTimer}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>{running ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>👥 Friends Joined</Text>
      <View style={styles.friendsContainer}>
        {friends.map((f, idx) => (
          <View key={idx} style={styles.friendDot}>
            <Text style={styles.friendText}>{f.username}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={closeRoom}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Close Room</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 50 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  circleContainer: { justifyContent: 'center', alignItems: 'center' },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 3,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: { position: 'absolute', fontSize: 24, fontWeight: 'bold' },
  dot: {
    width: 30,
    height: 30,
    backgroundColor: 'red',
    borderRadius: 15,
    position: 'absolute',
  },
  playButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
  },
  subHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  friendsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    width: CIRCLE_SIZE,
    justifyContent: 'center',
  },
  friendDot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
  },
  friendText: { color: 'white', fontSize: 12, textAlign: 'center' },
  closeButton: {
    marginTop: 30,
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 10,
  },
});
