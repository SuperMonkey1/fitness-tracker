export let chart;

// Linear interpolation for missing values
function interpolateWeights(dates, entries) {
    const weights = dates.map(d => {
        const entry = entries.find(e => e.date === d);
        return entry ? entry.weight : null;
    });
    
    const isInterpolated = dates.map(d => {
        const entry = entries.find(e => e.date === d);
        return !entry;
    });
    
    // Interpolate missing values
    for (let i = 0; i < weights.length; i++) {
        if (weights[i] === null) {
            // Find previous known value
            let prevIndex = -1;
            for (let j = i - 1; j >= 0; j--) {
                if (weights[j] !== null && !isInterpolated[j]) {
                    prevIndex = j;
                    break;
                }
            }
            
            // Find next known value
            let nextIndex = -1;
            for (let j = i + 1; j < weights.length; j++) {
                if (weights[j] !== null && !isInterpolated[j]) {
                    nextIndex = j;
                    break;
                }
            }
            
            // Interpolate if both bounds exist
            if (prevIndex !== -1 && nextIndex !== -1) {
                const prevWeight = weights[prevIndex];
                const nextWeight = weights[nextIndex];
                const ratio = (i - prevIndex) / (nextIndex - prevIndex);
                weights[i] = prevWeight + (nextWeight - prevWeight) * ratio;
                isInterpolated[i] = true;
            }
        }
    }
    
    return { weights, isInterpolated };
}

// Store interpolated data for use by entries list
export let interpolatedData = { dates: [], weights: [], isInterpolated: [] };

export function renderChart(entries, settings) {
    // Build date range including goal dates
    let allDates = [...new Set(entries.map(e => e.date))];
    
    if (settings.goalStart && settings.goalWeights.length > 0) {
        const goalDates = settings.goalWeights.map((_, i) => {
            const d = new Date(settings.goalStart);
            d.setDate(d.getDate() + i);
            return d.toISOString().split('T')[0];
        });
        allDates = [...new Set([...allDates, ...goalDates])];
    }
    
    allDates.sort();
    
    // Map data to all dates with interpolation
    const labels = allDates.map(d => d.slice(5));
    const { weights, isInterpolated } = interpolateWeights(allDates, entries);
    
    // Store for entries list
    interpolatedData = { dates: allDates, weights, isInterpolated };
    
    // Find last measured date
    const lastMeasuredDate = entries.length > 0 
        ? entries.reduce((latest, e) => e.date > latest ? e.date : latest, entries[0].date)
        : null;
    
    // Calculate 14-day average using interpolated weights
    const avgData = allDates.map((d, i) => {
        // Only calculate average up to the last measured date
        if (lastMeasuredDate && d > lastMeasuredDate) return null;
        
        // Count measured entries up to this date
        const measuredEntriesUpToDate = entries.filter(e => e.date <= d);
        
        if (measuredEntriesUpToDate.length < 14) {
            // Use average of all weights (including interpolated) up to this date
            const allWeightsUpToDate = weights.slice(0, i + 1).filter(w => w !== null);
            if (allWeightsUpToDate.length === 0) return null;
            return allWeightsUpToDate.reduce((a, b) => a + b, 0) / allWeightsUpToDate.length;
        }
        
        // Get weights from the last 14 days (including today)
        const currentDate = new Date(d);
        const fourteenDaysAgo = new Date(d);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
        
        const relevantWeights = [];
        for (let j = 0; j <= i; j++) {
            const dateJ = new Date(allDates[j]);
            if (dateJ >= fourteenDaysAgo && dateJ <= currentDate && weights[j] !== null) {
                relevantWeights.push(weights[j]);
            }
        }
        
        if (relevantWeights.length === 0) return null;
        return relevantWeights.reduce((a, b) => a + b, 0) / relevantWeights.length;
    });
    
    // Create segment colors based on interpolation
    const segmentColor = (ctx) => {
        const index = ctx.p0DataIndex;
        const nextIndex = ctx.p1DataIndex;
        if (isInterpolated[index] || isInterpolated[nextIndex]) {
            return '#9ca3af'; // grey for interpolated
        }
        return '#3b82f6'; // blue for actual
    };
    
    // Goal data
    const datasets = [
        { 
            label: 'Weight', 
            data: weights, 
            borderColor: '#3b82f6',
            segment: {
                borderColor: segmentColor
            },
            borderWidth: 1.5,
            tension: 0.1, 
            spanGaps: false,
            pointRadius: 0
        },
        { 
            label: '14-day Avg', 
            data: avgData, 
            borderColor: '#10b981', 
            borderWidth: 1.5,
            tension: 0.1, 
            spanGaps: true,
            pointRadius: 0
        }
    ];
    
    if (settings.goalStart && settings.goalWeights.length > 0) {
        const goalData = allDates.map(d => {
            const daysSinceStart = Math.floor((new Date(d) - new Date(settings.goalStart)) / 86400000);
            if (daysSinceStart < 0 || daysSinceStart >= settings.goalWeights.length) return null;
            return settings.goalWeights[daysSinceStart];
        });
        datasets.push({ 
            label: 'Goal', 
            data: goalData, 
            borderColor: '#f59e0b', 
            borderWidth: 1.5,
            tension: 0.1,
            pointRadius: 0,
            spanGaps: false
        });
    }

    // Calculate min/max for y-axis if not set
    let yMin = settings.minY;
    let yMax = settings.maxY;
    
    if (yMin === null || yMax === null) {
        const allWeights = [...weights, ...avgData, ...(datasets[2]?.data || [])].filter(w => w !== null);
        if (allWeights.length > 0) {
            const dataMin = Math.min(...allWeights);
            const dataMax = Math.max(...allWeights);
            yMin = yMin ?? Math.floor(dataMin - 1);
            yMax = yMax ?? Math.ceil(dataMax + 1);
        }
    }

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('chart'), {
        type: 'line',
        data: { labels, datasets },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                y: {
                    type: 'linear',
                    min: yMin,
                    max: yMax,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}
