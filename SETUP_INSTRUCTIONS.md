# Firebase Setup Instructions

## Step 1: Enable Firestore
1. Go to https://console.firebase.google.com/project/life-tracker-123456/firestore
2. Click "Create Database"
3. Select "Start in test mode" (we'll secure it later)
4. Choose a location (e.g., europe-west)
5. Click "Enable"

## Step 2: Get Firebase Config
1. Go to https://console.firebase.google.com/project/life-tracker-123456/settings/general
2. Scroll down to "Your apps"
3. Click the Web icon (</>) to add a web app
4. Register app with name "Weight Tracker"
5. Copy the firebaseConfig values

## Step 3: Update index.html
Replace the placeholder values in `public/index.html`:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",           // Replace with your actual API key
    authDomain: "life-tracker-123456.firebaseapp.com",
    projectId: "life-tracker-123456",
    storageBucket: "life-tracker-123456.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",  // Replace with your sender ID
    appId: "YOUR_APP_ID"                  // Replace with your app ID
};
```

## Step 4: Deploy
Run: `firebase deploy`

Your app will be live at: https://life-tracker-123456.web.app
