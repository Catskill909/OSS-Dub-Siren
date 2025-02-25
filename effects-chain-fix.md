# Effects Chain Fix Plan

## Current Issues
1. Effects not processing audio
2. Modulation not working
3. Parameter controls unresponsive
4. Basic audio working

## Analysis

### Audio Chain Issues
```
Current (problematic):
oscillator -> gain -> dryGain -> destination
        |      |--> convolver -> wetGain -> destination
        |                |--> delay -> feedback -> delay -> destination
```

The problem is parallel routing causing signal loss and incorrect effect routing.

### Required Fixes

1. **Simplified Effects Chain**
```
New Chain:
oscillator -> gain -> effectsChain -> destination

Where effectsChain is:
input -> dryGain -----> mix
    |-> convolver -> wetGain -> mix
    |-> delay <-> feedback
         |-> destination
```

2. **Connection Order**
```javascript
// 1. Create nodes
const nodes = createAudioNodes();

// 2. Configure initial parameters
configureNodes(nodes);

// 3. Connect main chain
connectMainChain(nodes);

// 4. Connect effects chain
connectEffectsChain(nodes);

// 5. Connect to destination
connectToDestination(nodes);
```

3. **Parameter Control Flow**
```javascript
function updateParameter(param, value) {
    // 1. Validate parameter
    if (!isValidParam(param)) return;
    
    // 2. Get correct node
    const node = getAudioNode(param);
    
    // 3. Apply with proper timing
    applyParameter(node, param, value);
    
    // 4. Update UI
    updateUI(param, value);
}
```

## Implementation Steps

1. **Update Audio Node Creation**
```javascript
function createAudioNodes() {
    const nodes = {
        oscillator: context.createOscillator(),
        gain: context.createGain(),
        dryGain: context.createGain(),
        wetGain: context.createGain(),
        delay: context.createDelay(),
        feedback: context.createGain(),
        convolver: context.createConvolver(),
        mixer: context.createGain()
    };
    
    // Set initial gains
    nodes.dryGain.gain.value = 1;
    nodes.wetGain.gain.value = 0;
    nodes.feedback.gain.value = 0;
    
    return nodes;
}
```

2. **Update Connection Logic**
```javascript
function connectEffectsChain(nodes) {
    // Main signal flow
    nodes.gain.connect(nodes.dryGain);
    nodes.dryGain.connect(nodes.mixer);
    
    // Effects path
    nodes.gain.connect(nodes.convolver);
    nodes.convolver.connect(nodes.wetGain);
    nodes.wetGain.connect(nodes.mixer);
    
    // Delay network
    nodes.gain.connect(nodes.delay);
    nodes.delay.connect(nodes.feedback);
    nodes.feedback.connect(nodes.delay);
    nodes.delay.connect(nodes.mixer);
    
    // Output
    nodes.mixer.connect(audioContext.destination);
}
```

3. **Update Parameter Controls**
```javascript
function updateDelayTime(value) {
    const node = audioNodes.delay;
    if (!node) return;
    
    const now = audioContext.currentTime;
    node.delayTime.cancelScheduledValues(now);
    node.delayTime.setValueAtTime(node.delayTime.value, now);
    node.delayTime.linearRampToValueAtTime(value, now + 0.01);
}

function updateFeedback(value) {
    const node = audioNodes.feedback;
    if (!node) return;
    
    setGainWithRamp(node, value);
}
```

4. **Update Modulation**
```javascript
function setupModulation() {
    // Clear existing
    clearModulation();
    
    // Validate nodes
    if (!audioNodes.oscillator || !audioNodes.gain) return;
    
    // Create LFO
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    
    // Configure
    lfo.frequency.value = modSpeed;
    lfoGain.gain.value = 100; // Hz of deviation
    
    // Connect
    lfo.connect(lfoGain);
    lfoGain.connect(audioNodes.oscillator.frequency);
    
    // Start
    lfo.start();
    return { lfo, lfoGain };
}
```

## Testing

1. Test each effect in isolation:
   - Delay only
   - Reverb only
   - Modulation only

2. Test parameter changes:
   - Delay time
   - Feedback amount
   - Wet/dry mix
   - Modulation speed

3. Monitor signal flow:
   - Check node connections
   - Verify parameter changes
   - Watch gain levels

Will switch to Code mode to implement these fixes.