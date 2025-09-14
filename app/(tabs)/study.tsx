import React, { useEffect, useState, useRef } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native'
import { getFirestore, doc, onSnapshot } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { app } from '../../firebase/firebase'

const db = getFirestore(app)
const auth = getAuth(app)
const API_BASE = 'https://massive-productions2.vercel.app'

export default function StudyRoom() {
  const [roomId, setRoomId] = useState('')
  const [inputRoom, setInputRoom] = useState('')
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timer>()

  const joinRoom = () => {
    if (!inputRoom.trim()) return
    setRoomId(inputRoom.trim())
  }

  const createRoom = async () => {
    try {
      const user = auth.currentUser
      if (!user) return Alert.alert('Error', 'You must be signed in!')

      const sessionId = inputRoom.trim() || Math.random().toString(36).slice(2, 8)
      const host = user.uid || user.email
      const time = 30 // default 30 mins

      const res = await fetch(`${API_BASE}/api/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', sessionId, host, time })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')
      setRoomId(data.roomId || sessionId)
    } catch (err: any) {
      Alert.alert('Error creating room', err.message)
    }
  }

  useEffect(() => {
    if (!roomId) return
    const unsub = onSnapshot(doc(db, 'studyRooms', roomId), snap => {
      if (snap.exists()) {
        const d = snap.data()
        if (d.startedAt?.toDate && d.time) {
          const end = d.startedAt.toDate().getTime() / 1000 + d.time * 60
          const diff = end - Math.floor(Date.now() / 1000)
          setSecondsLeft(diff > 0 ? diff : 0)
        }
      }
    })
    return () => unsub()
  }, [roomId])

  useEffect(() => {
    if (secondsLeft === null) return
    timerRef.current && clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => (prev && prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => timerRef.current && clearInterval(timerRef.current)
  }, [secondsLeft])

  return (
    <View style={styles.container}>
      {!roomId ? (
        <>
          <Text style={styles.title}>Join or Create a Study Room</Text>
          <TextInput
            placeholder="Room ID (optional)"
            value={inputRoom}
            onChangeText={setInputRoom}
            style={styles.input}
          />
          <Button title="Join Room" onPress={joinRoom} />
          <View style={{ height: 20 }} />
          <Button title="Create Room (30 mins)" onPress={createRoom} />
        </>
      ) : (
        <>
          <Text style={styles.title}>Room: {roomId}</Text>
          <Text style={styles.timer}>
            {secondsLeft !== null
              ? `${Math.floor(secondsLeft / 60)}:${('0' + (secondsLeft % 60)).slice(-2)}`
              : '--:--'}
          </Text>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '80%',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8
  },
  timer: { fontSize: 48, fontWeight: 'bold', marginTop: 40 }
})
