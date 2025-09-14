import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;

export default function StudyRoom({
  time = 30,
  remaining = 30 * 60,
  running,
  friends,
  host,
  currentUser,
  onToggleTimer,
  onCloseRoom,
}: {
  time: number;
  remaining: number;
  running: boolean;
  friends: { id: string; name: string; avatar?: string }[];
  host: string | null;
  currentUser: string;
  onToggleTimer: () => void;
  onCloseRoom: () => void;
}) {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/timer-end.mp3')
      );
      soundRef.current = sound;
    };
    loadSound();
    return () => soundRef.current?.unloadAsync();
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate friend seat positions
  const radius = CIRCLE_SIZE / 2 + 40; // sit slightly outside the circle
  const seatCoords = (index: number) => {
    const angle = (index / friends.length) * 2 * Math.PI - Math.PI / 2;
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  };

  return (
    <LinearGradient
      colors={['#d9f3ff', '#fefefe']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Study Room</Text>
      </View>

      <View style={styles.circleWrapper}>
        <LinearGradient
          colors={['#80cfff', '#4faaff']}
          style={styles.timerCircle}
        >
          <Text style={styles.timerText}>{formatTime(remaining)}</Text>
          <Text style={styles.subText}>{time} min session</Text>
        </LinearGradient>

        {friends.map((f, i) => {
          const { x, y } = seatCoords(i);
          return (
            <View
              key={f.id}
              style={[
                styles.friendSeat,
                { transform: [{ translateX: x }, { translateY: y }] },
              ]}
            >
              {f.avatar ? (
                <Image source={{ uri: f.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={{ fontWeight: '600' }}>
                    {f.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.friendName} numberOfLines={1}>
                {f.name}
              </Text>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.startBtn, running && { backgroundColor: '#ffb84d' }]}
        onPress={onToggleTimer}
      >
        <Text style={styles.startBtnText}>
          {running ? '⏸ Pause' : '▶️ Start'}
        </Text>
      </TouchableOpacity>

      {host === currentUser && (
        <TouchableOpacity onPress={onCloseRoom} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Close Room</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  header: {
    marginTop: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  circleWrapper: {
    width: CIRCLE_SIZE + 80,
    height: CIRCLE_SIZE + 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  timerCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4faaff',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  timerText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
  },
  subText: {
    color: '#f0f0f0',
    marginTop: 4,
  },
  startBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 16,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 10,
  },
  closeBtnText: {
    color: '#ff4c4c',
    fontSize: 16,
    fontWeight: '600',
  },
  friendSeat: {
    position: 'absolute',
    width: 70,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 4,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  friendName: {
    fontSize: 12,
    maxWidth: 70,
    textAlign: 'center',
  },
});
