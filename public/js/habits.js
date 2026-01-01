import { saveHabitsToFirestore, loadHabitsFromFirestore } from './storage.js';

export let habitItems = [];
export let habitCheckHistory = {}; // { habitId: { 'YYYY-MM-DD': true/false/undefined } }
export let habitCellValues = {}; // { habitId: { 'YYYY-MM-DD': customValue } }
let isQKeyPressed = false;

export function setHabitItems(items) {
    habitItems = items || [];
}

export function setHabitCheckHistory(history) {
    habitCheckHistory = history || {};
}

export function setHabitCellValues(values) {
    habitCellValues = values || {};
}

export async function initHabits() {
    const data = await loadHabitsFromFirestore();
    habitItems = data.items || [];
    habitCheckHistory = data.checkHistory || {};
    habitCellValues = data.cellValues || {};
    
    // Set up Q key listeners
    setupQKeyListeners();
    
    // Add dummy habit for testing if no habits exist
    if (habitItems.length === 0) {
        const dummyHabitId = 'dummy-habit-' + Date.now();
        const today = new Date();
        
        habitItems.push({
            id: dummyHabitId,
            title: 'Morning Workout',
            points: 5,
            hasNumericalValue: true,
            numericalValue: 10,
            currentValue: 20,
            changeValue: 2,
            createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
        });
        
        // Create 5-day history
        habitCheckHistory[dummyHabitId] = {};
        for (let i = 4; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            habitCheckHistory[dummyHabitId][dateStr] = i % 2 === 0; // Alternate checked/unchecked
        }
        
        // Save dummy data
        await saveHabitsToFirestore({ items: habitItems, checkHistory: habitCheckHistory, cellValues: habitCellValues });
    }
    
    renderHabits();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDateString(daysOffset) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
}

export function renderHabits() {
    const container = document.getElementById('habitsContent');
    if (!container) return;
    
    // Save scroll position before re-rendering
    const habitsList = document.getElementById('habitsList');
    const scrollLeft = habitsList ? habitsList.scrollLeft : 0;
    const scrollTop = habitsList ? habitsList.scrollTop : 0;
    
    const isEmpty = habitItems.length === 0;
    
    container.innerHTML = `
        <div id="habitsList" class="${isEmpty ? '' : ''}" style="${isEmpty ? 'overflow: hidden;' : 'height: 100%; overflow-x: auto; overflow-y: auto; padding-bottom: 20px;'}">
            ${renderHabitMatrix()}
        </div>
    `;
    
    // Restore scroll position after re-rendering
    const newHabitsList = document.getElementById('habitsList');
    if (newHabitsList && (scrollLeft > 0 || scrollTop > 0)) {
        newHabitsList.scrollLeft = scrollLeft;
        newHabitsList.scrollTop = scrollTop;
    }
    
    // Add mouse wheel scroll handler for horizontal scrolling
    if (newHabitsList) {
        newHabitsList.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                newHabitsList.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    }
}

function renderHabitMatrix() {
    if (habitItems.length === 0) {
        return `
            <div class="text-center py-12">
                <p class="text-gray-500 mb-2">No habits yet</p>
                <p class="text-sm text-gray-400">Start a habit from the Chatter tab</p>
            </div>
        `;
    }
    
    // Start from January 1, 2026 and show 18 days
    const startDate = new Date('2026-01-01');
    const days = [];
    for (let i = 0; i < 18; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const todayStr = getTodayDateString();
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const isMonday = dayOfWeek === 1;
        days.push({
            offset: i,
            dateStr: dateStr,
            isToday: dateStr === todayStr,
            isMonday: isMonday
        });
    }
    
    const daysHeader = days.map(day => {
        const fontWeight = day.isToday ? '700' : '500';
        const color = day.isToday ? '#059669' : '#6b7280';
        const borderLeft = day.isMonday ? 'border-left: 1px solid #e5e7eb;' : '';
        return `<div onclick="openDeleteDateModal('${day.dateStr}')" style="width: 60px; flex-shrink: 0; padding: 0.5rem; text-align: center; font-size: 0.75rem; font-weight: ${fontWeight}; color: ${color}; cursor: pointer; user-select: none; ${borderLeft}" title="Tap to clear this day">${formatDateShort(day.dateStr)}</div>`;
    }).join('');
    
    const habitRows = habitItems.map(habit => {
        const habitCells = days.map(day => {
            const state = habitCheckHistory[habit.id]?.[day.dateStr];
            const bgColor = state === true ? '#10b981' : state === false ? '#ef4444' : '#e5e7eb';
            const icon = state === true ? '✓' : state === false ? '✗' : '';
            const textColor = state === true || state === false ? 'white' : '#9ca3af';
            
            // Show custom value or goal value for this day
            let displayValue = '';
            const customValue = habitCellValues[habit.id]?.[day.dateStr];
            if (customValue !== undefined && customValue !== null && customValue !== '') {
                displayValue = `<div style="font-size: 0.65rem; margin-top: 2px; opacity: 0.8;">${customValue}</div>`;
            } else if (habit.hasNumericalValue && habit.changeValue) {
                const daysFromStart = day.offset;
                const targetValue = (habit.numericalValue || 0) + (daysFromStart * habit.changeValue);
                displayValue = `<div style="font-size: 0.65rem; margin-top: 2px; opacity: 0.8;">${targetValue}</div>`;
            }
            
            const borderLeft = day.isMonday ? 'border-left: 1px solid #e5e7eb;' : '';
            
            return `<div style="width: 60px; flex-shrink: 0; padding: 0.25rem; text-align: center; ${borderLeft}">
                <button 
                    onclick="toggleHabitCheck('${habit.id}', '${day.dateStr}')"
                    style="width: 48px; height: 48px; border-radius: 8px; background-color: ${bgColor}; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 1.25rem; color: ${textColor}; transition: all 0.2s; font-weight: 700;"
                    onmouseover="this.style.opacity='0.8'"
                    onmouseout="this.style.opacity='1'"
                >${icon}${displayValue}</button>
            </div>`;
        }).join('');
        
        const valueInfo = habit.hasNumericalValue ? ` • Current: ${habit.currentValue}${habit.changeValue ? ` (+${habit.changeValue}/day)` : ''}` : '';
        
        return `<div style="display: flex; margin-bottom: 0.25rem; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem;">
            <div onclick="openHabitDetail('${habit.id}')" style="width: 150px; flex-shrink: 0; padding: 0.5rem; position: sticky; left: 0; background-color: #fdfdf9; z-index: 5; cursor: pointer;" title="Tap to view details">
                <div style="font-weight: 500; font-size: 0.875rem; color: #1f2937;">${escapeHtml(habit.title)}</div>
                <div style="font-size: 0.75rem; color: #6b7280;">${habit.points} pts${valueInfo}</div>
            </div>
            ${habitCells}
        </div>`;
    }).join('');
    
    return `<div style="min-width: max-content;">
        <div style="display: flex; margin-bottom: 0.5rem; position: sticky; top: 0; background-color: #fdfdf9; z-index: 10; padding: 0.5rem 0;">
            <div style="width: 150px; flex-shrink: 0; padding: 0.5rem; position: sticky; left: 0; background-color: #fdfdf9; z-index: 15; font-weight: 600; font-size: 0.875rem;">Habit</div>
            ${daysHeader}
        </div>
        ${habitRows}
    </div>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export async function toggleHabitCheck(habitId, dateStr) {
    // If Q key is pressed, prompt for custom value
    console.log('toggleHabitCheck called, isQKeyPressed:', isQKeyPressed);
    if (isQKeyPressed) {
        console.log('Opening custom value dialog');
        await handleCustomCellValue(habitId, dateStr);
        return;
    }
    
    // Initialize history for this habit if it doesn't exist
    if (!habitCheckHistory[habitId]) {
        habitCheckHistory[habitId] = {};
    }
    
    // Cycle through states: undefined/null -> true -> false -> undefined
    const currentState = habitCheckHistory[habitId][dateStr];
    
    if (currentState === undefined || currentState === null) {
        habitCheckHistory[habitId][dateStr] = true;
    } else if (currentState === true) {
        habitCheckHistory[habitId][dateStr] = false;
    } else {
        delete habitCheckHistory[habitId][dateStr];
    }
    
    // Update numerical value if applicable and checking for today
    const todayStr = getTodayDateString();
    const habit = habitItems.find(h => h.id === habitId);
    if (habit && habit.hasNumericalValue && habit.changeValue && dateStr === todayStr) {
        const newState = habitCheckHistory[habitId][dateStr];
        if (newState === true && currentState !== true) {
            // Changed to checked, increment
            habit.currentValue = (habit.currentValue || habit.numericalValue || 0) + habit.changeValue;
        } else if (currentState === true && newState !== true) {
            // Changed from checked, decrement
            habit.currentValue = (habit.currentValue || habit.numericalValue || 0) - habit.changeValue;
        }
    }
    
    // Save to Firestore
    await saveHabitsToFirestore({ 
        items: habitItems, 
        checkHistory: habitCheckHistory,
        cellValues: habitCellValues
    });
    
    // Re-render
    renderHabits();
}

export function viewHabitHistory(habitId) {
    const habit = habitItems.find(h => h.id === habitId);
    if (!habit) return;
    
    const history = habitCheckHistory[habitId] || {};
    const sortedDates = Object.keys(history).sort().reverse();
    
    let historyHTML = '';
    if (sortedDates.length > 0) {
        const items = sortedDates.slice(0, 30).map(date => {
            const state = history[date];
            const formattedDate = new Date(date).toLocaleDateString(undefined, { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            const statusText = state === true ? '✓ Done' : state === false ? '✗ Not done' : '— Neutral';
            const statusColor = state === true ? 'text-green-600' : state === false ? 'text-red-600' : 'text-gray-400';
            
            return '<div class="flex items-center justify-between py-2 border-b border-gray-100">' +
                '<span class="text-sm text-gray-700">' + formattedDate + '</span>' +
                '<span class="text-sm ' + statusColor + '">' + statusText + '</span>' +
                '</div>';
        });
        historyHTML = items.join('');
    } else {
        historyHTML = '<p class="text-sm text-gray-500 text-center py-4">No history yet</p>';
    }
    
    let modal = document.getElementById('habitHistoryModal');
    if (!modal) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'habitHistoryModal';
        modalDiv.className = 'modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const title = document.createElement('h2');
        title.id = 'habitHistoryTitle';
        title.className = 'text-lg font-bold mb-2';
        
        const content = document.createElement('div');
        content.id = 'habitHistoryContent';
        content.className = 'max-h-96 overflow-y-auto';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn-secondary w-full mt-4';
        closeBtn.textContent = 'Close';
        closeBtn.onclick = closeHabitHistoryModal;
        
        modalContent.appendChild(title);
        modalContent.appendChild(content);
        modalContent.appendChild(closeBtn);
        modalDiv.appendChild(modalContent);
        document.body.appendChild(modalDiv);
        modal = modalDiv;
    }
    
    document.getElementById('habitHistoryTitle').textContent = habit.title;
    document.getElementById('habitHistoryContent').innerHTML = historyHTML;
    modal.classList.remove('hidden');
}

export function closeHabitHistoryModal() {
    const modal = document.getElementById('habitHistoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

let dateToDelete = null;

export function openDeleteDateModal(dateStr) {
    dateToDelete = dateStr;
    
    let modal = document.getElementById('deleteDateModal');
    if (!modal) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'deleteDateModal';
        modalDiv.className = 'modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const title = document.createElement('h2');
        title.className = 'text-lg font-bold mb-4';
        title.textContent = 'Clear Date Data?';
        
        const message = document.createElement('p');
        message.id = 'deleteDateMessage';
        message.className = 'text-sm text-gray-600 mb-4';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex gap-2';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-danger flex-1';
        deleteBtn.textContent = 'Clear';
        deleteBtn.onclick = confirmDeleteDate;
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary flex-1';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = closeDeleteDateModal;
        
        buttonContainer.appendChild(deleteBtn);
        buttonContainer.appendChild(cancelBtn);
        
        modalContent.appendChild(title);
        modalContent.appendChild(message);
        modalContent.appendChild(buttonContainer);
        modalDiv.appendChild(modalContent);
        document.body.appendChild(modalDiv);
        modal = modalDiv;
    }
    
    const formattedDate = new Date(dateStr).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('deleteDateMessage').textContent = `Clear all habit data for ${formattedDate}?`;
    modal.classList.remove('hidden');
}

export function closeDeleteDateModal() {
    const modal = document.getElementById('deleteDateModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    dateToDelete = null;
}

function setupQKeyListeners() {
    // Remove existing listeners to avoid duplicates
    document.removeEventListener('keydown', handleQKeyDown);
    document.removeEventListener('keyup', handleQKeyUp);
    
    // Add key listeners
    document.addEventListener('keydown', handleQKeyDown);
    document.addEventListener('keyup', handleQKeyUp);
}

function handleQKeyDown(e) {
    if (e.key === 'q' || e.key === 'Q') {
        isQKeyPressed = true;
        console.log('Q key pressed - custom value mode active');
    }
}

function handleQKeyUp(e) {
    if (e.key === 'q' || e.key === 'Q') {
        isQKeyPressed = false;
        console.log('Q key released - normal mode');
    }
}

async function handleCustomCellValue(habitId, dateStr) {
    // Initialize cell values for this habit if needed
    if (!habitCellValues[habitId]) {
        habitCellValues[habitId] = {};
    }
    
    const currentValue = habitCellValues[habitId][dateStr] || '';
    const newValue = prompt('Enter custom value for this cell:', currentValue);
    
    if (newValue !== null) { // User didn't cancel
        if (newValue.trim() === '') {
            // Empty value - delete the custom value
            delete habitCellValues[habitId][dateStr];
        } else {
            // Set the custom value
            habitCellValues[habitId][dateStr] = newValue.trim();
        }
        
        // Save to Firestore
        await saveHabitsToFirestore({ 
            items: habitItems, 
            checkHistory: habitCheckHistory,
            cellValues: habitCellValues
        });
        
        // Re-render
        renderHabits();
    }
}

export async function confirmDeleteDate() {
    if (!dateToDelete) return;
    
    // Remove the date from all habits
    for (const habitId in habitCheckHistory) {
        if (habitCheckHistory[habitId][dateToDelete] !== undefined) {
            delete habitCheckHistory[habitId][dateToDelete];
        }
    }
    
    // Also remove custom cell values for this date
    for (const habitId in habitCellValues) {
        if (habitCellValues[habitId][dateToDelete] !== undefined) {
            delete habitCellValues[habitId][dateToDelete];
        }
    }
    
    // Save to Firestore
    await saveHabitsToFirestore({ 
        items: habitItems, 
        checkHistory: habitCheckHistory,
        cellValues: habitCellValues
    });
    
    closeDeleteDateModal();
    renderHabits();
}

export function openHabitDetail(habitId) {
    const habit = habitItems.find(h => h.id === habitId);
    if (!habit) return;
    
    let modal = document.getElementById('habitDetailViewModal');
    if (!modal) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'habitDetailViewModal';
        modalDiv.className = 'modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.maxWidth = '500px';
        
        modalContent.innerHTML = `
            <h2 class="text-lg font-bold mb-4">Habit Details</h2>
            <input type="hidden" id="habitDetailId" value="">
            
            <div class="form-group">
                <label class="form-label">Habit Name</label>
                <input type="text" id="habitDetailTitle" class="form-input" placeholder="Habit name">
            </div>
            
            <div class="form-group">
                <label class="form-label">Points (1-10)</label>
                <input type="number" id="habitDetailPoints" class="form-input" min="1" max="10" value="1">
            </div>
            
            <div class="form-group">
                <label class="flex items-center gap-2">
                    <input type="checkbox" id="habitDetailHasNumerical" disabled>
                    <span class="text-sm text-gray-600">Track numerical value: <span id="habitDetailNumericalInfo"></span></span>
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea id="habitDetailNotes" class="form-input" rows="4" placeholder="Add notes about this habit..."></textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label text-xs text-gray-500">Created</label>
                <div id="habitDetailCreated" class="text-sm text-gray-600"></div>
            </div>
            
            <div class="flex gap-2 mt-4">
                <button onclick="saveHabitDetail()" class="btn-primary flex-1">Save</button>
                <button onclick="deleteHabitFromDetail()" class="btn-danger">Delete</button>
                <button onclick="closeHabitDetail()" class="btn-secondary flex-1">Cancel</button>
            </div>
        `;
        
        modalDiv.appendChild(modalContent);
        document.body.appendChild(modalDiv);
        modal = modalDiv;
    }
    
    document.getElementById('habitDetailId').value = habit.id;
    document.getElementById('habitDetailTitle').value = habit.title;
    document.getElementById('habitDetailPoints').value = habit.points || 1;
    document.getElementById('habitDetailNotes').value = habit.notes || '';
    
    const hasNumerical = habit.hasNumericalValue || false;
    document.getElementById('habitDetailHasNumerical').checked = hasNumerical;
    
    if (hasNumerical) {
        const info = `Start: ${habit.numericalValue || 0}, Current: ${habit.currentValue || 0}, Daily: +${habit.changeValue || 0}`;
        document.getElementById('habitDetailNumericalInfo').textContent = info;
    } else {
        document.getElementById('habitDetailNumericalInfo').textContent = 'No';
    }
    
    if (habit.createdAt) {
        const date = new Date(habit.createdAt);
        document.getElementById('habitDetailCreated').textContent = date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    modal.classList.remove('hidden');
}

export function closeHabitDetail() {
    const modal = document.getElementById('habitDetailViewModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

export async function saveHabitDetail() {
    const habitId = document.getElementById('habitDetailId').value;
    const habit = habitItems.find(h => h.id === habitId);
    if (!habit) return;
    
    habit.title = document.getElementById('habitDetailTitle').value.trim();
    habit.points = parseInt(document.getElementById('habitDetailPoints').value) || 1;
    habit.points = Math.max(1, Math.min(10, habit.points));
    habit.notes = document.getElementById('habitDetailNotes').value.trim();
    habit.updatedAt = new Date().toISOString();
    
    await saveHabitsToFirestore({ 
        items: habitItems, 
        checkHistory: habitCheckHistory,
        cellValues: habitCellValues
    });
    
    closeHabitDetail();
    renderHabits();
}

export async function deleteHabitFromDetail() {
    const habitId = document.getElementById('habitDetailId').value;
    
    if (!confirm('Delete this habit and all its history?')) return;
    
    // Remove habit from items
    const index = habitItems.findIndex(h => h.id === habitId);
    if (index > -1) {
        habitItems.splice(index, 1);
    }
    
    // Remove habit history
    if (habitCheckHistory[habitId]) {
        delete habitCheckHistory[habitId];
    }
    
    // Remove custom cell values
    if (habitCellValues[habitId]) {
        delete habitCellValues[habitId];
    }
    
    await saveHabitsToFirestore({ 
        items: habitItems, 
        checkHistory: habitCheckHistory,
        cellValues: habitCellValues
    });
    
    closeHabitDetail();
    renderHabits();
}

// Make functions globally accessible
if (typeof window !== 'undefined') {
    window.toggleHabitCheck = toggleHabitCheck;
    window.viewHabitHistory = viewHabitHistory;
    window.closeHabitHistoryModal = closeHabitHistoryModal;
    window.openDeleteDateModal = openDeleteDateModal;
    window.closeDeleteDateModal = closeDeleteDateModal;
    window.confirmDeleteDate = confirmDeleteDate;
    window.openHabitDetail = openHabitDetail;
    window.closeHabitDetail = closeHabitDetail;
    window.saveHabitDetail = saveHabitDetail;
    window.deleteHabitFromDetail = deleteHabitFromDetail;
}
