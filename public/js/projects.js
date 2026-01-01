import { saveProjectsToFirestore, loadProjectsFromFirestore, loadChatterFromFirestore } from './storage.js';

export let projectItems = [];
let chatterItems = [];

export function setProjectItems(items) {
    projectItems = items || [];
}

export async function initProjects() {
    const data = await loadProjectsFromFirestore();
    projectItems = data.items || [];
    
    // Load chatter items to show todos
    const chatterData = await loadChatterFromFirestore();
    chatterItems = chatterData.items || [];
    
    renderProjects();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function renderProjects() {
    const container = document.getElementById('projectsContent');
    if (!container) return;
    
    const isEmpty = projectItems.length === 0;
    container.innerHTML = `
        <div id="projectsList" class="${isEmpty ? '' : 'space-y-2'}" style="${isEmpty ? 'overflow: hidden;' : 'height: 100%; overflow-y: auto; overflow-x: hidden; padding-right: 4px; padding-bottom: 120px;'}">
            ${renderProjectsList()}
        </div>
        
        <!-- Quick Add Bar -->
        <div class="fixed bottom-0 left-0 right-0 shadow-lg p-4 pb-8" style="z-index: 15; background-color: #fdfdf9ff;">
            <div class="max-w-4xl mx-auto flex gap-2 items-center">
                <input 
                    type="text" 
                    id="quickProjectInput" 
                    class="form-input flex-1" 
                    placeholder="Add a new project"
                    onkeypress="handleQuickProjectKeypress(event)">
                <button onclick="handleQuickProjectSubmit()" class="btn-primary px-6">Add</button>
            </div>
        </div>
        
        <!-- Edit Project Modal -->
        <div id="projectModal" class="hidden modal-overlay">
            <div class="modal-content">
                <h2 id="projectModalTitle" class="text-lg font-bold mb-4">Edit Project</h2>
                <div class="form-group">
                    <label class="form-label">Project Name</label>
                    <input type="text" id="projectTitle" class="form-input" placeholder="Project name">
                </div>
                <div class="form-group">
                    <label class="form-label">Description (optional)</label>
                    <textarea id="projectDescription" class="form-input" rows="3" placeholder="Project description"></textarea>
                </div>
                <div class="flex gap-2 mt-4">
                    <button onclick="saveProject()" class="btn-primary flex-1">Save</button>
                    <button onclick="closeProjectModal()" class="btn-secondary flex-1">Cancel</button>
                </div>
            </div>
        </div>
        
        <!-- Delete Confirmation Modal -->
        <div id="deleteProjectModal" class="hidden modal-overlay">
            <div class="modal-content">
                <h2 class="text-lg font-bold mb-4">Delete this project?</h2>
                <div class="flex gap-2">
                    <button onclick="confirmDeleteProject()" class="btn-danger flex-1">Delete</button>
                    <button onclick="closeDeleteProjectModal()" class="btn-secondary flex-1">Cancel</button>
                </div>
            </div>
        </div>
    `;
}

function renderProjectsList() {
    if (projectItems.length === 0) {
        return `
            <div class="flex items-center justify-center" style="height: calc(100vh - 220px);">
                <div class="text-center">
                    <p class="text-sm text-gray-600">No projects yet</p>
                    <p class="text-xs text-gray-500 mt-2">Add your first project below</p>
                </div>
            </div>
        `;
    }
    
    return projectItems.map(item => {
        // Get todos for this project
        const projectTodos = chatterItems.filter(c => c.projectId === item.id && c.type === 'todos');
        const todoCount = projectTodos.length;
        
        return `
            <div class="border border-gray-200 rounded-lg p-4 bg-white" data-project-id="${item.id}">
                <div class="flex justify-between items-start">
                    <div class="flex-1 cursor-pointer" onclick="toggleProjectTodos('${item.id}')">
                        <div class="flex items-center gap-2">
                            <span class="text-gray-400 transition-transform project-chevron" id="project-chevron-${item.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </span>
                            <h3 class="font-semibold text-gray-800">${escapeHtml(item.title)}</h3>
                        </div>
                        ${item.description ? `<p class="text-sm text-gray-600 ml-6">${escapeHtml(item.description)}</p>` : ''}
                        <div class="text-sm text-gray-500 mt-1 ml-6">
                            ${todoCount > 0 ? `
                                <span>${todoCount} todo${todoCount > 1 ? 's' : ''}</span>
                            ` : '<span class="text-gray-400">No todos yet</span>'}
                        </div>
                    </div>
                    <div class="flex gap-2 items-center">
                        <button onclick="event.stopPropagation(); openProjectEdit('${item.id}')" class="text-blue-500 hover:text-blue-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                        </button>
                        <button onclick="event.stopPropagation(); openDeleteProjectConfirmation('${item.id}')" class="text-red-500 hover:text-red-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div id="project-todos-${item.id}" class="hidden mt-3 ml-6">
                    ${projectTodos.length > 0 ? `
                        <div class="space-y-2">
                            ${projectTodos.map(todo => `
                                <div class="flex items-center bg-gray-50 rounded text-sm p-2">
                                    <div class="flex-1">
                                        <span class="text-gray-700">${escapeHtml(todo.title)}</span>
                                    </div>
                                    <span class="text-xs text-gray-400">${formatDate(todo.createdAt)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

export function toggleProjectTodos(projectId) {
    const todosContainer = document.getElementById(`project-todos-${projectId}`);
    const chevron = document.getElementById(`project-chevron-${projectId}`);
    
    if (todosContainer && chevron) {
        todosContainer.classList.toggle('hidden');
        chevron.style.transform = todosContainer.classList.contains('hidden') ? '' : 'rotate(90deg)';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

let currentProjectId = null;
let projectIdToDelete = null;

export function handleQuickProjectKeypress(event) {
    if (event.key === 'Enter') {
        handleQuickProjectSubmit();
    }
}

export async function handleQuickProjectSubmit() {
    const input = document.getElementById('quickProjectInput');
    const title = input.value.trim();
    
    if (!title) {
        return;
    }
    
    const newProject = {
        id: generateId(),
        title: title,
        description: '',
        createdAt: new Date().toISOString()
    };
    
    projectItems.unshift(newProject);
    input.value = '';
    
    await saveProjectsToFirestore({ items: projectItems });
    renderProjects();
}

export function openProjectEdit(projectId) {
    currentProjectId = projectId;
    const project = projectItems.find(p => p.id === projectId);
    
    if (!project) return;
    
    document.getElementById('projectModalTitle').textContent = 'Edit Project';
    document.getElementById('projectTitle').value = project.title;
    document.getElementById('projectDescription').value = project.description || '';
    
    const modal = document.getElementById('projectModal');
    if (modal) modal.classList.remove('hidden');
}

export function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) modal.classList.add('hidden');
    currentProjectId = null;
}

export async function saveProject() {
    const title = document.getElementById('projectTitle').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    
    if (!title) {
        alert('Please enter a project name');
        return;
    }
    
    if (currentProjectId) {
        const project = projectItems.find(p => p.id === currentProjectId);
        if (project) {
            project.title = title;
            project.description = description;
        }
    }
    
    await saveProjectsToFirestore({ items: projectItems });
    closeProjectModal();
    renderProjects();
}

export function openDeleteProjectConfirmation(projectId) {
    projectIdToDelete = projectId;
    const modal = document.getElementById('deleteProjectModal');
    if (modal) modal.classList.remove('hidden');
}

export function closeDeleteProjectModal() {
    const modal = document.getElementById('deleteProjectModal');
    if (modal) modal.classList.add('hidden');
    projectIdToDelete = null;
}

export async function confirmDeleteProject() {
    if (projectIdToDelete) {
        projectItems = projectItems.filter(p => p.id !== projectIdToDelete);
        saveProjectsToFirestore({ items: projectItems });
        renderProjects();
    }
    closeDeleteProjectModal();
}

// Expose functions globally
window.handleQuickProjectKeypress = handleQuickProjectKeypress;
window.handleQuickProjectSubmit = handleQuickProjectSubmit;
window.openProjectEdit = openProjectEdit;
window.closeProjectModal = closeProjectModal;
window.saveProject = saveProject;
window.openDeleteProjectConfirmation = openDeleteProjectConfirmation;
window.closeDeleteProjectModal = closeDeleteProjectModal;
window.confirmDeleteProject = confirmDeleteProject;
window.toggleProjectTodos = toggleProjectTodos;
