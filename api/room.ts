import { VercelRequest, VercelResponse } from '@vercel/node';

interface Room {
    id: string;
    host: string;
    // optional display title for the room (separate from host)
    title?: string;
    // timer stored as seconds for accuracy
    timer: number;
    running: boolean;
    friends: string[];
    startedAt?: number; // ms timestamp when started
    initialTimer?: number; // original length in seconds
}

let rooms: Record<string, Room> = {}; // simple in-memory storage

export default function handler(req: VercelRequest, res: VercelResponse) {
    const { method } = req;

    if (method === 'POST') {
        // Create room
        const { host, timer = 0, title } = req.body;
        const id = Math.random().toString(36).substr(2, 8);
        // expect timer in seconds
        rooms[id] = { id, host, title, timer, running: false, friends: [], initialTimer: timer };
        return res.status(201).json({ id });
    }

    if (method === 'GET') {
        const { id } = req.query;
        // If no id provided, return all rooms (convert timer to seconds as-is)
        if (!id) {
            const list = Object.values(rooms).map(r => ({ id: r.id, host: r.host, title: r.title, timer: r.timer, running: r.running, friends: r.friends }));
            return res.json(list);
        }

        if (!rooms[id as string]) return res.status(404).json({ error: 'Room not found' });
        return res.json(rooms[id as string]);
    }

    if (method === 'PUT') {
        const { id, action, timer, friend } = req.body;
        if (!id || !rooms[id]) return res.status(404).json({ error: 'Room not found' });

        if (action === 'start') {
            rooms[id].running = true;
            rooms[id].startedAt = Date.now();
        }

        if (action === 'stop') {
            // compute remaining time based on startedAt
            if (rooms[id].running && rooms[id].startedAt) {
                const elapsed = Math.floor((Date.now() - rooms[id].startedAt) / 1000);
                rooms[id].timer = Math.max(0, rooms[id].timer - elapsed);
            }
            rooms[id].running = false;
            delete rooms[id].startedAt;
        }

        if (action === 'updateTimer') rooms[id].timer = timer;
        // setTimer expects { seconds: number }
        if (action === 'setTimer' && typeof timer === 'object' && typeof timer.seconds === 'number') {
            rooms[id].timer = Math.max(0, Math.floor(timer.seconds));
            rooms[id].initialTimer = rooms[id].timer;
            // if running, reset startedAt to now
            if (rooms[id].running) rooms[id].startedAt = Date.now();
        }
        if (action === 'addFriend') {
            // avoid duplicates
            if (!rooms[id].friends.includes(friend)) rooms[id].friends.push(friend);
        }

        if (action === 'removeFriend') {
            rooms[id].friends = rooms[id].friends.filter(f => f !== friend);
            // if no participants remain, delete room automatically
            if ((rooms[id].friends || []).length === 0) {
                delete rooms[id];
                return res.json({ success: true, deleted: true });
            }
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