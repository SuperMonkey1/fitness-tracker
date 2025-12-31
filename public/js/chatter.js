import { saveChatterToFirestore, loadChatterFromFirestore } from './storage.js';

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
    container.innerHTML = `
        <div id="chatterList" class="${isEmpty ? '' : 'space-y-4 pb-24'}" style="${isEmpty ? 'overflow: hidden;' : ''}">
            ${renderChatterList()}
        </div>
        
        <!-- Quick Add Bar (Google Keep style) -->
        <div class="fixed bottom-0 left-0 right-0 shadow-lg p-4 pb-8" style="z-index: 15; background-color: #fdfdf9ff;">
            <div class="max-w-4xl mx-auto flex gap-2 items-center">
                <input 
                    type="text" 
                    id="quickChatterInput" 
                    class="form-input flex-1" 
                    placeholder="Add a chatter"
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
                                class="chip-button ${i === 0 ? 'chip-selected' : ''}" 
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
    `;
}

function renderChatterList() {
    if (chatterItems.length === 0) {
        // Start the rain animation after DOM is ready
        setTimeout(() => initRainAnimation(), 100);
        return `
            <div class="relative" style="height: calc(100vh - 220px); overflow: hidden;">
                <canvas id="rainCanvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center">
                        <p class="text-lg text-gray-500">Let's catch some chatter...</p>
                        <svg class="mx-auto mt-2" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12h10V2z" fill="#FFC000"/>
                            <path d="M12 2c5.52 0 10 4.48 10 10H12V2z" fill="#FFC000"/>
                            <path d="M12 12v7c0 1.1-.9 2-2 2s-2-.9-2-2" stroke="#FFC000" stroke-width="2" stroke-linecap="round" fill="none"/>
                        </svg>
                    </div>
                </div>
            </div>
        `;
    }
    
    return chatterItems.map(item => {
        const type = CHATTER_TYPES.find(t => t.id === item.type);
        return `
            <div class="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-4" data-chatter-id="${item.id}" ondblclick="openChatterActions('${item.id}')">
                <div class="flex-1">
                    <p class="text-gray-800 font-medium mb-1">${escapeHtml(item.title)}</p>
                    <div class="flex items-center gap-2">
                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">${type ? type.label : item.type}</span>
                        <span class="text-xs text-gray-500">${formatDate(item.createdAt)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

let pendingChatterTitle = '';
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
    
    // Reset selection to first type
    const chips = document.querySelectorAll('#chatterTypeChips .chip-button');
    chips.forEach((chip, i) => {
        if (i === 0) {
            chip.classList.add('chip-selected');
        } else {
            chip.classList.remove('chip-selected');
        }
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
    
    // Save immediately
    saveQuickChatter(typeId);
}

async function saveQuickChatter(typeId) {
    if (!pendingChatterTitle) return;
    
    const newItem = {
        id: generateId(),
        title: pendingChatterTitle,
        type: typeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    chatterItems.unshift(newItem);
    await saveChatterToFirestore({ items: chatterItems });
    
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
    
    // Update chip selection
    const chips = document.querySelectorAll('#chatterTypeChips .chip-button');
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
    closeChatterActionsModal();
    openChatterModal(currentActionChatterId);
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
    
    // Raindrops
    const raindrops = [];
    const raindropGeometry = new THREE.PlaneGeometry(2, 12);
    const raindropMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x6ba3d6,
        transparent: true,
        opacity: 0.6
    });
    
    const raindropCount = Math.floor((width * height) / 2000);
    for (let i = 0; i < raindropCount; i++) {
        const raindrop = new THREE.Mesh(raindropGeometry, raindropMaterial);
        raindrop.position.x = Math.random() * width - width / 2;
        raindrop.position.y = Math.random() * height - height / 2 + height;
        raindrop.velocity = 4 + Math.random() * 6;
        scene.add(raindrop);
        raindrops.push(raindrop);
    }
    
    // Ripples
    const ripples = [];
    const rippleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.4,
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
    
    // Water fill rectangle
    const waterGeometry = new THREE.PlaneGeometry(width, 1);
    const waterMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x6ba3d6,
        transparent: true,
        opacity: 0.4
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.y = -height / 2;
    water.scale.y = waterLevel;
    scene.add(water);
    
    function animate() {
        rainAnimationId = requestAnimationFrame(animate);
        
        // Update raindrops
        raindrops.forEach(drop => {
            drop.position.y -= drop.velocity;
            
            // Check if hit water level
            const waterSurfaceY = -height / 2 + waterLevel;
            if (drop.position.y < waterSurfaceY) {
                createRipple(drop.position.x, waterSurfaceY);
                drop.position.y = height / 2 + Math.random() * 50;
                drop.position.x = Math.random() * width - width / 2;
                
                // Keep filling up to max height
                if (waterLevel < maxWaterLevel) {
                    waterLevel += 0.03;
                }
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
