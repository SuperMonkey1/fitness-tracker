import { toggleMenu } from './auth.js';
import { saveToFirestore } from './storage.js';

export let settings = { minY: null, maxY: null, goalStartWeight: null, goalSegments: [], goalWeights: [] };

export function setSettings(newSettings) {
    settings = newSettings;
}

export function openSettings() {
    toggleMenu();
    document.getElementById('minY').value = settings.minY || '';
    document.getElementById('maxY').value = settings.maxY || '';
    document.getElementById('goalStartWeight').value = settings.goalStartWeight || '';
    document.getElementById('goalWeights').value = (settings.goalWeights || []).join(', ');
    renderGoalSegments();
    document.getElementById('settingsModal').classList.remove('hidden');
}

export function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

export function renderGoalSegments() {
    const container = document.getElementById('goalSegments');
    const segments = settings.goalSegments || [];
    if (segments.length === 0) {
        segments.push({ startDate: '', endDate: '', lossPerDay: 0.1 });
    }
    container.innerHTML = segments.map((seg, i) => `
        <div class="segment-item">
            <input type="date" value="${seg.startDate || ''}" onchange="window.updateSegment(${i}, 'startDate', this.value)" class="form-input flex-1">
            <span>to</span>
            <input type="date" value="${seg.endDate || ''}" onchange="window.updateSegment(${i}, 'endDate', this.value)" class="form-input flex-1">
            <input type="number" value="${seg.lossPerDay || 0.1}" step="0.01" onchange="window.updateSegment(${i}, 'lossPerDay', parseFloat(this.value))" class="form-input" style="width: 4rem" title="kg/day">
            <span style="color: #6b7280">kg/d</span>
            <button onclick="window.removeSegment(${i})" class="btn-danger" style="padding: 0 0.25rem">×</button>
        </div>
    `).join('');
}

export function updateSegment(index, field, value) {
    if (!settings.goalSegments) settings.goalSegments = [];
    if (!settings.goalSegments[index]) settings.goalSegments[index] = {};
    settings.goalSegments[index][field] = value;
}

export function addGoalSegment() {
    if (!settings.goalSegments) settings.goalSegments = [];
    const lastSeg = settings.goalSegments[settings.goalSegments.length - 1];
    let newStartDate = '';
    if (lastSeg?.endDate) {
        const nextDay = new Date(lastSeg.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        newStartDate = nextDay.toISOString().split('T')[0];
    }
    settings.goalSegments.push({ startDate: newStartDate, endDate: '', lossPerDay: 0.1 });
    renderGoalSegments();
}

export function removeSegment(index) {
    settings.goalSegments.splice(index, 1);
    if (settings.goalSegments.length === 0) {
        settings.goalSegments.push({ startDate: '', endDate: '', lossPerDay: 0.1 });
    }
    renderGoalSegments();
}

export function generateGoalWeights() {
    const startWeight = parseFloat(document.getElementById('goalStartWeight').value);
    const segments = settings.goalSegments || [];
    
    if (isNaN(startWeight)) {
        alert('Please fill in Start Weight');
        return;
    }
    
    if (segments.length === 0 || !segments[0].startDate) {
        alert('Please add at least one date segment');
        return;
    }
    
    const sortedSegments = [...segments].filter(s => s.startDate && s.endDate).sort((a, b) => a.startDate.localeCompare(b.startDate));
    
    if (sortedSegments.length === 0) {
        alert('Please fill in start and end dates for at least one segment');
        return;
    }
    
    const weights = [];
    let currentWeight = startWeight;
    
    for (const seg of sortedSegments) {
        const start = new Date(seg.startDate);
        const end = new Date(seg.endDate);
        const days = Math.floor((end - start) / 86400000) + 1;
        const lossPerDay = seg.lossPerDay || 0;
        
        for (let i = 0; i < days; i++) {
            if (weights.length > 0 || i > 0) {
                currentWeight -= lossPerDay;
            }
            weights.push(parseFloat(currentWeight.toFixed(2)));
        }
    }
    
    document.getElementById('goalWeights').value = weights.join(', ');
    settings.goalStart = sortedSegments[0].startDate;
}

export function saveSettings(entries, onComplete) {
    const minY = document.getElementById('minY').value;
    const maxY = document.getElementById('maxY').value;
    const goalStartWeight = document.getElementById('goalStartWeight').value;
    const goalWeightsText = document.getElementById('goalWeights').value;
    
    settings.minY = minY ? parseFloat(minY) : null;
    settings.maxY = maxY ? parseFloat(maxY) : null;
    settings.goalStartWeight = goalStartWeight ? parseFloat(goalStartWeight) : null;
    settings.goalWeights = goalWeightsText
        ? goalWeightsText.split(/[\n,]+/).map(w => parseFloat(w.trim())).filter(w => !isNaN(w))
        : [];
    
    saveToFirestore(entries, settings);
    closeSettings();
    if (onComplete) onComplete();
}
