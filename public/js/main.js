import { setupAuthListener, signInWithGoogle, handleSignOut, toggleMenu, currentUser } from './auth.js';
import { loadFromFirestore } from './storage.js';
import { entries, setEntries, addEntry, deleteEntry, renderEntryList } from './entries.js';
import { settings, setSettings, openSettings, closeSettings, saveSettings, updateSegment, addGoalSegment, removeSegment, generateGoalWeights } from './settings.js';
import { renderChart } from './chart.js';
import { initClimbing, renderClimbing, openNewSessionModal, closeSessionModal, saveSession, deleteSession, openClimbModal, closeClimbModal, updateGradeOptions, saveClimb, deleteClimb } from './climbing.js';
import { initChatter, openChatterModal, closeChatterModal, selectChatterType, saveChatter, deleteChatter, handleQuickChatterKeypress, handleQuickChatterSubmit, selectAndSaveChatterType, closeChatterTypeModal, confirmDeleteChatter, closeDeleteChatterModal, openChatterActions, closeChatterActionsModal, editChatterFromActions, openDeleteConfirmation } from './chatter.js';
import { initProjects } from './projects.js';
import { initHabits } from './habits.js';

const APP_VERSION = '1.0.6';
let currentTab = 'climbing';
const PRIVILEGED_USER_ID = 'A1goCM5W0KVq3csW25QxNEvN9dN2';

function configureTabs() {
    const isPrivilegedUser = currentUser && currentUser.uid === PRIVILEGED_USER_ID;
    const climbingTab = document.getElementById('climbingTab');
    const weightTab = document.getElementById('weightTab');
    
    if (isPrivilegedUser) {
        climbingTab.classList.remove('hidden');
        weightTab.classList.remove('hidden');
    } else {
        climbingTab.classList.add('hidden');
        weightTab.classList.add('hidden');
    }
}

function getDefaultTab() {
    const isPrivilegedUser = currentUser && currentUser.uid === PRIVILEGED_USER_ID;
    return isPrivilegedUser ? 'climbing' : 'chatter';
}

async function init() {
    document.getElementById('date').valueAsDate = new Date();
    const data = await loadFromFirestore(entries, settings);
    setEntries(data.entries);
    setSettings(data.settings);
    configureTabs();
    switchTab(getDefaultTab());
    // Ensure loading screen is hidden after app init completes
    if (window && typeof window.hideLoadingScreen === 'function') {
        try { window.hideLoadingScreen(); } catch (e) { /* ignore */ }
    }
}

function render() {
    renderChart(entries, settings);
    renderEntryList(settings);
}

function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.getElementById('weightTab').classList.toggle('active', tab === 'weight');
    document.getElementById('climbingTab').classList.toggle('active', tab === 'climbing');
    document.getElementById('chatterTab').classList.toggle('active', tab === 'chatter');
    document.getElementById('habitsTab').classList.toggle('active', tab === 'habits');
    document.getElementById('projectsTab').classList.toggle('active', tab === 'projects');
    
    // Scroll the active tab into view
    const activeTabBtn = document.getElementById(tab + 'Tab');
    if (activeTabBtn) {
        activeTabBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    
    // Show/hide content
    document.getElementById('weightContent').classList.toggle('hidden', tab !== 'weight');
    document.getElementById('climbingContent').classList.toggle('hidden', tab !== 'climbing');
    document.getElementById('chatterContent').classList.toggle('hidden', tab !== 'chatter');
    document.getElementById('habitsContent').classList.toggle('hidden', tab !== 'habits');
    document.getElementById('projectsContent').classList.toggle('hidden', tab !== 'projects');
    
    // Render appropriate content
    if (tab === 'weight') {
        const dateInput = document.getElementById('date');
        if (dateInput && !dateInput.value) {
            dateInput.valueAsDate = new Date();
        }
        render();
    } else if (tab === 'climbing') {
        initClimbing();
    } else if (tab === 'chatter') {
        initChatter();
    } else if (tab === 'habits') {
        initHabits();
    } else if (tab === 'projects') {
        initProjects();
    }
}

// Set up auth listener
setupAuthListener(init);

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('menu');
    if (!menu.classList.contains('hidden') && !e.target.closest('#menu') && e.target.textContent !== '☰') {
        toggleMenu();
    }
});

// Swipe gesture handling for tab switching
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let touchStartTarget = null;
const SWIPE_THRESHOLD = 50;

function getAvailableTabs() {
    const isPrivilegedUser = currentUser && currentUser.uid === PRIVILEGED_USER_ID;
    return isPrivilegedUser ? ['climbing', 'weight', 'chatter', 'habits', 'projects'] : ['chatter', 'habits', 'projects'];
}

function isScrollableContent(element) {
    // Check if touch started in a scrollable area
    if (!element) return false;
    
    // Check if element or any parent is a scrollable content area
    let current = element;
    while (current && current !== document.body) {
        const id = current.id;
        const overflow = window.getComputedStyle(current).overflowX;
        
        // Disable swipe if inside scrollable content areas
        if (id === 'habitsList' || id === 'habitsContent' || 
            id === 'chatterList' || id === 'chatterContent' ||
            id === 'projectsContent' || overflow === 'auto' || overflow === 'scroll') {
            return true;
        }
        current = current.parentElement;
    }
    return false;
}

function handleSwipe() {
    const swipeDistanceX = touchEndX - touchStartX;
    const swipeDistanceY = touchEndY - touchStartY;
    
    // Don't handle swipe if started in scrollable content
    if (isScrollableContent(touchStartTarget)) return;
    
    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(swipeDistanceX) < SWIPE_THRESHOLD) return;
    if (Math.abs(swipeDistanceY) > Math.abs(swipeDistanceX)) return;
    
    const availableTabs = getAvailableTabs();
    const currentIndex = availableTabs.indexOf(currentTab);
    
    if (swipeDistanceX > 0 && currentIndex > 0) {
        // Swipe right - go to previous tab
        switchTab(availableTabs[currentIndex - 1]);
    } else if (swipeDistanceX < 0 && currentIndex < availableTabs.length - 1) {
        // Swipe left - go to next tab
        switchTab(availableTabs[currentIndex + 1]);
    }
}

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchStartTarget = e.target;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });

function openAbout() {
    const modal = document.getElementById('aboutModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Close the menu
        const menu = document.getElementById('menu');
        if (menu) menu.classList.add('hidden');
    }
}

function closeAbout() {
    const modal = document.getElementById('aboutModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Expose functions to window for inline event handlers
window.signInWithGoogle = signInWithGoogle;
window.handleSignOut = handleSignOut;
window.toggleMenu = toggleMenu;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings = () => saveSettings(entries, render);
window.openAbout = openAbout;
window.closeAbout = closeAbout;
window.updateSegment = updateSegment;
window.addGoalSegment = addGoalSegment;
window.removeSegment = removeSegment;
window.generateGoalWeights = generateGoalWeights;
window.addEntry = () => addEntry(settings, render);
window.deleteEntry = (date) => deleteEntry(date, settings, render);
window.switchTab = switchTab;

// Climbing functions
window.openNewSessionModal = openNewSessionModal;
window.closeSessionModal = closeSessionModal;
window.saveSession = saveSession;
window.deleteSession = deleteSession;
window.openClimbModal = openClimbModal;
window.closeClimbModal = closeClimbModal;
window.updateGradeOptions = updateGradeOptions;
window.saveClimb = saveClimb;
window.deleteClimb = deleteClimb;

// Chatter functions
window.openChatterModal = openChatterModal;
window.closeChatterModal = closeChatterModal;
window.selectChatterType = selectChatterType;
window.saveChatter = saveChatter;
window.deleteChatter = deleteChatter;
window.handleQuickChatterKeypress = handleQuickChatterKeypress;
window.handleQuickChatterSubmit = handleQuickChatterSubmit;
window.selectAndSaveChatterType = selectAndSaveChatterType;
window.closeChatterTypeModal = closeChatterTypeModal;
window.confirmDeleteChatter = confirmDeleteChatter;
window.closeDeleteChatterModal = closeDeleteChatterModal;
window.openChatterActions = openChatterActions;
window.closeChatterActionsModal = closeChatterActionsModal;
window.editChatterFromActions = editChatterFromActions;
window.openDeleteConfirmation = openDeleteConfirmation;

// Make version available globally
window.APP_VERSION = APP_VERSION;
