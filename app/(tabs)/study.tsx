import { doc, getDoc } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import { Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { auth, db } from '../../firebase/firebase'

const API_BASE = 'https://massive-productions2.vercel.app/api/room'

type Room = {
  id: string
  host: string
  timer: number
  running: boolean
  friends: string[]
  startedAt?: number
}

export default function StudyRoom() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  const [joinedRoom, setJoinedRoom] = useState<Room | null>(null)
  const [running, setRunning] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60)
  const intervalRef = useRef<number | null>(null)

  const [createMinutes, setCreateMinutes] = useState<number>(25)
  const [createSeconds, setCreateSeconds] = useState<number>(0)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await globalThis.fetch(API_BASE)
        const list = await res.json()
        setRooms(Array.isArray(list) ? list : [])
      } catch (e) {
        console.warn('fetchRooms error', e)
      }
    }
    fetchRooms()
    const t = setInterval(fetchRooms, 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const loadUsername = async () => {
      try {
        const user = auth.currentUser
        if (!user) return
        const udoc = await getDoc(doc(db, 'users', user.uid))
        if (udoc.exists()) {
          const data = udoc.data() as any
          setCurrentUsername(data.username || null)
        }
      } catch (e) {
        console.warn('loadUsername error', e)
      }
    }
    loadUsername()
  }, [])

  const createRoom = async () => {
    if (!roomName) return
    setCreating(true)
    try {
      const secs = (Number(createMinutes) || 0) * 60 + (Number(createSeconds) || 0)
      const res = await globalThis.fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ host: roomName, timer: secs }) })
      const data = await res.json()
      setRoomName('')
      setCreating(false)
      joinRoomById(data.id, currentUsername || roomName)
    } catch (e) {
      console.warn('createRoom error', e)
      setCreating(false)
    }
  }

  const joinRoomById = async (id: string, displayName = 'You') => {
    try {
      const res = await globalThis.fetch(`${API_BASE}?id=${id}`)
      if (!res.ok) return
      const r: Room = await res.json()
      setJoinedRoom(r)
      setTotalSeconds(r.timer)
      setRunning(r.running)
      await globalThis.fetch(API_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, action: 'addFriend', friend: displayName }) })
    } catch (e) {
      console.warn('joinRoom error', e)
    }
  }

  const leaveRoom = async () => {
    if (!joinedRoom) return
    try {
      await globalThis.fetch(API_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: joinedRoom.id, action: 'removeFriend', friend: currentUsername || 'Unknown' }) })
    } catch (e) {
      console.warn('leaveRoom error', e)
    }
    setJoinedRoom(null)
    stopTimer()
  }

  const startTimer = (notify = true) => {
    if (running) return
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setTotalSeconds((s) => Math.max(0, s - 1))
    }, 1000) as unknown as number
    if (notify && joinedRoom) globalThis.fetch(API_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: joinedRoom.id, action: 'start' }) })
  }

  const stopTimer = (notify = true) => {
    setRunning(false)
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
    if (notify && joinedRoom) globalThis.fetch(API_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: joinedRoom.id, action: 'stop' }) })
  }

  useEffect(() => {
    if (!joinedRoom) return
    let alive = true
    const poll = async () => {
      try {
        const res = await globalThis.fetch(`${API_BASE}?id=${joinedRoom.id}`)
        if (!res.ok) { setJoinedRoom(null); stopTimer(); return }
        const r: Room = await res.json()
        if (!alive) return
        let remaining = r.timer
        if (r.running && r.startedAt) {
          const elapsed = Math.floor((Date.now() - r.startedAt) / 1000)
          remaining = Math.max(0, r.timer - elapsed)
        }
        setTotalSeconds(remaining)
        if (r.running && !running) startTimer(false)
        if (!r.running && running) stopTimer(false)
        setJoinedRoom(r)
      } catch (e) {
        console.warn('poll error', e)
      }
    }
    const iv = setInterval(poll, 1000)
    poll()
    return () => { alive = false; clearInterval(iv) }
  }, [joinedRoom])

  const minutesLeft = Math.floor(totalSeconds / 60)
  const secondsLeft = totalSeconds % 60

  if (joinedRoom) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Room: {joinedRoom.id}</Text>
        <Text>Host: {joinedRoom.host}</Text>

        <View style={styles.timerWrap}>
          <Text style={[styles.timerText, { marginRight: 8 }]}>{String(minutesLeft).padStart(2, '0')}</Text>
          <Text style={[styles.timerText, { fontSize: 36 }]}>:</Text>
          <Text style={[styles.timerText, { marginLeft: 8, fontSize: 36 }]}>{String(secondsLeft).padStart(2, '0')}</Text>
        </View>

        <View style={{ height: 12 }} />
        <Button title={running ? 'Stop' : 'Start'} onPress={() => (running ? stopTimer() : startTimer())} />
        <View style={{ height: 8 }} />
        <Button title="Leave Room" onPress={leaveRoom} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Study Rooms</Text>

      <Text style={{ marginBottom: 6 }}>Signed in as: {currentUsername ?? 'Not signed in'}</Text>
      <TextInput style={styles.input} placeholder="Room name" value={roomName} onChangeText={setRoomName} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <TextInput style={[styles.input, { width: 100, marginRight: 8 }]} keyboardType="numeric" value={String(createMinutes)} onChangeText={(t) => setCreateMinutes(Number(t) || 0)} />
        <Text style={{ marginRight: 12 }}>min</Text>
        <TextInput style={[styles.input, { width: 80 }]} keyboardType="numeric" value={String(createSeconds)} onChangeText={(t) => setCreateSeconds(Number(t) || 0)} />
        <Text style={{ marginLeft: 8 }}>sec</Text>
      </View>
      <View style={{ height: 8 }} />
      <Button title="Create Room" onPress={createRoom} disabled={creating || !roomName || !currentUsername} />

      <View style={{ height: 16 }} />
      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Available Rooms</Text>

      <FlatList
        data={rooms}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.roomItem}>
            <View>
              <Text style={{ fontWeight: '600' }}>{item.host}</Text>
              <Text>{String(Math.floor(item.timer / 60)).padStart(2, '0')}:{String(item.timer % 60).padStart(2, '0')} • {item.running ? 'Running' : 'Stopped'} • {item.friends.length} participants</Text>
            </View>
            <TouchableOpacity style={styles.joinBtn} onPress={() => joinRoomById(item.id, currentUsername || 'You')}>
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
  timerWrap: { height: 120, justifyContent: 'center', alignItems: 'center', marginTop: 16, backgroundColor: '#f6f6f6', borderRadius: 12, flexDirection: 'row' },
  timerText: { fontSize: 48, fontWeight: '800' },
})
 
