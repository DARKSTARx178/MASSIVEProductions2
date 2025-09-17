import { doc, getDoc } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Button, Easing, FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { auth, db } from '../../firebase/firebase'

const API_BASE = 'https://massive-productions2.vercel.app/api/room'

type Room = {
  id: string
  host: string
  title?: string
  timer: number
  running: boolean
  friends: string[]
  startedAt?: number
}

export default function StudyRoom() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  const [joinedRoom, setJoinedRoom] = useState<Room | null>(null)
  const [running, setRunning] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60)
  const intervalRef = useRef<number | null>(null)

  // creation no longer sets timer; timer is set inside the room after creation
  const [roomMinutes, setRoomMinutes] = useState<number>(25)
  const [roomSeconds, setRoomSeconds] = useState<number>(0)

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
    // prevent duplicate room names (case-insensitive)
    const name = roomName.trim()
    if (!name) {
      setCreateError('Room name is required')
      return
    }
    const exists = rooms.some((r) => (r.title || r.host).toLowerCase() === name.toLowerCase())
    if (exists) {
      setCreateError('A room with that name already exists')
      return
    }
    setCreateError(null)
    setCreating(true)
    try {
      const host = currentUsername || 'Host'
      const title = name || undefined
      const secs = 25 * 60
      const res = await globalThis.fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ host, title, timer: secs }) })
      const data = await res.json()
      setRoomName('')
      setCreating(false)
      joinRoomById(data.id, host)
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
      // initialize the editable room name from server title
      setRoomName(r.title || '')
      await globalThis.fetch(API_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, action: 'addFriend', friend: displayName }) })
      // initialize editable minute/second inputs from server timer
      setRoomMinutes(Math.floor(r.timer / 60))
      setRoomSeconds(r.timer % 60)
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
        <Text style={styles.header}>Room: {joinedRoom.title || joinedRoom.id}</Text>
        <Text>Host: {joinedRoom.host}</Text>

        <View style={styles.timerWrap}>
          <Text style={[styles.timerText, { marginRight: 8 }]}>{String(minutesLeft).padStart(2, '0')}</Text>
          <Text style={[styles.timerText, { fontSize: 36 }]}>:</Text>
          <Text style={[styles.timerText, { marginLeft: 8, fontSize: 36 }]}>{String(secondsLeft).padStart(2, '0')}</Text>
        </View>

        <View style={{ height: 12 }} />
        {/* Timer edit inside the room */}
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>Set timer</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput value={String(roomMinutes)} onChangeText={(t) => setRoomMinutes(Number(t) || 0)} keyboardType="numeric" style={[styles.input, { width: 80, marginRight: 8 }]} />
            <Text>min</Text>
            <TextInput value={String(roomSeconds)} onChangeText={(t) => setRoomSeconds(Number(t) || 0)} keyboardType="numeric" style={[styles.input, { width: 80, marginLeft: 12, marginRight: 8 }]} />
            <Text>sec</Text>
            <Button title="Update" onPress={async () => {
              if (!joinedRoom) return
              const secs = (roomMinutes * 60) + roomSeconds
              try {
                await globalThis.fetch(API_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: joinedRoom.id, action: 'setTimer', timer: { seconds: secs } }) })
                setTotalSeconds(secs)
              } catch (e) {
                console.warn('setTimer error', e)
              }
            }} />
          </View>
        </View>

        <View style={{ height: 12 }} />
        <Button title={running ? 'Stop' : 'Start'} onPress={() => (running ? stopTimer() : startTimer())} />
        <View style={{ height: 8 }} />
        <Button title="Leave Room" onPress={leaveRoom} />
        {/* Animated room box with dancing background and bouncing friends */}
        <RoomBox friends={joinedRoom.friends} roomId={joinedRoom.id} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Study Rooms</Text>

      <Text style={{ marginBottom: 6 }}>Signed in as: {currentUsername ?? 'Not signed in'}</Text>
      <TextInput style={styles.input} placeholder="Room name" value={roomName} onChangeText={setRoomName} />
      <Text style={{ color: '#666', marginBottom: 8 }}>Timer is set inside the room after creation.</Text>
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
              <Text style={{ fontWeight: '600' }}>{item.title || item.host}</Text>
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

// DVD-style physics-based friend bubbles and animated background
function FriendBubble({ name, size = 36, pos, onPress }: { name: string, size?: number, pos: Animated.ValueXY, onPress?: (e: any) => void }) {
  return (
    <Pressable onPress={(e) => onPress && onPress(e.nativeEvent)} style={{ position: 'absolute' }}>
      <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#ffcc66', alignItems: 'center', justifyContent: 'center', elevation: 3 }, { transform: [{ translateX: pos.x }, { translateY: pos.y }] } as any]}>
        <Text style={{ fontSize: 12, fontWeight: '700' }}>{name?.[0]?.toUpperCase() || '?'}</Text>
      </Animated.View>
    </Pressable>
  )
}

function RoomBox({ friends, roomId }: { friends: string[], roomId: string }) {
  const [layout, setLayout] = useState({ w: 300, h: 140 })
  const itemsRef = useRef(new Map<string, { pos: Animated.ValueXY; x: number; y: number; vx: number; vy: number; size: number }>());
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const bg = useRef(new Animated.Value(0)).current

  // background animation (aurora-like stripes)
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(bg, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: false }))
    loop.start()
    return () => loop.stop()
  }, [bg])

  // initialize items when friends or layout changes
  useEffect(() => {
    // ensure map has entries for each friend
    friends.forEach((f, i) => {
      if (!itemsRef.current.has(f)) {
        const size = 40
        const x = Math.random() * Math.max(1, layout.w - size)
        const y = Math.random() * Math.max(1, layout.h - size)
        // slow random velocities px/sec
        const speed = 30 + Math.random() * 60 // 30-90 px/sec
        const angle = Math.random() * Math.PI * 2
        const vx = Math.cos(angle) * speed
        const vy = Math.sin(angle) * speed
        const pos = new Animated.ValueXY({ x, y })
        itemsRef.current.set(f, { pos, x, y, vx, vy, size })
      }
    })
    // remove items that no longer exist
    Array.from(itemsRef.current.keys()).forEach((k) => { if (!friends.includes(k)) itemsRef.current.delete(k) })
  }, [friends, layout.w, layout.h])

  // physics loop
  useEffect(() => {
    let mounted = true
    function step(t: number) {
      if (!mounted) return
      const last = lastTimeRef.current ?? t
      const dt = Math.min(0.05, (t - last) / 1000) // clamp dt to avoid big jumps
      lastTimeRef.current = t
      itemsRef.current.forEach((item) => {
        item.x += item.vx * dt
        item.y += item.vy * dt
        const maxX = Math.max(0, layout.w - item.size)
        const maxY = Math.max(0, layout.h - item.size)
        if (item.x <= 0) { item.x = 0; item.vx = Math.abs(item.vx) }
        if (item.x >= maxX) { item.x = maxX; item.vx = -Math.abs(item.vx) }
        if (item.y <= 0) { item.y = 0; item.vy = Math.abs(item.vy) }
        if (item.y >= maxY) { item.y = maxY; item.vy = -Math.abs(item.vy) }
        // slow damping to keep speed reasonable
        item.vx *= 0.999
        item.vy *= 0.999
        item.pos.setValue({ x: item.x, y: item.y })
      })
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { mounted = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; lastTimeRef.current = null }
  }, [layout.w, layout.h, friends])

  const handleBubbleTap = (key: string) => {
    const item = itemsRef.current.get(key)
    if (!item) return
    // scatter: give a burst of random velocity
    const angle = Math.random() * Math.PI * 2
    const mag = 200 + Math.random() * 200
    item.vx += Math.cos(angle) * mag
    item.vy += Math.sin(angle) * mag
    // slowly decay extra velocity
    const decay = setInterval(() => {
      item.vx *= 0.9
      item.vy *= 0.9
      // stop when small
      if (Math.abs(item.vx) < 20 && Math.abs(item.vy) < 20) clearInterval(decay)
    }, 150)
  }

  const stripes = [0, 1, 2]
  return (
    <Animated.View onLayout={(e) => setLayout({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} style={[{ marginTop: 16, height: 160, borderRadius: 12, overflow: 'hidden' }, { backgroundColor: '#06121a' }] as any}>
      {/* animated colored stripes to simulate northern lights */}
      {stripes.map((s, i) => {
        const offset = i * 0.2
        const translate = bg.interpolate({ inputRange: [0, 1], outputRange: [ -layout.w * (0.6 + offset), layout.w * (0.6 + offset) ] })
        const colorA = `hsla(${130 + i * 30}, 90%, 55%, ${0.18 + i * 0.05})`
        const colorB = `hsla(${170 + i * 30}, 80%, 50%, ${0.12 + i * 0.05})`
        const stripeColor = bg.interpolate({ inputRange: [0, 1], outputRange: [colorA, colorB] }) as any
        return (
          <Animated.View key={i} style={{ position: 'absolute', left: -layout.w * 0.5, top: i * 20 - 20, width: layout.w * 2, height: 80, transform: [{ translateX: translate }, { rotate: '-25deg' }], backgroundColor: stripeColor }} />
        )
      })}

      <View style={{ flex: 1 }}>
        {friends.map((f) => {
          const it = itemsRef.current.get(f)
          if (!it) return null
          return <FriendBubble key={`${roomId}-${f}`} name={f} size={it.size} pos={it.pos} onPress={(nativeEvent) => {
            // compute touch relative to box: nativeEvent.locationX/Y are relative to bubble
            // bubble top-left in box coordinates is item.x, item.y stored in itemsRef
            const item = itemsRef.current.get(f)
            if (!item) return
            const touchX = item.x + (nativeEvent.locationX ?? (item.size / 2))
            const touchY = item.y + (nativeEvent.locationY ?? (item.size / 2))
            // compute vector from touch to bubble center
            const centerX = item.x + item.size / 2
            const centerY = item.y + item.size / 2
            let dx = centerX - touchX
            let dy = centerY - touchY
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            dx /= dist
            dy /= dist
            // apply burst away from finger, a bit faster than normal speed
            const burst = 250 + Math.random() * 200
            item.vx += dx * burst
            item.vy += dy * burst
            // small spread
            item.vx += (Math.random() - 0.5) * 80
            item.vy += (Math.random() - 0.5) * 80
            // decay extra velocity over time
            const decay = setInterval(() => {
              item.vx *= 0.92
              item.vy *= 0.92
              if (Math.abs(item.vx) < 40 && Math.abs(item.vy) < 40) clearInterval(decay)
            }, 120)
          }} />
        })}
      </View>
    </Animated.View>
  )
}
 
