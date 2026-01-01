// Register service worker with automatic updates
if ('serviceWorker' in navigator) {
  let refreshing = false;
  
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Check for updates immediately on page load
        registration.update();
        
        // Check for updates every 30 seconds
        setInterval(() => {
          registration.update();
        }, 30000);
        
        // Listen for new service worker waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('New service worker found, installing...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is installed and ready, it will activate immediately
              // due to skipWaiting() in service-worker.js
              console.log('New version installed, will activate immediately');
            }
          });
        });
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
  
  // Listen for controller change (new service worker took over)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('New service worker activated, reloading for updates...');
    window.location.reload();
  });
}

// Force update function
function forceUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        registration.unregister().then(() => {
          // Clear all caches
          caches.keys().then(names => {
            Promise.all(names.map(name => caches.delete(name))).then(() => {
              console.log('Caches cleared, reloading...');
              window.location.reload(true);
            });
          });
        });
      } else {
        window.location.reload(true);
      }
    });
  } else {
    window.location.reload(true);
  }
}

// Expose globally
window.forceUpdate = forceUpdate;

// Handle install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show install button (you can add a button in the UI if you want)
  console.log('App can be installed');
});

window.addEventListener('appinstalled', () => {
  console.log('App was installed');
  deferredPrompt = null;
  // Hide the install button after installation
  hideAddToHomeButton();
});

// Check if running as standalone (already installed)
function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// Hide the add to home screen button
function hideAddToHomeButton() {
  const btn = document.getElementById('addToHomeBtn');
  if (btn) btn.style.display = 'none';
}

// Detect iOS
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Add to home screen function
function addToHomeScreen() {
  // Close the menu
  const menu = document.getElementById('menu');
  if (menu) menu.classList.add('hidden');
  
  // Check if already installed
  if (isAppInstalled()) {
    alert('This app is already installed on your device!');
    return;
  }
  
  // For iOS - show instructions
  if (isIOS()) {
    alert('To add this app to your home screen:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm');
    return;
  }
  
  // For Android/Chrome - use the deferred prompt
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  } else {
    // Browser doesn't support install prompt or app is already installable
    alert('To add this app to your home screen:\n\nOn Chrome: Tap the menu (⋮) and select "Add to Home Screen" or "Install App"\n\nOn other browsers: Look for an install option in the browser menu');
  }
}

// Expose globally
window.addToHomeScreen = addToHomeScreen;

// Hide the button on page load if app is already installed
window.addEventListener('load', () => {
  if (isAppInstalled()) {
    hideAddToHomeButton();
  }
});
