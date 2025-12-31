import { saveToFirestore } from './storage.js';
import { interpolatedData } from './chart.js';

export let entries = [];

export function setEntries(newEntries) {
    entries = newEntries;
}

export function addEntry(settings, onComplete) {
    const date = document.getElementById('date').value;
    const weight = parseFloat(document.getElementById('weight').value);
    if (!date || isNaN(weight)) return;
    
    entries = entries.filter(e => e.date !== date);
    entries.push({ date, weight });
    entries.sort((a, b) => a.date.localeCompare(b.date));
    saveToFirestore(entries, settings);
    if (onComplete) onComplete();
    document.getElementById('weight').value = '';
}

export function deleteEntry(date, settings, onComplete) {
    entries = entries.filter(e => e.date !== date);
    saveToFirestore(entries, settings);
    if (onComplete) onComplete();
}

export function renderEntryList(settings) {
    const list = document.getElementById('list');
    
    // Build combined list of actual entries and interpolated dates
    const allItems = [];
    
    // Add actual entries
    entries.forEach(e => {
        allItems.push({ date: e.date, weight: e.weight, isInterpolated: false });
    });
    
    // Add interpolated entries from chart data
    if (interpolatedData.dates.length > 0) {
        interpolatedData.dates.forEach((date, i) => {
            if (interpolatedData.isInterpolated[i] && interpolatedData.weights[i] !== null) {
                // Only add if not already an actual entry
                if (!entries.find(e => e.date === date)) {
                    allItems.push({ 
                        date, 
                        weight: Math.round(interpolatedData.weights[i] * 10) / 10, 
                        isInterpolated: true 
                    });
                }
            }
        });
    }
    
    // Sort by date descending
    allItems.sort((a, b) => b.date.localeCompare(a.date));
    
    list.innerHTML = allItems.map(e => {
        const greyStyle = e.isInterpolated ? 'color: #9ca3af;' : '';
        const labelStyle = e.isInterpolated ? 'color: #9ca3af; font-style: italic;' : '';
        
        let goalInfo = '';
        if (settings.goalStart && settings.goalWeights.length > 0) {
            const daysSinceStart = Math.floor((new Date(e.date) - new Date(settings.goalStart)) / 86400000);
            if (daysSinceStart >= 0 && daysSinceStart < settings.goalWeights.length) {
                const goalWeight = settings.goalWeights[daysSinceStart];
                const diff = e.weight - goalWeight;
                const diffStr = (diff > 0 ? '+' : '') + diff.toFixed(1);
                const color = e.isInterpolated ? 'color: #9ca3af' : (diff < 0 ? 'color: #059669' : 'color: #dc2626');
                goalInfo = `<span class="goal-info" style="${greyStyle}">Goal: ${goalWeight} kg <span style="${color}; font-weight: 600">${diffStr}</span></span>`;
            }
        }
        
        const deleteBtn = e.isInterpolated ? '' : `<button onclick="window.deleteEntry('${e.date}')" class="btn-danger" style="font-size: 0.875rem">×</button>`;
        
        return `<li class="entry-item">
            <div style="display: flex; flex-direction: column">
                <span style="${labelStyle}">${e.date}: <strong>${e.weight} kg</strong>${e.isInterpolated ? ' (est.)' : ''}</span>
                ${goalInfo}
            </div>
            ${deleteBtn}
        </li>`;
    }).join('');
}
