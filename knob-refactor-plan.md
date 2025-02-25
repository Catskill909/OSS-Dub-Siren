# UI Refactoring Plan: Knob-Only Controls

## 1. HTML Changes
- Remove all `<input type="range">` elements
- Keep the knob divs and value displays
- Update CSS to ensure proper spacing without the sliders

Current structure:
```html
<div class="knob-container">
    <div id="frequencyKnob" class="knob"></div>
    <div class="knob-label">Frequency</div>
    <div id="freqValue" class="knob-value">440 Hz</div>
    <input type="range" id="frequency" min="20" max="2000" value="440">
</div>
```

New structure:
```html
<div class="knob-container">
    <div id="frequencyKnob" class="knob" data-min="20" data-max="2000" data-value="440"></div>
    <div class="knob-label">Frequency</div>
    <div id="freqValue" class="knob-value">440 Hz</div>
</div>
```

## 2. JavaScript Updates

### A. Modify setupKnob Function
```javascript
function setupKnob(id, min, max) {
    const knob = document.getElementById(`${id}Knob`);
    const valueDisplay = document.getElementById(`${id}Value`);
    
    if (!knob || !valueDisplay) {
        console.error(`Required elements not found for knob ${id}`);
        return;
    }

    // Store values directly on the knob element
    knob.dataset.min = min;
    knob.dataset.max = max;
    knob.dataset.value = getInitialValue(id);
    knob.dataset.id = id;

    let isDragging = false;
    let startY;
    let currentValue = parseFloat(knob.dataset.value);

    function updateValue(newValue) {
        const clampedValue = Math.max(min, Math.min(max, newValue));
        knob.dataset.value = clampedValue;
        updateDisplay(id, clampedValue);
        updateAudioParameter(id, clampedValue);
        updateKnobRotation(knob, clampedValue, min, max);
    }

    // Rest of the event handling logic...
}
```

### B. Add Helper Functions
```javascript
function updateDisplay(id, value) {
    const valueDisplay = document.getElementById(`${id}Value`);
    switch(id) {
        case 'frequency':
            valueDisplay.textContent = Math.round(value) + ' Hz';
            break;
        case 'delayTime':
            valueDisplay.textContent = value.toFixed(2) + 's';
            break;
        default:
            valueDisplay.textContent = value.toFixed(1);
    }
}

function updateAudioParameter(id, value) {
    const now = audioContext?.currentTime ?? 0;
    switch(id) {
        case 'frequency':
            if (oscillator) oscillator.frequency.setValueAtTime(value, now);
            break;
        case 'delayTime':
            if (delayNode) delayNode.delayTime.setValueAtTime(value, now);
            break;
        // Add cases for other parameters...
    }
}

function updateKnobRotation(knob, value, min, max) {
    const rotation = ((value - min) / (max - min) * 270) - 135;
    knob.style.transform = `rotate(${rotation}deg)`;
}
```

### C. Update Event Listeners
- Remove existing input event listeners
- Add new function to handle all audio parameter updates
- Update pad click handlers to work with knob values directly

## 3. CSS Updates
```css
.knob-container {
    text-align: center;
    margin-bottom: 20px;
}

.knob {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin: 0 auto 10px;
    cursor: pointer;
    position: relative;
}
```

## 4. Implementation Steps

1. Update HTML:
   - Remove all range inputs
   - Add data attributes to knob elements

2. Update JavaScript:
   - Implement new setupKnob function
   - Add helper functions
   - Update all audio parameter handling
   - Modify pad handlers

3. Testing:
   - Verify all knob controls work smoothly
   - Test all audio parameters update correctly
   - Check pad functionality
   - Ensure modulation and effects work as before

## Expected Behavior

All functionality should remain identical, with only the UI interaction method changing:
- Knobs should rotate smoothly with mouse movement
- Values should update in real-time
- Audio parameters should respond immediately
- Pad presets should still work correctly
- All effects (delay, reverb, modulation) should function as before

## Compatibility Notes

Ensure the refactored code:
- Works consistently across different browsers
- Maintains touch device support if needed
- Preserves existing audio chain functionality
- Keeps all current parameter ranges and behaviors