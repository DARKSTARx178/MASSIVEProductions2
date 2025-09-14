// /pages/api/room.ts  (if using the old pages/ directory)
// or /app/api/room/route.ts (if using App Router, adjust syntax slightly)

import type { NextApiRequest, NextApiResponse } from 'next'

// Very simple in-memory store while you prototype
// ⚠️ This resets whenever the Vercel function cold-starts
const rooms: Record<
    string,
    {
        host: string
        time: number
        remaining: number
        running: boolean
        friends: { uid: string; username: string }[]
    }
> = {}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req

    if (method === 'POST') {
        // Create a room
        const { sessionId, host, time } = req.body
        if (!sessionId || !host || !time) {
            return res.status(400).json({ error: 'sessionId, host, time required' })
        }
        rooms[sessionId] = {
            host,
            time,
            remaining: time * 60,
            running: true,
            friends: [],
        }
        return res.status(200).json({ ok: true, room: rooms[sessionId] })
    }

    if (method === 'GET') {
        // Get room info
        const { sessionId } = req.query
        const room = rooms[sessionId as string]
        if (!room) return res.status(404).json({ error: 'Room not found' })
        return res.status(200).json(room)
    }

    if (method === 'PATCH') {
        // Update (pause/resume, add friend, tick timer, etc.)
        const { sessionId, updates } = req.body
        const room = rooms[sessionId]
        if (!room) return res.status(404).json({ error: 'Room not found' })

        // Merge updates
        Object.assign(room, updates)
        return res.status(200).json({ ok: true, room })
    }

    if (method === 'DELETE') {
        const { sessionId } = req.query
        delete rooms[sessionId as string]
        return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
}
