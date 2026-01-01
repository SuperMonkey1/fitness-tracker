import { saveChatterToFirestore, loadChatterFromFirestore, saveProjectsToFirestore, loadProjectsFromFirestore } from './storage.js';
import { projectItems, setProjectItems } from './projects.js';

const CHATTER_TYPES = [
    { id: 'habits', label: 'Habits', description: 'Stop bad ones, start good ones' },
    { id: 'tasks', label: 'Tasks', description: 'Answering email' },
    { id: 'todos', label: "Todo's", description: 'Broken tile, finish the plints' },
    { id: 'projects', label: 'Projects', description: 'Want to start a new business' },
    { id: 'life', label: 'Life', description: 'Want to do another job, go live somewhere else' },
    { id: 'personality', label: 'Personality', description: 'Want to become someone else (or partly)' },
    { id: 'skills', label: 'Skills', description: 'Want to learn how to sew' }
];

export let chatterItems = [];
let currentChatterId = null;
let currentChatterFilter = 'all';

export function setChatterItems(items) {
    chatterItems = items || [];
}

export async function initChatter() {
    const data = await loadChatterFromFirestore();
    chatterItems = data.items || [];
    renderChatter();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function renderChatter() {
    const container = document.getElementById('chatterContent');
    if (!container) return;
    
    const isEmpty = chatterItems.length === 0;
    const currentFilterLabel = currentChatterFilter === 'all' ? 'All' : CHATTER_TYPES.find(t => t.id === currentChatterFilter)?.label || 'All';
    container.innerHTML = `
        <div id="chatterList" class="${isEmpty ? '' : 'space-y-2'}" style="${isEmpty ? 'overflow: hidden;' : 'height: 100%; overflow-y: auto; overflow-x: hidden; padding-right: 4px; padding-bottom: 120px;'}">
            ${renderChatterList()}
        </div>
        ${!isEmpty ? `
        <!-- Floating Action Button for Filter -->
        <button onclick="openChatterFilterModal()" class="fixed" style="bottom: 98px; right: 20px; z-index: 14; width: 45px; height: 45px; border-radius: 50%; background-color: #e8e6dc; color: #4a4a4a; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
        </button>` : ''}
        
        <!-- Quick Add Bar (Google Keep style) -->
        <div class="fixed bottom-0 left-0 right-0 shadow-lg p-4 pb-8" style="z-index: 15; background-color: #fdfdf9ff;">
            <div class="max-w-4xl mx-auto flex gap-2 items-center">
                <input 
                    type="text" 
                    id="quickChatterInput" 
                    class="form-input flex-1" 
                    placeholder="Note down your chatter"
                    onkeypress="handleQuickChatterKeypress(event)">
                <button onclick="handleQuickChatterSubmit()" class="btn-primary px-6">Okay</button>
            </div>
        </div>
        
        <!-- Type Selection Modal -->
        <div id="chatterTypeModal" class="hidden modal-overlay">
            <div class="modal-content">
                <h2 class="text-lg font-bold mb-2">Select Type</h2>
                <p class="text-sm text-gray-600 mb-4" id="chatterPreviewText"></p>
                <div class="form-group">
                    <div id="chatterTypeChips" class="flex flex-wrap gap-2">
                        ${CHATTER_TYPES.map((type, i) => `
                            <button type="button" onclick="selectAndSaveChatterType('${type.id}')" 
                                class="chip-button" 
                                data-type="${type.id}"
                                title="${type.description}">
                                ${type.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="flex gap-2 mt-4">
                    <button onclick="closeChatterTypeModal()" class="btn-secondary flex-1">Cancel</button>
                </div>
            </div>
        </div>
        
        <!-- Chatter Actions Modal -->
        <div id="chatterActionsModal" class="hidden modal-overlay">
            <div class="modal-content">
                <h2 class="text-lg font-bold mb-4">Chatter Options</h2>
                <div class="flex flex-col gap-2">
                    <button onclick="editChatterFromActions()" class="btn-primary">Edit</button>
                    <button onclick="openDeleteConfirmation()" class="btn-danger">Remove</button>
                    <button onclick="closeChatterActionsModal()" class="btn-secondary">Cancel</button>
                </div>
            </div>
        </div>
        
        <!-- Delete Confirmation Modal -->
        <div id="deleteChatterModal" class="hidden modal-overlay">
            <div class="modal-content">
                <h2 class="text-lg font-bold mb-4">Delete this chatter ?</h2>
                <div class="flex gap-2">
                    <button onclick="confirmDeleteChatter()" class="btn-danger flex-1">Delete</button>
                    <button onclick="closeDeleteChatterModal()" class="btn-secondary flex-1">Cancel</button>
                </div>
            </div>
        </div>
        
        <!-- Edit Chatter Modal -->
        <div id="chatterModal" class="hidden modal-overlay">
            <div class="modal-content">
                <h2 id="chatterModalTitle" class="text-lg font-bold mb-4">Edit Mental Chatter</h2>
                <div class="form-group">
                    <label class="form-label">Title</label>
                    <input type="text" id="chatterTitle" class="form-input" placeholder="What's on your mind?">
                </div>
                <input type="hidden" id="chatterType" value="habits">
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <div id="editChatterTypeChips" class="flex flex-wrap gap-2">
                        ${CHATTER_TYPES.map((type, i) => `
                            <button type="button" onclick="selectChatterType('${type.id}')" 
                                class="chip-button ${i === 0 ? 'chip-selected' : ''}" 
                                data-type="${type.id}"
                                title="${type.description}">
                                ${type.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="flex gap-2 mt-4">
                    <button onclick="saveChatter()" class="btn-primary flex-1">Save</button>
                    <button onclick="closeChatterModal()" class="btn-secondary flex-1">Cancel</button>
                </div>
            </div>
        </div>
        
        <!-- Filter Modal -->
        <div id="chatterFilterModal" class="hidden modal-overlay">
            <div class="modal-content">
                <h2 class="text-lg font-bold mb-4">Filter by Type</h2>
                <div class="flex flex-col gap-2">
                    ${CHATTER_TYPES.filter(type => chatterItems.some(item => item.type === type.id)).map(type => `
                        <button onclick="filterChatterByType('${type.id}')" class="btn-${currentChatterFilter === type.id ? 'primary' : 'secondary'}">${type.label}</button>
                    `).join('')}
                    <button onclick="filterChatterByType('all')" class="btn-${currentChatterFilter === 'all' ? 'primary' : 'secondary'}">All Types</button>
                </div>
                <button onclick="closeChatterFilterModal()" class="btn-secondary mt-4">Close</button>
            </div>
        </div>
        
        <!-- Project Selection Modal for Todos -->
        <div id="projectSelectionModal" class="hidden modal-overlay">
            <div class="modal-content">
                <h2 class="text-lg font-bold mb-2">Add to Project?</h2>
                <p class="text-sm text-gray-600 mb-4">Link this todo to a project (optional)</p>
                <div class="flex flex-col gap-2 max-h-60 overflow-y-auto mb-4" id="projectSelectionList">
                    ${projectItems.length > 0 ? projectItems.map(project => `
                        <button onclick="selectProjectForTodo('${project.id}')" class="btn-secondary text-left">${escapeHtmlStatic(project.title)}</button>
                    `).join('') : '<p class="text-sm text-gray-500 text-center py-2">No projects yet</p>'}
                </div>
                <div class="flex flex-col gap-2">
                    <div class="flex gap-2">
                        <input type="text" id="newProjectNameInput" class="form-input flex-1" placeholder="New project name">
                        <button onclick="createProjectAndLink()" class="btn-primary px-4">Create</button>
                    </div>
                    <button onclick="skipProjectSelection()" class="btn-secondary mt-2">Skip (No Project)</button>
                </div>
            </div>
        </div>
        
        <!-- Habit Detail Modal -->
        <div id="habitDetailModal" class="hidden modal-overlay">
            <div class="modal-content">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold">Habit Settings</h2>
                    <div class="flex gap-2">
                        <button onclick="editHabitChatter()" class="text-blue-500 hover:text-blue-600" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button onclick="deleteHabitChatter()" class="text-red-500 hover:text-red-600" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <input type="hidden" id="habitChatterId" value="">
                
                <div class="form-group">
                    <label class="form-label">Habit Name</label>
                    <input type="text" id="habitName" class="form-input" readonly style="background-color: #f3f4f6;">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Points (1-10)</label>
                    <input type="number" id="habitPoints" class="form-input" min="1" max="10" value="1">
                </div>
                
                <div class="form-group">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="habitHasNumericalValue" onchange="toggleNumericalValue()">
                        <span class="text-sm">Track numerical value</span>
                    </label>
                </div>
                
                <div id="numericalValueFields" class="hidden space-y-3 mt-3 p-3 bg-gray-50 rounded-lg">
                    <div class="form-group mb-0">
                        <label class="form-label">Starting Value</label>
                        <input type="number" id="habitNumericalValue" class="form-input" step="0.1" value="0">
                    </div>
                    
                    <div class="form-group mb-0">
                        <label class="form-label">Daily Change (linear increase)</label>
                        <input type="number" id="habitChangeValue" class="form-input" step="0.1" value="1">
                    </div>
                </div>
                
                <div class="flex gap-2 mt-6">
                    <button onclick="startHabit()" class="btn-primary flex-1">Start Habit</button>
                    <button onclick="closeHabitDetailModal()" class="btn-secondary flex-1">Cancel</button>
                </div>
            </div>
        </div>
    `;
}

function renderChatterList() {
    // Filter items based on current filter
    const filteredItems = currentChatterFilter === 'all' 
        ? chatterItems 
        : chatterItems.filter(item => item.type === currentChatterFilter);
    
    if (chatterItems.length === 0) {
        // Start the rain animation after DOM is ready
        setTimeout(() => initRainAnimation(), 100);
        return `
            <div class="relative" style="height: calc(100vh - 220px); overflow: hidden;">
                <canvas id="rainCanvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
                <div class="absolute inset-0 flex items-center justify-center" style="pointer-events: none;">
                    <div class="text-center" style="transform: translateY(70px);">
                        <p class="text-sm text-gray-600" style="line-height: 1.4; margin: 0;">Let's catch</p>
                        <p class="text-sm text-gray-600" style="line-height: 1.4; margin: 0;">some chatter</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (filteredItems.length === 0) {
        return `
            <div class="text-center py-8">
                <p class="text-sm text-gray-500">No chatters of this type</p>
            </div>
        `;
    }
    
    return filteredItems.map(item => {
        const type = CHATTER_TYPES.find(t => t.id === item.type);
        const onClick = item.type === 'habits' ? `onclick="openHabitDetailModal('${item.id}')"` : `ondblclick="openChatterActions('${item.id}')"`;
        return `
            <div class="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-4 cursor-pointer" data-chatter-id="${item.id}" ${onClick}>
                <div class="flex-1">
                    <p class="text-gray-800 font-medium mb-1">${escapeHtml(item.title)}</p>
                </div>
                <div class="flex flex-col items-end justify-between text-right ml-4" style="min-width: 6rem;">
                    <span class="text-xs text-gray-600" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${type ? type.label : item.type}</span>
                    <span class="text-xs text-gray-500">${formatDate(item.createdAt)}</span>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    // Use a consistent localized short date format like "Dec 31, 2025"
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Static version for use in template literals during render
function escapeHtmlStatic(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

let pendingChatterTitle = '';
let pendingChatterType = '';
let chatterIdToDelete = null;

export function handleQuickChatterKeypress(event) {
    if (event.key === 'Enter') {
        handleQuickChatterSubmit();
    }
}

export function handleQuickChatterSubmit() {
    const input = document.getElementById('quickChatterInput');
    const title = input.value.trim();
    
    if (!title) {
        return;
    }
    
    pendingChatterTitle = title;
    input.value = '';
    
    // Show type selection modal
    openChatterTypeModal(title);
}

function openChatterTypeModal(title) {
    const modal = document.getElementById('chatterTypeModal');
    const previewText = document.getElementById('chatterPreviewText');
    
    previewText.textContent = `"${title}"`;
    
    // Reset selection - no default
    const chips = document.querySelectorAll('#chatterTypeChips .chip-button');
    chips.forEach(chip => {
        chip.classList.remove('chip-selected');
    });
    
    modal.classList.remove('hidden');
}

export function closeChatterTypeModal() {
    const modal = document.getElementById('chatterTypeModal');
    modal.classList.add('hidden');
    pendingChatterTitle = '';
}

export function selectAndSaveChatterType(typeId) {
    // Update chip selection
    const chips = document.querySelectorAll('#chatterTypeChips .chip-button');
    chips.forEach(chip => {
        if (chip.dataset.type === typeId) {
            chip.classList.add('chip-selected');
        } else {
            chip.classList.remove('chip-selected');
        }
    });
    
    // If todos type, ask about project association
    if (typeId === 'todos') {
        pendingChatterType = typeId;
        // Close modal but don't clear pendingChatterTitle
        const modal = document.getElementById('chatterTypeModal');
        if (modal) modal.classList.add('hidden');
        openProjectSelectionModal();
    } else {
        // Save immediately for other types
        saveQuickChatter(typeId);
    }
}

async function saveQuickChatter(typeId, projectId = null) {
    if (!pendingChatterTitle) return;
    
    const newItem = {
        id: generateId(),
        title: pendingChatterTitle,
        type: typeId,
        projectId: projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    chatterItems.unshift(newItem);
    await saveChatterToFirestore({ items: chatterItems });
    
    pendingChatterTitle = '';
    pendingChatterType = '';
    closeChatterTypeModal();
    renderChatter();
}

export function openChatterModal(chatterId = null) {
    currentChatterId = chatterId;
    const modal = document.getElementById('chatterModal');
    const title = document.getElementById('chatterModalTitle');
    const titleInput = document.getElementById('chatterTitle');
    const typeInput = document.getElementById('chatterType');
    
    if (chatterId) {
        const item = chatterItems.find(c => c.id === chatterId);
        if (item) {
            title.textContent = 'Edit Mental Chatter';
            titleInput.value = item.title;
            typeInput.value = item.type;
            selectChatterType(item.type);
        }
    } else {
        title.textContent = 'Add Mental Chatter';
        titleInput.value = '';
        typeInput.value = CHATTER_TYPES[0].id;
        selectChatterType(CHATTER_TYPES[0].id);
    }
    
    modal.classList.remove('hidden');
    titleInput.focus();
}

export function closeChatterModal() {
    const modal = document.getElementById('chatterModal');
    modal.classList.add('hidden');
    currentChatterId = null;
}

export function selectChatterType(typeId) {
    // Update hidden input
    document.getElementById('chatterType').value = typeId;
    
    // Update chip selection in the edit modal
    const chips = document.querySelectorAll('#editChatterTypeChips .chip-button');
    chips.forEach(chip => {
        if (chip.dataset.type === typeId) {
            chip.classList.add('chip-selected');
        } else {
            chip.classList.remove('chip-selected');
        }
    });
}

export async function saveChatter() {
    const titleInput = document.getElementById('chatterTitle');
    const typeInput = document.getElementById('chatterType');
    
    const title = titleInput.value.trim();
    const type = typeInput.value;
    
    if (!title) {
        alert('Please enter a title');
        return;
    }
    
    if (currentChatterId) {
        // Edit existing
        const index = chatterItems.findIndex(c => c.id === currentChatterId);
        if (index !== -1) {
            chatterItems[index] = {
                ...chatterItems[index],
                title,
                type,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Add new
        const newItem = {
            id: generateId(),
            title,
            type,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        chatterItems.unshift(newItem);
    }
    
    await saveChatterToFirestore({ items: chatterItems });
    closeChatterModal();
    renderChatter();
}

export async function deleteChatter(id) {
    chatterIdToDelete = id;
    const modal = document.getElementById('deleteChatterModal');
    modal.classList.remove('hidden');
}

export function closeDeleteChatterModal() {
    const modal = document.getElementById('deleteChatterModal');
    modal.classList.add('hidden');
    chatterIdToDelete = null;
}

let currentActionChatterId = null;

export function openChatterActions(id) {
    currentActionChatterId = id;
    const modal = document.getElementById('chatterActionsModal');
    modal.classList.remove('hidden');
}

export function closeChatterActionsModal() {
    const modal = document.getElementById('chatterActionsModal');
    modal.classList.add('hidden');
    currentActionChatterId = null;
}

export function editChatterFromActions() {
    if (!currentActionChatterId) return;
    const idToEdit = currentActionChatterId;
    closeChatterActionsModal();
    openChatterModal(idToEdit);
}

export function openDeleteConfirmation() {
    if (!currentActionChatterId) return;
    chatterIdToDelete = currentActionChatterId;
    closeChatterActionsModal();
    const modal = document.getElementById('deleteChatterModal');
    modal.classList.remove('hidden');
}

export async function confirmDeleteChatter() {
    if (!chatterIdToDelete) return;
    
    chatterItems = chatterItems.filter(c => c.id !== chatterIdToDelete);
    await saveChatterToFirestore({ items: chatterItems });
    closeDeleteChatterModal();
    renderChatter();
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('chatterModal');
    if (modal && e.target === modal) {
        closeChatterModal();
    }
});

// Rain animation variables
let rainAnimationId = null;

function initRainAnimation() {
    const canvas = document.getElementById('rainCanvas');
    if (!canvas) return;
    
    // Clean up previous animation
    if (rainAnimationId) {
        cancelAnimationFrame(rainAnimationId);
        rainAnimationId = null;
    }
    
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || (window.innerHeight - 200);
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Three.js setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfdfdf9);
    
    const camera = new THREE.OrthographicCamera(
        -width / 2, width / 2,
        height / 2, -height / 2,
        0.1, 1000
    );
    camera.position.z = 100;
    
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    
    // Umbrella settings
    const umbrellaRadius = 60;
    const umbrellaY = 40; // Position above center
    const umbrellaX = 0;
    
    // Create umbrella canopy (semi-circle with high segment count for sharp edges)
    const umbrellaShape = new THREE.Shape();
    const segments = 64; // High segment count for smooth curve
    for (let i = 0; i <= segments; i++) {
        const angle = (Math.PI * i) / segments;
        const x = Math.cos(angle) * umbrellaRadius;
        const y = Math.sin(angle) * umbrellaRadius;
        if (i === 0) {
            umbrellaShape.moveTo(x, y);
        } else {
            umbrellaShape.lineTo(x, y);
        }
    }
    umbrellaShape.lineTo(umbrellaRadius, 0);
    
    const umbrellaGeometry = new THREE.ShapeGeometry(umbrellaShape, 1);
    const umbrellaMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFC000,
        side: THREE.DoubleSide
    });
    const umbrellaCanopy = new THREE.Mesh(umbrellaGeometry, umbrellaMaterial);
    umbrellaCanopy.position.set(umbrellaX, umbrellaY, 1);
    scene.add(umbrellaCanopy);
    
    // Add umbrella outline for sharper edges
    const outlinePoints = [];
    for (let i = 0; i <= segments; i++) {
        const angle = (Math.PI * i) / segments;
        const x = Math.cos(angle) * umbrellaRadius;
        const y = Math.sin(angle) * umbrellaRadius;
        outlinePoints.push(new THREE.Vector3(x, y, 0));
    }
    const outlineGeometry = new THREE.BufferGeometry().setFromPoints(outlinePoints);
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xFFC000, linewidth: 2 });
    const umbrellaOutline = new THREE.Line(outlineGeometry, outlineMaterial);
    umbrellaOutline.position.set(umbrellaX, umbrellaY, 1.1);
    scene.add(umbrellaOutline);
    
    // Create umbrella handle (straight with curved hook at end)
    // Straight part
    const handleStraightGeometry = new THREE.PlaneGeometry(4, 55);
    const handleMaterial = new THREE.MeshBasicMaterial({ color: 0xFFC000 });
    const handleStraight = new THREE.Mesh(handleStraightGeometry, handleMaterial);
    handleStraight.position.set(umbrellaX, umbrellaY - 27.5, 1);
    scene.add(handleStraight);
    
    // Curved hook at bottom
    const hookCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, -55, 0),
        new THREE.Vector3(0, -70, 0),
        new THREE.Vector3(-12, -70, 0)
    );
    const hookPoints = hookCurve.getPoints(16);
    
    // Create thick hook using a tube-like shape
    for (let i = 0; i < hookPoints.length - 1; i++) {
        const p1 = hookPoints[i];
        const p2 = hookPoints[i + 1];
        const length = p1.distanceTo(p2);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        
        const segGeometry = new THREE.PlaneGeometry(length + 1, 4);
        const segment = new THREE.Mesh(segGeometry, handleMaterial);
        segment.position.set(umbrellaX + midX, umbrellaY + midY, 1);
        segment.rotation.z = angle;
        scene.add(segment);
    }
    
    // Raindrops
    const raindrops = [];
    const raindropGeometry = new THREE.PlaneGeometry(2, 12);
    const raindropMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x6ba3d6,
        transparent: true,
        opacity: 0.6
    });
    
    // Function to check if raindrop hits umbrella
    function hitsUmbrella(x, y) {
        const dx = x - umbrellaX;
        const dy = y - umbrellaY;
        // Check if within semi-circle (top half of circle)
        if (dy >= 0 && dy <= umbrellaRadius) {
            const distFromCenter = Math.sqrt(dx * dx + dy * dy);
            return distFromCenter <= umbrellaRadius;
        }
        return false;
    }
    
    // Check if position is directly under umbrella (shadow zone)
    function isUnderUmbrella(x) {
        return Math.abs(x - umbrellaX) < umbrellaRadius;
    }
    
    const raindropCount = Math.floor((width * height) / 2000);
    for (let i = 0; i < raindropCount; i++) {
        const raindrop = new THREE.Mesh(raindropGeometry, raindropMaterial.clone());
        raindrop.position.x = Math.random() * width - width / 2;
        raindrop.position.y = Math.random() * height - height / 2 + height;
        raindrop.velocity = 4 + Math.random() * 6;
        raindrop.userData.slidingOff = false;
        raindrop.userData.slideDirection = 0;
        scene.add(raindrop);
        raindrops.push(raindrop);
    }
    
    // Ripples (hidden but logic kept)
    const ripples = [];
    const rippleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x87ceeb,
        transparent: true,
        opacity: 0, // Hidden - set to 0.4 to show again
        side: THREE.DoubleSide
    });
    
    function createRipple(x, y) {
        const rippleGeometry = new THREE.RingGeometry(0, 3, 16);
        const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial.clone());
        ripple.position.x = x;
        ripple.position.y = y;
        ripple.scale.set(1, 0.3, 1);
        ripple.userData = { age: 0, maxAge: 60 };
        scene.add(ripple);
        ripples.push(ripple);
    }
    
    // Water level starts visible and grows continuously
    let waterLevel = 20;
    const maxWaterLevel = height;
    
    // Water fill rectangle (hidden but logic kept)
    const waterGeometry = new THREE.PlaneGeometry(width, 1);
    const waterMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x6ba3d6,
        transparent: true,
        opacity: 0 // Hidden - set to 0.4 to show again
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.y = -height / 2;
    water.scale.y = waterLevel;
    scene.add(water);
    
    function animate() {
        rainAnimationId = requestAnimationFrame(animate);
        
        // Update raindrops
        raindrops.forEach(drop => {
            if (drop.userData.slidingOff) {
                // Slide off the umbrella
                drop.position.x += drop.userData.slideDirection * 3;
                drop.position.y -= drop.velocity * 0.5;
                
                // Check if slid off the umbrella edge
                if (!isUnderUmbrella(drop.position.x)) {
                    drop.userData.slidingOff = false;
                }
            } else {
                drop.position.y -= drop.velocity;
                
                // Check if hitting umbrella
                if (hitsUmbrella(drop.position.x, drop.position.y)) {
                    // Start sliding off
                    drop.userData.slidingOff = true;
                    drop.userData.slideDirection = drop.position.x >= umbrellaX ? 1 : -1;
                    // Create small ripple on umbrella
                    createRipple(drop.position.x, drop.position.y);
                }
            }
            
            // Check if raindrop went off bottom of screen
            if (drop.position.y < -height / 2 - 20) {
                // Reset raindrop to top
                drop.position.y = height / 2 + Math.random() * 50;
                drop.position.x = Math.random() * width - width / 2;
                drop.userData.slidingOff = false;
            }
        });
        
        // Update water level (capped to canvas height)
        const clampedWaterLevel = Math.min(waterLevel, height);
        water.scale.y = Math.max(1, clampedWaterLevel);
        water.position.y = -height / 2 + clampedWaterLevel / 2;
        
        // Update ripples
        for (let i = ripples.length - 1; i >= 0; i--) {
            const ripple = ripples[i];
            ripple.userData.age++;
            const progress = ripple.userData.age / ripple.userData.maxAge;
            ripple.scale.x = 1 + progress * 3;
            ripple.scale.y = 0.3 + progress * 0.5;
            ripple.material.opacity = 0.4 * (1 - progress);
            
            if (ripple.userData.age >= ripple.userData.maxAge) {
                scene.remove(ripple);
                ripple.geometry.dispose();
                ripple.material.dispose();
                ripples.splice(i, 1);
            }
        }
        
        renderer.render(scene, camera);
    }
    
    animate();
}

// Filter chatter by type
export function filterChatterByType(type) {
    currentChatterFilter = type;
    closeChatterFilterModal();
    renderChatter();
}

export function openChatterFilterModal() {
    const modal = document.getElementById('chatterFilterModal');
    if (modal) modal.classList.remove('hidden');
}

export function closeChatterFilterModal() {
    const modal = document.getElementById('chatterFilterModal');
    if (modal) modal.classList.add('hidden');
}

// Expose functions globally
window.filterChatterByType = filterChatterByType;
window.openChatterFilterModal = openChatterFilterModal;
window.closeChatterFilterModal = closeChatterFilterModal;

// Project selection for todos
export function openProjectSelectionModal() {
    // Reload project items to get latest
    loadProjectsFromFirestore().then(data => {
        setProjectItems(data.items || []);
        updateProjectSelectionList();
        const modal = document.getElementById('projectSelectionModal');
        if (modal) modal.classList.remove('hidden');
    });
}

function updateProjectSelectionList() {
    const listContainer = document.getElementById('projectSelectionList');
    if (!listContainer) return;
    
    listContainer.innerHTML = projectItems.length > 0 
        ? projectItems.map(project => `
            <button onclick="selectProjectForTodo('${project.id}')" class="btn-secondary text-left">${escapeHtmlStatic(project.title)}</button>
        `).join('')
        : '<p class="text-sm text-gray-500 text-center py-2">No projects yet</p>';
}

export function closeProjectSelectionModal() {
    const modal = document.getElementById('projectSelectionModal');
    if (modal) modal.classList.add('hidden');
    const input = document.getElementById('newProjectNameInput');
    if (input) input.value = '';
}

export function selectProjectForTodo(projectId) {
    closeProjectSelectionModal();
    saveQuickChatter(pendingChatterType || 'todos', projectId);
}

export function skipProjectSelection() {
    closeProjectSelectionModal();
    saveQuickChatter(pendingChatterType || 'todos', null);
}

export async function createProjectAndLink() {
    const input = document.getElementById('newProjectNameInput');
    const projectName = input ? input.value.trim() : '';
    
    if (!projectName) {
        alert('Please enter a project name');
        return;
    }
    
    // Create new project
    const newProject = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        title: projectName,
        description: '',
        createdAt: new Date().toISOString()
    };
    
    // Add to project items and save
    projectItems.unshift(newProject);
    await saveProjectsToFirestore({ items: projectItems });
    
    // Close modal and save chatter with new project
    closeProjectSelectionModal();
    saveQuickChatter(pendingChatterType || 'todos', newProject.id);
}

window.openProjectSelectionModal = openProjectSelectionModal;
window.closeProjectSelectionModal = closeProjectSelectionModal;
window.selectProjectForTodo = selectProjectForTodo;
window.skipProjectSelection = skipProjectSelection;
window.createProjectAndLink = createProjectAndLink;

// Habit detail functions
export function openHabitDetailModal(chatterId) {
    const chatter = chatterItems.find(c => c.id === chatterId);
    if (!chatter || chatter.type !== 'habits') return;
    
    document.getElementById('habitChatterId').value = chatterId;
    document.getElementById('habitName').value = chatter.title;
    document.getElementById('habitPoints').value = 1;
    document.getElementById('habitHasNumericalValue').checked = false;
    document.getElementById('habitNumericalValue').value = 0;
    document.getElementById('habitChangeValue').value = 1;
    document.getElementById('numericalValueFields').classList.add('hidden');
    
    const modal = document.getElementById('habitDetailModal');
    if (modal) modal.classList.remove('hidden');
}

export function closeHabitDetailModal() {
    const modal = document.getElementById('habitDetailModal');
    if (modal) modal.classList.add('hidden');
}

export function toggleNumericalValue() {
    const checkbox = document.getElementById('habitHasNumericalValue');
    const fields = document.getElementById('numericalValueFields');
    if (checkbox && fields) {
        if (checkbox.checked) {
            fields.classList.remove('hidden');
        } else {
            fields.classList.add('hidden');
        }
    }
}

export async function startHabit() {
    const chatterId = document.getElementById('habitChatterId').value;
    const points = parseInt(document.getElementById('habitPoints').value) || 1;
    const hasNumericalValue = document.getElementById('habitHasNumericalValue').checked;
    const numericalValue = parseFloat(document.getElementById('habitNumericalValue').value) || 0;
    const changeValue = parseFloat(document.getElementById('habitChangeValue').value) || 0;
    
    const chatter = chatterItems.find(c => c.id === chatterId);
    if (!chatter) return;
    
    // Create habit from chatter
    const habitsModule = await import('./habits.js');
    const newHabit = {
        id: chatterId, // Use same ID as chatter
        title: chatter.title,
        points: Math.max(1, Math.min(10, points)),
        hasNumericalValue: hasNumericalValue,
        numericalValue: numericalValue,
        currentValue: numericalValue,
        changeValue: hasNumericalValue ? changeValue : 0,
        createdAt: new Date().toISOString()
    };
    
    // Get current habits and add new one
    const currentHabits = [...habitsModule.habitItems];
    currentHabits.push(newHabit);
    
    // Save habits
    const { saveHabitsToFirestore } = await import('./storage.js');
    await saveHabitsToFirestore({ 
        items: currentHabits, 
        checkHistory: habitsModule.habitCheckHistory 
    });
    
    // Remove from chatter
    chatterItems = chatterItems.filter(c => c.id !== chatterId);
    await saveChatterToFirestore({ items: chatterItems });
    
    // Close modal and refresh
    closeHabitDetailModal();
    renderChatter();
}

export function editHabitChatter() {
    const chatterId = document.getElementById('habitChatterId').value;
    closeHabitDetailModal();
    openChatterModal(chatterId);
}

export function deleteHabitChatter() {
    const chatterId = document.getElementById('habitChatterId').value;
    closeHabitDetailModal();
    deleteChatter(chatterId);
}

window.openHabitDetailModal = openHabitDetailModal;
window.closeHabitDetailModal = closeHabitDetailModal;
window.toggleNumericalValue = toggleNumericalValue;
window.startHabit = startHabit;
window.editHabitChatter = editHabitChatter;
window.deleteHabitChatter = deleteHabitChatter;
