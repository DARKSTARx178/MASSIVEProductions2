import * as SecureStore from 'expo-secure-store';

export async function saveItem(key: string, value: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, value); // ✅ Web
    } else {
        await SecureStore.setItemAsync(key, value); // ✅ iOS/Android
    }
}

export async function getItem(key: string) {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
    } else {
        return await SecureStore.getItemAsync(key);
    }
}

export async function deleteItem(key: string) {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
    } else {
        await SecureStore.deleteItemAsync(key);
    }
}
