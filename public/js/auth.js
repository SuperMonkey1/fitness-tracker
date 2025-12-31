import { auth, googleProvider } from './firebase-config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

export let currentUser = null;

export function signInWithGoogle() {
    signInWithPopup(auth, googleProvider)
        .then((result) => {
            console.log('Signed in successfully');
        })
        .catch((error) => {
            console.error('Error signing in:', error);
            alert('Failed to sign in: ' + error.message);
        });
}

export function handleSignOut() {
    signOut(auth)
        .then(() => {
            console.log('Signed out successfully');
        })
        .catch((error) => {
            console.error('Error signing out:', error);
        });
}

export function setupAuthListener(onSignIn, onSignOut) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            document.getElementById('authContainer').classList.add('hidden');
            document.getElementById('appContainer').classList.remove('hidden');
            try {
                await onSignIn();
            } catch (e) {
                console.error('Error in onSignIn:', e);
            }
            if (window.showAppScreen) window.showAppScreen();
        } else {
            currentUser = null;
            document.getElementById('appContainer').classList.add('hidden');
            if (window.showAuthScreen) window.showAuthScreen();
            if (onSignOut) onSignOut();
        }
    });
}

export function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('hidden');
}
