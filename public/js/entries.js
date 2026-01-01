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
    
    // Add future goal weight entries
    if (settings.goalStart && settings.goalWeights.length > 0) {
        const startDate = new Date(settings.goalStart);
        for (let i = 0; i < settings.goalWeights.length; i++) {
            const futureDate = new Date(startDate);
            futureDate.setDate(startDate.getDate() + i);
            const dateStr = futureDate.toISOString().split('T')[0];
            
            // Only add if not already in the list
            if (!allItems.find(item => item.date === dateStr)) {
                allItems.push({
                    date: dateStr,
                    weight: null,
                    isGoalOnly: true,
                    goalWeight: settings.goalWeights[i]
                });
            }
        }
    }
    
    // Sort by date ascending (oldest first)
    allItems.sort((a, b) => a.date.localeCompare(b.date));
    
    // Get today's date string for scrolling
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    list.innerHTML = allItems.map((e, index) => {
        const greyStyle = e.isInterpolated || e.isGoalOnly ? 'color: #9ca3af;' : '';
        const labelStyle = e.isInterpolated || e.isGoalOnly ? 'color: #9ca3af; font-style: italic;' : '';
        
        let goalInfo = '';
        if (settings.goalStart && settings.goalWeights.length > 0) {
            const daysSinceStart = Math.floor((new Date(e.date) - new Date(settings.goalStart)) / 86400000);
            if (daysSinceStart >= 0 && daysSinceStart < settings.goalWeights.length) {
                const goalWeight = settings.goalWeights[daysSinceStart];
                
                if (e.isGoalOnly) {
                    // For goal-only entries, just show the goal
                    goalInfo = `<span class="goal-info" style="${greyStyle}">Goal: ${goalWeight} kg</span>`;
                } else {
                    // For actual/interpolated entries, show goal and difference
                    const diff = e.weight - goalWeight;
                    const diffStr = (diff > 0 ? '+' : '') + diff.toFixed(1);
                    const color = e.isInterpolated ? 'color: #9ca3af' : (diff < 0 ? 'color: #059669' : 'color: #dc2626');
                    goalInfo = `<span class="goal-info" style="${greyStyle}">Goal: ${goalWeight} kg <span style="${color}; font-weight: 600">${diffStr}</span></span>`;
                }
            }
        }
        
        const deleteBtn = e.isInterpolated || e.isGoalOnly ? '' : `<button onclick="window.deleteEntry('${e.date}')" class="btn-danger" style="font-size: 0.875rem">×</button>`;
        
        const weightDisplay = e.isGoalOnly ? '' : `<strong>${e.weight} kg</strong>${e.isInterpolated ? ' (est.)' : ''}`;
        const separator = e.isGoalOnly ? '' : ': ';
        
        // Add id to today's entry for scrolling
        const idAttr = e.date === todayStr ? ` id="today-entry"` : '';
        
        return `<li class="entry-item"${idAttr}>
            <div style="display: flex; flex-direction: column">
                <span style="${labelStyle}">${e.date}${separator}${weightDisplay}</span>
                ${goalInfo}
            </div>
            ${deleteBtn}
        </li>`;
    }).join('');
    
    // Auto scroll to today's entry
    setTimeout(() => {
        const todayEntry = document.getElementById('today-entry');
        if (todayEntry) {
            todayEntry.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}
