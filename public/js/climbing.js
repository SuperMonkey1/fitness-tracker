import { saveClimbingToFirestore, loadClimbingFromFirestore, loadGymsFromFirestore, saveGymsToFirestore, loadUserColorsFromFirestore, saveUserColorsToFirestore } from './storage.js';

const GRADES = {
    boulder: ['VB', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8+'],
    'top-rope': ['6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a', '8a+', '8b']
};

const CLIMB_TYPES = ['boulder', 'top-rope'];
const ATTEMPTS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const COLORS = [
    { name: 'white', hex: '#F5F5F5' },
    { name: 'yellow', hex: '#F7B500' },
    { name: 'orange', hex: '#FA4F00' },
    { name: 'red', hex: '#BB1E10' },
    { name: 'pink', hex: '#FF208D' },
    { name: 'neon green', hex: '#B5E61D' },
    { name: 'satin green', hex: '#57A639' },
    { name: 'blue', hex: '#2A5598' },
    { name: 'purple', hex: '#844C82' },
    { name: 'brown', hex: '#8B4513' },
    { name: 'black', hex: '#0E0E10' }
];

export let climbingSessions = [];
let currentSessionId = null;
let currentClimbId = null;
let sessionToCopy = null;
let userGyms = ['Stone Age'];
let userColors = [];

export function setClimbingSessions(sessions) {
    climbingSessions = sessions || [];
}

export async function initClimbing() {
    const data = await loadClimbingFromFirestore();
    climbingSessions = data.sessions || [];
    userGyms = await loadGymsFromFirestore();
    userColors = await loadUserColorsFromFirestore();
    renderClimbing();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function renderClimbing() {
    const container = document.getElementById('climbingContent');
    if (!container) return;
    
    container.innerHTML = `
        <div id="sessionsList" class="space-y-4 pb-20">
            ${renderSessionsList()}
        </div>
        
        <!-- Add Session FAB -->
        <button onclick="openNewSessionModal()" class="fab" title="Add new climbing session">+</button>
        
        <!-- New Session Modal -->
        <div id="sessionModal" class="hidden modal-overlay">
            <div class="modal-content">
                <h2 class="text-lg font-bold mb-4">New Climbing Session</h2>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" id="sessionDate" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Gym</label>
                    <div id="gymChips" class="flex flex-wrap gap-2 mb-2">
                        ${userGyms.map((gym, i) => `
                            <button type="button" onclick="selectGym('${gym.replace(/'/g, "\\'")}')" 
                                class="chip-button ${i === 0 ? 'chip-selected' : ''}" 
                                data-gym="${gym}">
                                ${gym}
                            </button>
                        `).join('')}
                        <button type="button" onclick="showAddGymInput()" class="chip-button chip-add">+ Add Gym</button>
                    </div>
                    <div id="addGymContainer" class="hidden flex gap-2 mt-2">
                        <input type="text" id="newGymName" class="form-input flex-1" placeholder="New gym name">
                        <button onclick="addNewGym()" class="btn-primary">Add</button>
                        <button onclick="hideAddGymInput()" class="btn-secondary">Cancel</button>
                    </div>
                    <input type="hidden" id="sessionGym" value="${userGyms[0] || 'Stone Age'}">
                </div>
                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <textarea id="sessionNotes" class="form-input" rows="2" placeholder="Session notes..."></textarea>
                </div>
                <div class="flex gap-2">
                    <button onclick="saveSession()" class="btn-primary flex-1">Save</button>
                    <button onclick="closeSessionModal()" class="btn-secondary flex-1">Cancel</button>
                </div>
            </div>
        </div>
        
        <!-- New Climb Modal -->
        <div id="climbModal" class="hidden modal-overlay">
            <div class="modal-content">
                <h2 id="climbModalTitle" class="text-lg font-bold mb-4">Log New Climb</h2>
                
                <div class="form-group">
                    <label class="form-label">Climb Type</label>
                    <div id="climbTypeChips" class="flex flex-wrap gap-2">
                        ${CLIMB_TYPES.map(type => `
                            <button type="button" onclick="selectClimbType('${type}')" 
                                class="chip-button ${type === 'top-rope' ? 'chip-selected' : ''}" 
                                data-type="${type}">
                                ${type === 'boulder' ? 'Bouldering' : 'Top Rope'}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="climbType" value="top-rope">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Grade</label>
                    <div id="climbGradeChips" class="flex flex-col gap-2">
                        ${renderGradeChipsByRow(GRADES['top-rope'], 0)}
                    </div>
                    <input type="hidden" id="climbGrade" value="${GRADES['top-rope'][0]}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div id="climbColorChips" class="flex flex-wrap gap-2">
                        ${COLORS.map((color, i) => `
                            <button type="button" onclick="selectColor('${color.name}')" 
                                class="color-chip ${i === 0 ? 'color-chip-selected' : ''}" 
                                data-color="${color.name}"
                                style="background-color: ${color.hex}; ${color.name === 'white' ? 'border: 2px solid #d1d5db;' : ''}">
                            </button>
                        `).join('')}
                        ${userColors.map(hex => `
                            <button type="button" onclick="selectColor('${hex}')" 
                                class="color-chip" 
                                data-color="${hex}"
                                style="background-color: ${hex};">
                            </button>
                        `).join('')}
                        <button type="button" onclick="openCustomColorPicker()" 
                            class="color-chip color-chip-add" 
                            id="customColorBtn"
                            title="Custom color">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                        </button>
                        <input type="color" id="customColorInput" class="hidden" onchange="selectCustomColor(this.value)">
                    </div>
                    <div id="saveColorContainer" class="hidden mt-2">
                        <button type="button" onclick="saveCurrentColor()" class="text-sm text-blue-500 flex items-center gap-1">
                            <i data-lucide="save" class="w-4 h-4"></i> Save this color
                        </button>
                    </div>
                    <input type="hidden" id="climbColor" value="${COLORS[0].name}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Rope # (optional)</label>
                    <div class="flex items-center gap-2 mb-2">
                        <input type="text" id="climbRope" readonly value="" placeholder="-" class="form-input text-center font-mono text-lg" style="width: 80px;">
                    </div>
                    <div class="number-pad">
                        ${[1,2,3,4,5,6,7,8,9,0].map(n => `
                            <button type="button" onclick="appendRopeDigit('${n}')" class="number-pad-btn">${n}</button>
                        `).join('')}
                        <button type="button" onclick="clearRope()" class="number-pad-btn number-pad-clear">C</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Blocks</label>
                    <div id="climbAttemptsChips" class="flex flex-wrap gap-2">
                        ${ATTEMPTS.map(a => `
                            <button type="button" onclick="selectAttempts(${a})" 
                                class="chip-button ${a === 0 ? 'chip-selected' : ''}" 
                                data-attempts="${a}">
                                ${a}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="climbAttempts" value="0">
                </div>
                
                <div class="form-group flex items-center gap-2">
                    <input type="checkbox" id="climbCompleted" checked>
                    <label for="climbCompleted">Topped</label>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <textarea id="climbNotes" class="form-input" rows="2" placeholder="Notes about the climb..."></textarea>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="saveClimb()" class="btn-primary flex-1">Log Climb</button>
                    <button onclick="closeClimbModal()" class="btn-secondary flex-1">Cancel</button>
                </div>
            </div>
        </div>
        
        <!-- Copy Session Modal -->
        <div id="copySessionModal" class="hidden modal-overlay">
            <div class="modal-content">
                <h2 class="text-lg font-bold mb-4">Copy Session</h2>
                <p id="copySessionInfo" class="text-sm text-gray-600 mb-4"></p>
                <div class="form-group">
                    <label class="form-label">New Date</label>
                    <input type="date" id="copySessionDate" class="form-input">
                </div>
                <div class="flex gap-2">
                    <button onclick="confirmCopySession()" class="btn-primary flex-1">Copy</button>
                    <button onclick="closeCopySessionModal()" class="btn-secondary flex-1">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    // Set default date for new session
    const dateInput = document.getElementById('sessionDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    // Initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function getGradeIndex(grade, climbType) {
    const grades = GRADES[climbType] || [];
    return grades.indexOf(grade);
}

function getSessionGradeRange(session) {
    if (!session.climbs || session.climbs.length === 0) return null;
    
    // Separate climbs by type
    const boulderClimbs = session.climbs.filter(c => c.climbType === 'boulder');
    const topRopeClimbs = session.climbs.filter(c => c.climbType === 'top-rope');
    
    let ranges = [];
    
    if (boulderClimbs.length > 0) {
        const boulderGrades = boulderClimbs.map(c => ({ grade: c.grade, index: getGradeIndex(c.grade, 'boulder') }));
        boulderGrades.sort((a, b) => a.index - b.index);
        const minGrade = boulderGrades[0].grade;
        const maxGrade = boulderGrades[boulderGrades.length - 1].grade;
        ranges.push(minGrade === maxGrade ? minGrade : `${minGrade} - ${maxGrade}`);
    }
    
    if (topRopeClimbs.length > 0) {
        const topRopeGrades = topRopeClimbs.map(c => ({ grade: c.grade, index: getGradeIndex(c.grade, 'top-rope') }));
        topRopeGrades.sort((a, b) => a.index - b.index);
        const minGrade = topRopeGrades[0].grade;
        const maxGrade = topRopeGrades[topRopeGrades.length - 1].grade;
        ranges.push(minGrade === maxGrade ? minGrade : `${minGrade} - ${maxGrade}`);
    }
    
    return ranges.join(' | ');
}

function renderSessionsList() {
    if (climbingSessions.length === 0) {
        return '<p class="text-gray-500 text-center py-8">No climbing sessions yet. Start by adding a new session!</p>';
    }
    
    return climbingSessions
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(session => {
            const climbCount = session.climbs ? session.climbs.length : 0;
            const gradeRange = getSessionGradeRange(session);
            
            return `
            <div class="border rounded-lg p-4">
                <div class="flex justify-between items-start">
                    <div class="flex-1 cursor-pointer" onclick="toggleSession('${session.id}')">
                        <div class="flex items-center gap-2">
                            <span class="text-gray-400 transition-transform session-chevron" id="chevron-${session.id}"><i data-lucide="chevron-right" class="w-4 h-4"></i></span>
                            <h3 class="font-semibold">${session.gym}</h3>
                        </div>
                        <p class="text-sm text-gray-600 ml-5">${session.date}</p>
                        <div class="text-sm text-gray-500 mt-1 ml-5">
                            ${climbCount > 0 ? `
                                <span>${climbCount} climb${climbCount > 1 ? 's' : ''}</span>
                                ${gradeRange ? `<span class="font-mono ml-2">(${gradeRange})</span>` : ''}
                            ` : '<span class="text-gray-400">No climbs logged</span>'}
                        </div>
                        ${session.notes ? `<p class="text-sm text-gray-500 mt-1 ml-5 italic">${session.notes}</p>` : ''}
                    </div>
                    <div class="flex gap-3 items-center">
                        <button onclick="openClimbModal('${session.id}')" class="text-blue-500 icon-btn" title="Add climb"><i data-lucide="plus" class="w-5 h-5"></i></button>
                        <button onclick="copySession('${session.id}')" class="text-green-600 icon-btn" title="Copy session"><i data-lucide="copy" class="w-5 h-5"></i></button>
                        <button onclick="deleteSession('${session.id}')" class="text-red-500 icon-btn" title="Delete session"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                    </div>
                </div>
                
                <div id="session-climbs-${session.id}" class="hidden mt-3 ml-5">
                    ${session.climbs && session.climbs.length > 0 ? `
                        <div class="space-y-2">
                            ${session.climbs.map(climb => `
                                <div class="flex items-center bg-gray-50 rounded text-sm overflow-hidden">
                                    <div class="w-1.5 self-stretch rounded-l" style="background-color: ${getColorHex(climb.color || 'yellow')};"></div>
                                    <div class="flex justify-between items-center flex-1 p-2">
                                        <div class="flex items-center gap-2">
                                            <span class="font-mono font-medium">${climb.grade}</span>
                                            ${climb.completed ? '<span class="text-green-600">✓</span>' : '<span class="text-gray-400">○</span>'}
                                            ${climb.attempts > 0 ? `<span class="text-gray-500">${climb.attempts} block${climb.attempts !== 1 ? 's' : ''}</span>` : ''}
                                            ${climb.rope ? `<span class="text-gray-400">Rope: ${climb.rope}</span>` : ''}
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <button onclick="editClimb('${session.id}', '${climb.id}')" class="text-blue-500 icon-btn" title="Edit climb"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                                            <button onclick="deleteClimb('${session.id}', '${climb.id}')" class="text-red-500 icon-btn" title="Delete climb"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `}).join('');
}

function getClimbTypeColor(type) {
    switch(type) {
        case 'boulder': return 'bg-orange-100 text-orange-700';
        case 'top-rope': return 'bg-blue-100 text-blue-700';
        case 'lead': return 'bg-purple-100 text-purple-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

function getColorHex(colorName) {
    // If it's already a hex color, return it
    if (colorName && colorName.startsWith('#')) {
        return colorName;
    }
    const color = COLORS.find(c => c.name === colorName);
    return color ? color.hex : '#fbbf24';
}

export function openNewSessionModal() {
    document.getElementById('sessionModal').classList.remove('hidden');
    document.getElementById('sessionDate').valueAsDate = new Date();
    document.getElementById('sessionGym').value = userGyms[0] || 'Stone Age';
    document.getElementById('sessionNotes').value = '';
    
    // Reset gym chip selection to first gym
    document.querySelectorAll('#gymChips .chip-button:not(.chip-add)').forEach((btn, i) => {
        btn.classList.toggle('chip-selected', i === 0);
    });
    
    // Hide add gym input
    hideAddGymInput();
}

export function selectGym(gymName) {
    document.getElementById('sessionGym').value = gymName;
    document.querySelectorAll('#gymChips .chip-button:not(.chip-add)').forEach(btn => {
        btn.classList.toggle('chip-selected', btn.dataset.gym === gymName);
    });
}

export function showAddGymInput() {
    document.getElementById('addGymContainer').classList.remove('hidden');
    document.getElementById('newGymName').value = '';
    document.getElementById('newGymName').focus();
}

export function hideAddGymInput() {
    const container = document.getElementById('addGymContainer');
    if (container) {
        container.classList.add('hidden');
    }
}

export async function addNewGym() {
    const gymName = document.getElementById('newGymName').value.trim();
    if (!gymName) {
        alert('Please enter a gym name');
        return;
    }
    
    if (userGyms.includes(gymName)) {
        alert('This gym already exists');
        return;
    }
    
    userGyms.push(gymName);
    await saveGymsToFirestore(userGyms);
    
    // Re-render the gym chips
    const gymChipsContainer = document.getElementById('gymChips');
    gymChipsContainer.innerHTML = `
        ${userGyms.map(gym => `
            <button type="button" onclick="selectGym('${gym.replace(/'/g, "\\'")}')" 
                class="chip-button ${gym === gymName ? 'chip-selected' : ''}" 
                data-gym="${gym}">
                ${gym}
            </button>
        `).join('')}
        <button type="button" onclick="showAddGymInput()" class="chip-button chip-add">+ Add Gym</button>
    `;
    
    // Select the new gym
    document.getElementById('sessionGym').value = gymName;
    hideAddGymInput();
}

export function closeSessionModal() {
    document.getElementById('sessionModal').classList.add('hidden');
}

export function saveSession() {
    const date = document.getElementById('sessionDate').value;
    const gym = document.getElementById('sessionGym').value;
    const notes = document.getElementById('sessionNotes').value;
    
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    if (!gym) {
        alert('Please select a gym');
        return;
    }
    
    const session = {
        id: generateId(),
        date,
        gym,
        notes,
        climbs: []
    };
    
    climbingSessions.push(session);
    saveClimbingToFirestore({ sessions: climbingSessions });
    closeSessionModal();
    renderClimbing();
}

export function copySession(sessionId) {
    const session = climbingSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    sessionToCopy = sessionId;
    const climbCount = session.climbs ? session.climbs.length : 0;
    
    document.getElementById('copySessionInfo').textContent = 
        `Copy session from ${session.gym} with ${climbCount} climb${climbCount !== 1 ? 's' : ''} to a new date.`;
    document.getElementById('copySessionDate').valueAsDate = new Date();
    document.getElementById('copySessionModal').classList.remove('hidden');
}

export function closeCopySessionModal() {
    document.getElementById('copySessionModal').classList.add('hidden');
    sessionToCopy = null;
}

export function confirmCopySession() {
    if (!sessionToCopy) return;
    
    const originalSession = climbingSessions.find(s => s.id === sessionToCopy);
    if (!originalSession) return;
    
    const newDate = document.getElementById('copySessionDate').value;
    if (!newDate) {
        alert('Please select a date');
        return;
    }
    
    // Create a deep copy of the session
    const newSession = {
        id: generateId(),
        date: newDate,
        gym: originalSession.gym,
        notes: originalSession.notes || '',
        climbs: (originalSession.climbs || []).map(climb => ({
            id: generateId(),
            climbType: climb.climbType,
            grade: climb.grade,
            attempts: climb.attempts,
            color: climb.color,
            rope: climb.rope,
            completed: climb.completed,
            notes: climb.notes || ''
        }))
    };
    
    climbingSessions.push(newSession);
    saveClimbingToFirestore({ sessions: climbingSessions });
    closeCopySessionModal();
    renderClimbing();
}

export function deleteSession(sessionId) {
    if (!confirm('Delete this session and all its climbs?')) return;
    climbingSessions = climbingSessions.filter(s => s.id !== sessionId);
    saveClimbingToFirestore({ sessions: climbingSessions });
    renderClimbing();
}

export function openClimbModal(sessionId) {
    currentSessionId = sessionId;
    currentClimbId = null;
    
    document.getElementById('climbModalTitle').textContent = 'Log New Climb';
    document.getElementById('climbType').value = 'top-rope';
    document.getElementById('climbGrade').value = GRADES['top-rope'][0];
    document.getElementById('climbAttempts').value = '0';
    document.getElementById('climbColor').value = COLORS[0].name;
    document.getElementById('climbRope').value = '';
    document.getElementById('climbCompleted').checked = true;
    document.getElementById('climbNotes').value = '';
    
    // Reset chip selections
    resetChipSelections();
    
    document.getElementById('climbModal').classList.remove('hidden');
}

export function closeClimbModal() {
    document.getElementById('climbModal').classList.add('hidden');
    currentSessionId = null;
    currentClimbId = null;
}

export function editClimb(sessionId, climbId) {
    const session = climbingSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const climb = session.climbs.find(c => c.id === climbId);
    if (!climb) return;
    
    currentSessionId = sessionId;
    currentClimbId = climbId;
    
    document.getElementById('climbModalTitle').textContent = 'Edit Climb';
    document.getElementById('climbType').value = climb.climbType;
    document.getElementById('climbGrade').value = climb.grade;
    document.getElementById('climbAttempts').value = climb.attempts.toString();
    document.getElementById('climbColor').value = climb.color || COLORS[0].name;
    document.getElementById('climbRope').value = climb.rope || '';
    document.getElementById('climbCompleted').checked = climb.completed;
    document.getElementById('climbNotes').value = climb.notes || '';
    
    // Update chip selections
    document.querySelectorAll('#climbTypeChips .chip-button').forEach(btn => {
        btn.classList.toggle('chip-selected', btn.dataset.type === climb.climbType);
    });
    
    updateGradeOptions();
    document.querySelectorAll('#climbGradeChips .chip-button').forEach(btn => {
        btn.classList.toggle('chip-selected', btn.dataset.grade === climb.grade);
    });
    
    document.querySelectorAll('#climbAttemptsChips .chip-button').forEach(btn => {
        btn.classList.toggle('chip-selected', btn.dataset.attempts === climb.attempts.toString());
    });
    
    document.querySelectorAll('#climbColorChips .color-chip').forEach(btn => {
        btn.classList.toggle('color-chip-selected', btn.dataset.color === (climb.color || COLORS[0].name));
    });
    
    // Handle custom color
    const customBtn = document.getElementById('customColorBtn');
    const isCustomColor = climb.color && climb.color.startsWith('#');
    if (isCustomColor && customBtn) {
        document.querySelectorAll('#climbColorChips .color-chip').forEach(btn => {
            btn.classList.remove('color-chip-selected');
        });
        customBtn.classList.add('color-chip-selected');
        customBtn.style.backgroundColor = climb.color;
        customBtn.innerHTML = '';
    } else if (customBtn) {
        customBtn.style.backgroundColor = '';
        customBtn.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i>';
    }
    
    document.getElementById('climbModal').classList.remove('hidden');
    
    // Initialize Lucide icons for the modal
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function renderGradeChipsByRow(grades, selectedIndex) {
    // Group grades by their first character/number
    const grouped = {};
    grades.forEach((grade, i) => {
        const firstChar = grade[0];
        if (!grouped[firstChar]) grouped[firstChar] = [];
        grouped[firstChar].push({ grade, index: i });
    });
    
    // Render each group as a row
    return Object.keys(grouped).sort().map(key => `
        <div class="flex flex-wrap gap-2">
            ${grouped[key].map(({ grade, index }) => `
                <button type="button" onclick="selectGrade('${grade}')" 
                    class="chip-button ${index === selectedIndex ? 'chip-selected' : ''}" 
                    data-grade="${grade}">
                    ${grade}
                </button>
            `).join('')}
        </div>
    `).join('');
}

export function updateGradeOptions() {
    const climbType = document.getElementById('climbType').value;
    const gradeChips = document.getElementById('climbGradeChips');
    const grades = GRADES[climbType];
    
    gradeChips.innerHTML = renderGradeChipsByRow(grades, 0);
    
    document.getElementById('climbGrade').value = grades[0];
}

function resetChipSelections() {
    // Reset type chips - select top-rope
    document.querySelectorAll('#climbTypeChips .chip-button').forEach(btn => {
        btn.classList.toggle('chip-selected', btn.dataset.type === 'top-rope');
    });
    
    // Reset grade chips
    updateGradeOptions();
    
    // Reset attempts chips - select 0
    document.querySelectorAll('#climbAttemptsChips .chip-button').forEach(btn => {
        btn.classList.toggle('chip-selected', btn.dataset.attempts === '0');
    });
    
    // Reset color chips - select first color
    document.querySelectorAll('#climbColorChips .color-chip').forEach((btn, i) => {
        btn.classList.toggle('color-chip-selected', i === 0);
    });
}

export function selectClimbType(type) {
    document.getElementById('climbType').value = type;
    document.querySelectorAll('#climbTypeChips .chip-button').forEach(btn => {
        btn.classList.toggle('chip-selected', btn.dataset.type === type);
    });
    updateGradeOptions();
}

export function selectGrade(grade) {
    document.getElementById('climbGrade').value = grade;
    document.querySelectorAll('#climbGradeChips .chip-button').forEach(btn => {
        btn.classList.toggle('chip-selected', btn.dataset.grade === grade);
    });
}

export function selectAttempts(attempts) {
    document.getElementById('climbAttempts').value = attempts;
    document.querySelectorAll('#climbAttemptsChips .chip-button').forEach(btn => {
        btn.classList.toggle('chip-selected', parseInt(btn.dataset.attempts) === attempts);
    });
}

export function selectColor(colorName) {
    document.getElementById('climbColor').value = colorName;
    document.querySelectorAll('#climbColorChips .color-chip').forEach(btn => {
        btn.classList.toggle('color-chip-selected', btn.dataset.color === colorName);
    });
    // Reset custom color button selection
    const customBtn = document.getElementById('customColorBtn');
    if (customBtn) {
        customBtn.classList.remove('color-chip-selected');
        customBtn.style.backgroundColor = '';
    }
    // Hide save button for preset/already saved colors
    const saveContainer = document.getElementById('saveColorContainer');
    if (saveContainer) {
        saveContainer.classList.add('hidden');
    }
}

export function openCustomColorPicker() {
    document.getElementById('customColorInput').click();
}

export function selectCustomColor(hexColor) {
    document.getElementById('climbColor').value = hexColor;
    // Deselect all preset colors
    document.querySelectorAll('#climbColorChips .color-chip').forEach(btn => {
        btn.classList.remove('color-chip-selected');
    });
    // Select and style the custom color button
    const customBtn = document.getElementById('customColorBtn');
    if (customBtn) {
        customBtn.classList.add('color-chip-selected');
        customBtn.style.backgroundColor = hexColor;
        customBtn.innerHTML = '';
    }
    // Show save button if color is not already saved
    const saveContainer = document.getElementById('saveColorContainer');
    if (saveContainer && !userColors.includes(hexColor)) {
        saveContainer.classList.remove('hidden');
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

export async function saveCurrentColor() {
    const color = document.getElementById('climbColor').value;
    if (color && color.startsWith('#') && !userColors.includes(color)) {
        userColors.push(color);
        await saveUserColorsToFirestore(userColors);
        // Hide save button
        const saveContainer = document.getElementById('saveColorContainer');
        if (saveContainer) {
            saveContainer.classList.add('hidden');
        }
        // Re-render to show the new saved color
        renderClimbing();
        // Re-open the climb modal
        if (currentSessionId) {
            document.getElementById('climbModal').classList.remove('hidden');
            document.getElementById('climbColor').value = color;
            // Re-select the color
            document.querySelectorAll('#climbColorChips .color-chip').forEach(btn => {
                btn.classList.toggle('color-chip-selected', btn.dataset.color === color);
            });
        }
    }
}

export function appendRopeDigit(digit) {
    const input = document.getElementById('climbRope');
    const current = input.value || '';
    if (current.length < 2) {
        input.value = current + digit;
    }
}

export function clearRope() {
    document.getElementById('climbRope').value = '';
}

export function saveClimb() {
    if (!currentSessionId) return;
    
    const climbType = document.getElementById('climbType').value;
    const grade = document.getElementById('climbGrade').value;
    const attempts = parseInt(document.getElementById('climbAttempts').value) || 0;
    const color = document.getElementById('climbColor').value;
    const ropeValue = document.getElementById('climbRope').value;
    const rope = ropeValue ? parseInt(ropeValue) : null;
    const completed = document.getElementById('climbCompleted').checked;
    const notes = document.getElementById('climbNotes').value;
    
    if (!grade) {
        alert('Please select a grade');
        return;
    }
    
    const session = climbingSessions.find(s => s.id === currentSessionId);
    if (!session) return;
    
    if (currentClimbId) {
        // Edit existing climb
        const climb = session.climbs.find(c => c.id === currentClimbId);
        if (climb) {
            climb.climbType = climbType;
            climb.grade = grade;
            climb.attempts = attempts;
            climb.color = color;
            climb.rope = rope;
            climb.completed = completed;
            climb.notes = notes;
        }
    } else {
        // Add new climb
        const climb = {
            id: generateId(),
            climbType,
            grade,
            attempts,
            color,
            rope,
            completed,
            notes
        };
        if (!session.climbs) session.climbs = [];
        session.climbs.push(climb);
    }
    
    saveClimbingToFirestore({ sessions: climbingSessions });
    closeClimbModal();
    renderClimbing();
}

export function deleteClimb(sessionId, climbId) {
    const session = climbingSessions.find(s => s.id === sessionId);
    if (session) {
        session.climbs = session.climbs.filter(c => c.id !== climbId);
        saveClimbingToFirestore({ sessions: climbingSessions });
        renderClimbing();
    }
}

export function toggleSession(sessionId) {
    const climbsContainer = document.getElementById(`session-climbs-${sessionId}`);
    const chevron = document.getElementById(`chevron-${sessionId}`);
    
    if (climbsContainer) {
        const isHidden = climbsContainer.classList.contains('hidden');
        climbsContainer.classList.toggle('hidden');
        if (chevron) {
            chevron.style.transform = isHidden ? 'rotate(90deg)' : '';
        }
    }
}

// Expose functions to window
window.openNewSessionModal = openNewSessionModal;
window.closeSessionModal = closeSessionModal;
window.saveSession = saveSession;
window.copySession = copySession;
window.closeCopySessionModal = closeCopySessionModal;
window.confirmCopySession = confirmCopySession;
window.deleteSession = deleteSession;
window.openClimbModal = openClimbModal;
window.closeClimbModal = closeClimbModal;
window.editClimb = editClimb;
window.updateGradeOptions = updateGradeOptions;
window.saveClimb = saveClimb;
window.deleteClimb = deleteClimb;
window.toggleSession = toggleSession;
window.selectClimbType = selectClimbType;
window.selectGrade = selectGrade;
window.selectAttempts = selectAttempts;
window.selectColor = selectColor;
window.openCustomColorPicker = openCustomColorPicker;
window.selectCustomColor = selectCustomColor;
window.saveCurrentColor = saveCurrentColor;
window.appendRopeDigit = appendRopeDigit;
window.clearRope = clearRope;
window.selectGym = selectGym;
window.showAddGymInput = showAddGymInput;
window.hideAddGymInput = hideAddGymInput;
window.addNewGym = addNewGym;
