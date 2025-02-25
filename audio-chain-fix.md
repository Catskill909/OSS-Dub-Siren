# Audio Chain Fix Plan

## Current Issues
1. Audio nodes disconnect properly but no sound output
2. State transitions working but audio chain ineffective
3. Gain node values might not be set correctly

## Analysis

### Audio Chain Flow
```
Oscillator -> Gain -> [DryGain, Convolver]
                          |        |
                          |     WetGain
                          |        |
                          |     Delay
                          |        |
                          +-> Destination
```

### Potential Problems
1. **Missing Connections**
   - DryGain might not be reaching destination
   - Connection order affecting signal flow

2. **Gain Values**
   - Initial gain might be 0 and not ramping up
   - Wet/dry balance might be incorrect
   - Volume transitions might be too short

3. **Timing Issues**
   - Node connections might happen before oscillator start
   - State transitions might be too quick
   - Cleanup might happen before audio can play

## Fix Plan

1. **Update Audio Chain Setup**
```javascript
// In setupAudio()
// 1. Create nodes with error checking
audioNodes.oscillator = audioContext.createOscillator();
audioNodes.gain = audioContext.createGain();
audioNodes.dryGain = audioContext.createGain();
audioNodes.wetGain = audioContext.createGain();
audioNodes.delay = audioContext.createDelay();
audioNodes.feedback = audioContext.createGain();
audioNodes.convolver = audioContext.createConvolver();

// 2. Set initial gains explicitly
audioNodes.gain.gain.setValueAtTime(0, audioContext.currentTime);
audioNodes.dryGain.gain.setValueAtTime(1, audioContext.currentTime);
audioNodes.wetGain.gain.setValueAtTime(0, audioContext.currentTime);

// 3. Connect nodes in correct order
oscillator -> gain
gain -> dryGain -> destination
gain -> convolver -> wetGain -> destination
[dryGain, wetGain] -> delay -> feedback -> delay -> destination
```

2. **Improve State Transitions**
```javascript
async function startSound() {
    const now = audioContext.currentTime;
    const fadeTime = 0.01; // 10ms fade

    // Start with gain at 0
    audioNodes.gain.gain.setValueAtTime(0, now);
    
    // Start oscillator
    audioNodes.oscillator.start(now);
    
    // Fade in gain
    audioNodes.gain.gain.linearRampToValueAtTime(
        volume,
        now + fadeTime
    );

    updateState(AudioState.PLAYING);
}
```

3. **Add Debug Logging**
```javascript
function logAudioChain() {
    log('Audio chain state:', {
        gainValue: audioNodes.gain?.gain.value,
        dryGainValue: audioNodes.dryGain?.gain.value,
        wetGainValue: audioNodes.wetGain?.gain.value,
        oscType: audioNodes.oscillator?.type,
        oscFreq: audioNodes.oscillator?.frequency.value,
        delayTime: audioNodes.delay?.delayTime.value,
        contextState: audioContext?.state
    });
}
```

## Testing Steps

1. Check audio context state
2. Verify node connections
3. Monitor gain values
4. Test with simpler chain first
5. Add nodes incrementally
6. Test state transitions
7. Verify cleanup timing

Will switch to Code mode to implement these fixes.