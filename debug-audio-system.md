# Dub Siren Audio System Debug Plan

## Issue
No audio plays when tapping/clicking pads, though state transitions and cleanup are working correctly.

## Investigation Steps

### 1. Audio Context Initialization
- Add explicit check for `audioContext.state` after creation
- Add user gesture handling to ensure proper context resuming
- Add logging for context state transitions

```javascript
// Add to initializeAudio():
log(`Initial audio context state: ${audioContext.state}`);
document.addEventListener('click', async () => {
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
        log(`Audio context resumed, new state: ${audioContext.state}`);
    }
}, { once: true });
```

### 2. Gain Chain Verification
- Add logging at critical gain setting points
- Verify gain values through audio chain
- Add gain monitoring during playback

```javascript
// Add to setupAudio():
function verifyGainChain() {
    log('Verifying gain chain values:', {
        mainGain: audioNodes.gain?.gain.value,
        dryGain: audioNodes.dryGain?.gain.value,
        wetGain: audioNodes.wetGain?.gain.value,
        mixerGain: audioNodes.mixer?.gain.value
    });
}

// Call after gain setup and before playing
verifyGainChain();
```

### 3. Node Connection Testing
- Add connectivity tests between nodes
- Verify signal flow through the chain
- Add buffer state verification

```javascript
// Add to verifyAudioSetup():
function testNodeConnections() {
    const nodes = ['oscillator', 'gain', 'delay', 'feedback', 'mixer'];
    nodes.forEach(nodeName => {
        const node = audioNodes[nodeName];
        if (node) {
            log(`${nodeName} connection status:`, {
                hasInput: node.numberOfInputs > 0,
                hasOutput: node.numberOfOutputs > 0
            });
        }
    });
}
```

### 4. State Transition Verification
- Add state change validation
- Verify cleanup completion
- Add transition timing logs

```javascript
// Add to updateState():
const stateChangeStart = Date.now();
log(`State change initiated: ${currentState} -> ${newState}`);
// After state change
log(`State change completed in ${Date.now() - stateChangeStart}ms`);
```

## Implementation Plan

1. Apply the above debugging code.
2. Test pad activation with monitoring enabled.
3. Analyze logs for:
   - Audio context state transitions
   - Gain values through the chain
   - Node connection status
   - State change timing
   - Cleanup verification

## Expected Results
- Complete log trail of audio system initialization
- Verification of gain values at each stage
- Confirmation of node connections
- Detailed state transition timing

## Success Criteria
- Clear identification of where the audio chain is breaking down
- Verification that all nodes are properly connected
- Confirmation that gains are set to appropriate values
- Validation that the audio context is active

## Next Steps
1. Implement the debugging instrumentation
2. Test each pad with monitoring enabled
3. Analyze logs for any irregularities
4. Based on findings, create targeted fixes

After implementing this debugging plan, we should have enough information to identify exactly where the audio chain is failing and implement appropriate fixes.