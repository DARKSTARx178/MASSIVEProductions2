import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    AppState
} from 'react-native';
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '../../firebase/firebase';

interface User {
    uid: string;
    username: string;
    online: boolean;
    class: string;
    friends: string[];
}

export default function FriendsScreen() {
    const [friends, setFriends] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchName, setSearchName] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const db = getFirestore(app);
    const auth = getAuth();

    // Update online status using AppState
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);

        const setOnline = async (online: boolean) => {
            await updateDoc(userRef, { online });
        };

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') setOnline(true);
            else setOnline(false);
        });

        // Initially set online
        setOnline(true);

        return () => {
            setOnline(false);
            subscription.remove();
        };
    }, []);

    // Fetch current user + friends
    const fetchUserAndFriends = async () => {
        const user = auth.currentUser;
        if (!user) {
            setCurrentUser(null);
            setFriends([]);
            return;
        }
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;
        const userData = snap.data() as User;
        setCurrentUser({ uid: user.uid, ...userData });

        const friendUIDs: string[] = userData.friends || [];
        const friendDocs = await Promise.all(
            friendUIDs.map((fid) => getDoc(doc(db, 'users', fid)))
        );
        const friendList: User[] = friendDocs
            .filter((f) => f.exists())
            .map((f) => ({ uid: f.id, ...(f.data() as User) }));
        setFriends(friendList);
    };

    // Fetch all users for adding friends
    const fetchAllUsers = async () => {
        const user = auth.currentUser;
        if (!user) {
            setAllUsers([]);
            return;
        }
        const usersCol = collection(db, 'users');
        const userDocs = await getDocs(usersCol);
        const usersList: User[] = userDocs.docs
            .filter((d) => d.id !== user.uid) // exclude self
            .map((d) => ({ uid: d.id, ...(d.data() as User) }));
        setAllUsers(usersList);
    };

    useEffect(() => {
        fetchUserAndFriends();
        fetchAllUsers();

        const interval = setInterval(() => {
            fetchUserAndFriends();
            fetchAllUsers();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Add friend
    const handleAddFriend = async (friend: User) => {
        if (!currentUser) return; // can't add if not logged in
        const userRef = doc(db, 'users', currentUser.uid);
        const updatedFriends = [...(currentUser.friends || []), friend.uid];
        await updateDoc(userRef, { friends: updatedFriends });
        setCurrentUser({ ...currentUser, friends: updatedFriends });
        fetchUserAndFriends();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Friends</Text>

            {currentUser ? (
                <>
                    <Text style={{ marginBottom: 8 }}>Search users to add:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Search by username"
                        value={searchName}
                        onChangeText={setSearchName}
                    />

                    <FlatList
                        data={allUsers.filter(
                            (u) =>
                                u.username.toLowerCase().includes(searchName.toLowerCase()) &&
                                !(currentUser?.friends || []).includes(u.uid)
                        )}
                        keyExtractor={(item) => item.uid}
                        renderItem={({ item }) => (
                            <View style={styles.userItem}>
                                <Text>{item.username} ({item.class})</Text>
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => handleAddFriend(item)}
                                >
                                    <Text style={{ color: 'white' }}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No users found</Text>}
                    />

                    <Text style={{ marginTop: 20, fontWeight: 'bold' }}>Your friends:</Text>
                    <FlatList
                        data={friends}
                        keyExtractor={(item) => item.uid}
                        renderItem={({ item }) => (
                            <View style={styles.userItem}>
                                <Text>{item.username}</Text>
                                <Text style={{ color: item.online ? 'green' : 'gray' }}>
                                    {item.online ? '🟢 Online' : '⚪ Offline'}
                                </Text>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>You have no friends tuff</Text>}
                    />
                </>
            ) : (
                <>
                    <FlatList
                        data={[{ id: '1', name: 'Log in' }]}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={[styles.userItem, { justifyContent: 'center' }]}>
                                <Text>{item.name}</Text>
                            </View>
                        )}
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        marginBottom: 8,
    },
    addButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
});
