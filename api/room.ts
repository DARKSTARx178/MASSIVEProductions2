import { VercelRequest, VercelResponse } from '@vercel/node';

interface Room {
    id: string;
    host: string;
    timer: number;
    running: boolean;
    friends: string[];
}

let rooms: Record<string, Room> = {}; // simple in-memory storage

export default function handler(req: VercelRequest, res: VercelResponse) {
    const { method } = req;

    if (method === 'POST') {
        // Create room
        const { host, timer = 0 } = req.body;
        const id = Math.random().toString(36).substr(2, 8);
        rooms[id] = { id, host, timer, running: false, friends: [] };
        return res.status(201).json({ id });
    }

    if (method === 'GET') {
        const { id } = req.query;
        // If no id provided, return all rooms
        if (!id) {
            const list = Object.values(rooms).map(r => ({ id: r.id, host: r.host, timer: r.timer, running: r.running, friends: r.friends }));
            return res.json(list);
        }

        if (!rooms[id as string]) return res.status(404).json({ error: 'Room not found' });
        return res.json(rooms[id as string]);
    }

    if (method === 'PUT') {
        const { id, action, timer, friend } = req.body;
        if (!id || !rooms[id]) return res.status(404).json({ error: 'Room not found' });

        if (action === 'start') rooms[id].running = true;
        if (action === 'stop') rooms[id].running = false;
        if (action === 'updateTimer') rooms[id].timer = timer;
        if (action === 'addFriend') {
            // avoid duplicates
            if (!rooms[id].friends.includes(friend)) rooms[id].friends.push(friend);
        }

        if (action === 'removeFriend') {
            rooms[id].friends = rooms[id].friends.filter(f => f !== friend);
        }

        return res.json(rooms[id]);
    }

    if (method === 'DELETE') {
        const { id } = req.body;
        delete rooms[id as string];
        return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}