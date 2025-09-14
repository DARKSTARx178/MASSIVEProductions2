import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../firebase/admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'POST') {
            const { action, duration, roomId } = req.body

            if (action === 'create') {
                const id = roomId || Math.random().toString(36).slice(2, 8)
                await db.collection('studyRooms').doc(id).set({
                    createdAt: new Date(),
                    startedAt: new Date(),
                    duration: Number(duration) || 25,
                    isActive: true
                })
                return res.status(200).json({ roomId: id })
            }

            if (action === 'close' && roomId) {
                await db.collection('studyRooms').doc(roomId).update({ isActive: false })
                return res.status(200).json({ ok: true })
            }

            return res.status(400).json({ error: 'Invalid action' })
        }

        if (req.method === 'GET') {
            const { roomId } = req.query
            if (!roomId || typeof roomId !== 'string') return res.status(400).json({ error: 'roomId required' })

            const snap = await db.collection('studyRooms').doc(roomId).get()
            if (!snap.exists) return res.status(404).json({ error: 'Room not found' })

            return res.status(200).json(snap.data())
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({ error: err.message })
    }
}
