import React, { useState, useRef } from 'react'
import { View, Text, Button, StyleSheet, TextInput } from 'react-native'

export default function Timer() {
  const [minutes, setMinutes] = useState(30)   // default 30 mins
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timer>()

  const startTimer = () => {
    if (running) return
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev === 0) {
          if (minutes === 0) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            return 0
          }
          setMinutes(m => m - 1)
          return 59
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopTimer = () => {
    setRunning(false)
    intervalRef.current && clearInterval(intervalRef.current)
  }

  const resetTimer = () => {
    stopTimer()
    setMinutes(30)
    setSeconds(0)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </Text>

      <View style={{ height: 20 }} />

      <Button title={running ? 'Stop' : 'Start'} onPress={running ? stopTimer : startTimer} />
      <View style={{ height: 10 }} />
      <Button title="Reset" onPress={resetTimer} />

      <View style={{ height: 20 }} />
      <Text>Set Minutes:</Text>
      <TextInput
        style={[styles.input, running && { backgroundColor: '#eee' }]}
        keyboardType="numeric"
        value={String(minutes)}
        editable={!running} // LOCK input when running
        onChangeText={t => setMinutes(Number(t) || 0)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffffff' },
  timer: { fontSize: 48, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '50%',
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
    marginTop: 10
  }
})
