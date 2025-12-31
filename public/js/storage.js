import { db } from './firebase-config.js';
import { currentUser } from './auth.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function loadFromFirestore(entries, settings) {
    if (!db || !currentUser) return { entries, settings };
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                entries: data.entries || entries,
                settings: data.settings || settings
            };
        }
    } catch (e) {
        console.error('Error loading from Firestore:', e);
    }
    return { entries, settings };
}

export async function saveToFirestore(entries, settings) {
    if (!db || !currentUser) return;
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        // Get existing data to preserve climbing data
        const docSnap = await getDoc(docRef);
        const existingData = docSnap.exists() ? docSnap.data() : {};
        
        await setDoc(docRef, {
            ...existingData,
            entries: entries,
            settings: settings,
            lastUpdated: new Date().toISOString()
        });
        console.log('Data saved to Firestore');
    } catch (e) {
        console.error('Error saving to Firestore:', e);
    }
}

export async function loadClimbingFromFirestore() {
    if (!db || !currentUser) return { sessions: [] };
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                sessions: data.climbingSessions || []
            };
        }
    } catch (e) {
        console.error('Error loading climbing from Firestore:', e);
    }
    return { sessions: [] };
}

export async function saveClimbingToFirestore(climbingData) {
    if (!db || !currentUser) return;
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        // Get existing data to preserve weight data
        const docSnap = await getDoc(docRef);
        const existingData = docSnap.exists() ? docSnap.data() : {};
        
        await setDoc(docRef, {
            ...existingData,
            climbingSessions: climbingData.sessions,
            lastUpdated: new Date().toISOString()
        });
        console.log('Climbing data saved to Firestore');
    } catch (e) {
        console.error('Error saving climbing to Firestore:', e);
    }
}

export async function loadGymsFromFirestore() {
    if (!db || !currentUser) return ['Stone Age'];
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const gyms = data.gyms || ['Stone Age'];
            // Ensure Stone Age is always in the list
            if (!gyms.includes('Stone Age')) {
                gyms.unshift('Stone Age');
            }
            return gyms;
        }
    } catch (e) {
        console.error('Error loading gyms from Firestore:', e);
    }
    return ['Stone Age'];
}

export async function saveGymsToFirestore(gyms) {
    if (!db || !currentUser) return;
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        const existingData = docSnap.exists() ? docSnap.data() : {};
        
        await setDoc(docRef, {
            ...existingData,
            gyms: gyms,
            lastUpdated: new Date().toISOString()
        });
        console.log('Gyms saved to Firestore');
    } catch (e) {
        console.error('Error saving gyms to Firestore:', e);
    }
}

export async function loadUserColorsFromFirestore() {
    if (!db || !currentUser) return [];
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return data.userColors || [];
        }
    } catch (e) {
        console.error('Error loading user colors from Firestore:', e);
    }
    return [];
}

export async function saveUserColorsToFirestore(colors) {
    if (!db || !currentUser) return;
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        const existingData = docSnap.exists() ? docSnap.data() : {};
        
        await setDoc(docRef, {
            ...existingData,
            userColors: colors,
            lastUpdated: new Date().toISOString()
        });
        console.log('User colors saved to Firestore');
    } catch (e) {
        console.error('Error saving user colors to Firestore:', e);
    }
}

export async function loadChatterFromFirestore() {
    if (!db || !currentUser) return { items: [] };
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                items: data.chatterItems || []
            };
        }
    } catch (e) {
        console.error('Error loading chatter from Firestore:', e);
    }
    return { items: [] };
}

export async function saveChatterToFirestore(chatterData) {
    if (!db || !currentUser) return;
    try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        const existingData = docSnap.exists() ? docSnap.data() : {};
        
        await setDoc(docRef, {
            ...existingData,
            chatterItems: chatterData.items,
            lastUpdated: new Date().toISOString()
        });
        console.log('Chatter data saved to Firestore');
    } catch (e) {
        console.error('Error saving chatter to Firestore:', e);
    }
}
