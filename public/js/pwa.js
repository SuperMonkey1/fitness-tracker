// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Check for updates every 30 seconds
        setInterval(() => {
          registration.update();
        }, 30000);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
  
  // Listen for new service worker
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('New service worker activated, reloading...');
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
});
