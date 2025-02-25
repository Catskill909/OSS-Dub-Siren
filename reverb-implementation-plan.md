# Reverb Implementation Plan

## 1. HTML/CSS Updates
Add new knob controls under the frequency knob:
```html
<div class="knob-container">
    <div id="reverbAmountKnob" class="knob"></div>
    <div class="knob-label">Reverb Amount</div>
    <div id="reverbAmountValue" class="knob-value">0.0</div>
    <input type="range" id="reverbAmount" min="0" max="1" value="0" step="0.01">
</div>

<div class="knob-container">
    <div id="roomSizeKnob" class="knob"></div>
    <div class="knob-label">Room Size</div>
    <div id="roomSizeValue" class="knob-value">0.5</div>
    <input type="range" id="roomSize" min="0.1" max="0.9" value="0.5" step="0.1">
</div>
```

## 2. JavaScript Updates

### New Global Variables
```javascript
let convolverNode = null;
let dryGainNode = null;
let wetGainNode = null;
```

### Modified Audio Setup
Update setupAudio() to include reverb nodes:
```javascript
// Create convolver and gain nodes for reverb
convolverNode = audioContext.createConvolver();
dryGainNode = audioContext.createGain();
wetGainNode = audioContext.createGain();

// Create impulse response for reverb
createImpulseResponse(audioContext, parseFloat(document.getElementById('roomSize').value));

// Set initial wet/dry mix
const reverbAmount = parseFloat(document.getElementById('reverbAmount').value);
dryGainNode.gain.setValueAtTime(1 - reverbAmount, audioContext.currentTime);
wetGainNode.gain.setValueAtTime(reverbAmount, audioContext.currentTime);

// Connect nodes with parallel dry/wet paths
oscillator.connect(gainNode);
gainNode.connect(dryGainNode);
gainNode.connect(convolverNode);
convolverNode.connect(wetGainNode);
dryGainNode.connect(delayNode);
wetGainNode.connect(delayNode);
```

### New Functions

1. Create impulse response:
```javascript
function createImpulseResponse(context, roomSize) {
    const sampleRate = context.sampleRate;
    const length = sampleRate * roomSize;
    const impulse = context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 10);
        }
    }
    
    convolverNode.buffer = impulse;
}
```

2. Update setupKnobControls:
```javascript
function setupKnobControls() {
    // Add new knobs to existing setup
    setupKnob('frequency', 20, 2000);
    setupKnob('reverbAmount', 0, 1);
    setupKnob('roomSize', 0.1, 0.9);
    setupKnob('modSpeed', 0, 10);
    setupKnob('delayTime', 0, 1);
    setupKnob('feedback', 0, 0.9);
    setupKnob('volume', 0, 1);
}
```

3. Add event listeners:
```javascript
document.getElementById('reverbAmount').addEventListener('input', (e) => {
    document.getElementById('reverbAmountValue').textContent = e.target.value;
    if (wetGainNode && dryGainNode) {
        wetGainNode.gain.setValueAtTime(e.target.value, audioContext.currentTime);
        dryGainNode.gain.setValueAtTime(1 - e.target.value, audioContext.currentTime);
    }
});

document.getElementById('roomSize').addEventListener('input', (e) => {
    document.getElementById('roomSizeValue').textContent = e.target.value;
    if (convolverNode && audioContext) {
        createImpulseResponse(audioContext, e.target.value);
    }
});
```

## 3. Implementation Steps

1. Update HTML first to add the new knob controls
2. Modify script.js to add reverb functionality:
   - Add new global variables
   - Update setupAudio() with reverb node creation and connections
   - Add createImpulseResponse() function
   - Update setupKnobControls() to include new knobs
   - Add new event listeners for reverb controls
3. Test the implementation:
   - Verify knob controls work smoothly
   - Test reverb effect with different sounds
   - Ensure compatibility with existing effects
   - Check for any audio glitches or performance issues

## 4. Expected Behavior

- Reverb Amount (0-1):
  - 0: Dry signal only
  - 1: Full wet signal (maximum reverb)
  - Values in between create a mix of dry and wet signal

- Room Size (0.1-0.9):
  - 0.1: Small room, short reverb tail
  - 0.9: Large room, long reverb tail
  - Changes should update in real-time

The reverb effect should:
- Blend smoothly with existing delay effects
- Maintain stability when changing parameters
- Not cause significant audio latency
- Work consistently across different pad sounds