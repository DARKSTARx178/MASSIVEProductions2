import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Button,
  Dimensions,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const API_BASE = 'https://massive-productions2.vercel.app/api/room'

type Room = {
  id: string
  host: string
  timer: number
  running: boolean
  friends: string[]
}

export default function StudyRoom() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [joinedRoom, setJoinedRoom] = useState<Room | null>(null)
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  // setInterval in React Native returns a number id; initialize to null
  const intervalRef = useRef<number | null>(null)

  // For floating friends
  const floats = useRef<Record<string, Animated.ValueXY>>({}).current

  const fetchRooms = async () => {
    try {
      setLoading(true)
  const res = await globalThis.fetch(API_BASE)
      const list = await res.json()
      setRooms(Array.isArray(list) ? list : [])
    } catch (e) {
      console.warn('fetchRooms error', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    const t = setInterval(fetchRooms, 5000)
    return () => clearInterval(t)
  }, [])

  const createRoom = async () => {
    if (!roomName) return
    setCreating(true)
    try {
  const res = await globalThis.fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: roomName, timer: minutes }),
      })
      const data = await res.json()
      await fetchRooms()
      joinRoomById(data.id, roomName)
    } catch (e) {
      console.warn('createRoom error', e)
    } finally {
      setCreating(false)
    }
  }

  const joinRoomById = async (id: string, displayName = 'You') => {
    try {
  const res = await globalThis.fetch(`${API_BASE}?id=${id}`)
      const r = await res.json()
      setJoinedRoom(r)
      setMinutes(r.timer)
      setSeconds(0)
      setRunning(r.running)

      // Add self as friend (so others can see you) — naive approach
  await globalThis.fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, action: 'addFriend', friend: displayName }),
      });

      // initialize floats for existing friends
      (r.friends || []).forEach((f: string) => {
        if (!floats[f]) floats[f] = new Animated.ValueXY(randomPos())
      })
      if (!floats[displayName]) floats[displayName] = new Animated.ValueXY(randomPos())
      startFloating()
    } catch (e) {
      console.warn('joinRoom error', e)
    }
  }

  const leaveRoom = async () => {
    if (!joinedRoom) return
    try {
  await globalThis.fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: joinedRoom.id, action: 'removeFriend', friend: 'You' }),
      })
    } catch (e) {
      console.warn('leaveRoom error', e)
    }
    setJoinedRoom(null)
    stopTimer()
  }

  const startTimer = () => {
    if (running) return
    setRunning(true)
  intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev === 0) {
          if (minutes === 0) {
            if (intervalRef.current !== null) clearInterval(intervalRef.current)
            setRunning(false)
            return 0
          }
          setMinutes((m) => m - 1)
          return 59
        }
        return prev - 1
      })
  }, 1000) as unknown as number

    // notify server
    if (joinedRoom) {
  globalThis.fetch(API_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: joinedRoom.id, action: 'start' }) })
    }
  }

  const stopTimer = () => {
  setRunning(false)
  if (intervalRef.current !== null) clearInterval(intervalRef.current)
    if (joinedRoom) {
  globalThis.fetch(API_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: joinedRoom.id, action: 'stop' }) })
    }
  }

  const resetTimer = () => {
    stopTimer()
    setMinutes(25)
    setSeconds(0)
    if (joinedRoom) {
  globalThis.fetch(API_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: joinedRoom.id, action: 'updateTimer', timer: 25 }) })
    }
  }

  // Floating animation
  const floatingAnimRefs = useRef<Record<string, Animated.CompositeAnimation[]>>({}).current

  const randomPos = () => {
    const { width, height } = Dimensions.get('window')
    const x = Math.random() * (width * 0.5) - (width * 0.25)
    const y = Math.random() * (height * 0.2) - (height * 0.1)
    return { x, y }
  }

  const startFloating = () => {
    Object.keys(floats).forEach((k) => {
      const val = floats[k]
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: randomPos(), duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: randomPos(), duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      )
      floatingAnimRefs[k] = [anim]
      anim.start()
    })
  }

  const stopFloating = () => {
    Object.keys(floatingAnimRefs).forEach((k) => {
      floatingAnimRefs[k].forEach(a => a.stop && a.stop())
    })
  }

  useEffect(() => {
    return () => {
      stopTimer()
      stopFloating()
    }
  }, [])

  if (joinedRoom) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Room: {joinedRoom.id}</Text>
        <Text>Host: {joinedRoom.host}</Text>

        <View style={styles.timerWrap}>
          <Text style={styles.timerText}>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</Text>

          {/* floating friends */}
          {joinedRoom.friends.map((f) => {
            const av = floats[f] || (floats[f] = new Animated.ValueXY(randomPos()))
            return (
              <Animated.View key={f} style={[styles.friendBubble, { transform: av.getTranslateTransform() }]}>
                <Text style={{ color: 'white' }}>{f[0] || 'U'}</Text>
              </Animated.View>
            )
          })}
        </View>

        <View style={{ height: 12 }} />
        <Button title={running ? 'Stop' : 'Start'} onPress={running ? stopTimer : startTimer} />
        <View style={{ height: 8 }} />
        <Button title="Leave Room" onPress={leaveRoom} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Study Rooms</Text>

      <TextInput style={styles.input} placeholder="Your display name" value={roomName} onChangeText={setRoomName} />
      <View style={{ height: 8 }} />
      <Text>Default minutes:</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={String(minutes)} onChangeText={(t) => setMinutes(Number(t) || 0)} />

      <View style={{ height: 8 }} />
      <Button title="Create Room" onPress={createRoom} disabled={creating || !roomName} />

      <View style={{ height: 16 }} />
      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Available Rooms</Text>

      <FlatList
        data={rooms}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.roomItem}>
            <View>
              <Text style={{ fontWeight: '600' }}>{item.host}</Text>
              <Text>{String(item.timer)} min • {item.running ? 'Running' : 'Stopped'} • {item.friends.length} participants</Text>
            </View>
            <TouchableOpacity style={styles.joinBtn} onPress={() => joinRoomById(item.id, roomName || 'You')}>
              <Text style={{ color: 'white' }}>Join</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 8 },
  roomItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8 },
  joinBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  timerWrap: { height: 220, justifyContent: 'center', alignItems: 'center', marginTop: 16, backgroundColor: '#f6f6f6', borderRadius: 12 },
  timerText: { fontSize: 48, fontWeight: '800' },
  friendBubble: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: '#6a5acd', justifyContent: 'center', alignItems: 'center' },
})
