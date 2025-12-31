import { setupAuthListener, signInWithGoogle, handleSignOut, toggleMenu } from './auth.js';
import { loadFromFirestore } from './storage.js';
import { entries, setEntries, addEntry, deleteEntry, renderEntryList } from './entries.js';
import { settings, setSettings, openSettings, closeSettings, saveSettings, updateSegment, addGoalSegment, removeSegment, generateGoalWeights } from './settings.js';
import { renderChart } from './chart.js';
import { initClimbing, renderClimbing, openNewSessionModal, closeSessionModal, saveSession, deleteSession, openClimbModal, closeClimbModal, updateGradeOptions, saveClimb, deleteClimb } from './climbing.js';
import { initChatter, openChatterModal, closeChatterModal, selectChatterType, saveChatter, deleteChatter, handleQuickChatterKeypress, handleQuickChatterSubmit, selectAndSaveChatterType, closeChatterTypeModal, confirmDeleteChatter, closeDeleteChatterModal, openChatterActions, closeChatterActionsModal, editChatterFromActions, openDeleteConfirmation } from './chatter.js';

let currentTab = 'climbing';

async function init() {
    document.getElementById('date').valueAsDate = new Date();
    const data = await loadFromFirestore(entries, settings);
    setEntries(data.entries);
    setSettings(data.settings);
    switchTab('climbing');
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
    
    // Show/hide content
    document.getElementById('weightContent').classList.toggle('hidden', tab !== 'weight');
    document.getElementById('climbingContent').classList.toggle('hidden', tab !== 'climbing');
    document.getElementById('chatterContent').classList.toggle('hidden', tab !== 'chatter');
    
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
const SWIPE_THRESHOLD = 50;
const tabs = ['climbing', 'weight', 'chatter'];

function handleSwipe() {
    const swipeDistanceX = touchEndX - touchStartX;
    const swipeDistanceY = touchEndY - touchStartY;
    
    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(swipeDistanceX) < SWIPE_THRESHOLD) return;
    if (Math.abs(swipeDistanceY) > Math.abs(swipeDistanceX)) return;
    
    const currentIndex = tabs.indexOf(currentTab);
    
    if (swipeDistanceX > 0 && currentIndex > 0) {
        // Swipe right - go to previous tab
        switchTab(tabs[currentIndex - 1]);
    } else if (swipeDistanceX < 0 && currentIndex < tabs.length - 1) {
        // Swipe left - go to next tab
        switchTab(tabs[currentIndex + 1]);
    }
}

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });

// Expose functions to window for inline event handlers
window.signInWithGoogle = signInWithGoogle;
window.handleSignOut = handleSignOut;
window.toggleMenu = toggleMenu;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings = () => saveSettings(entries, render);
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
