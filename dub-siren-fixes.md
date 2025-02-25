# Dub Siren Audio System Fixes

## Current Issues

1. **Audio Persistence**
   - Sound continues after pad release
   - Incomplete cleanup of audio nodes
   - Multiple audio contexts/setups possible

2. **Event Handler Conflicts**
   - Duplicate click and mouse event handlers
   - Inconsistent event cleanup
   - Race conditions between handlers

3. **State Management**
   - Unreliable playing state tracking
   - Modulation persistence issues
   - Incomplete pad state reset

## Fix Plan

### 1. Consolidate Audio Setup (Priority: High)
- Remove duplicate setupAudio() function
- Create single source of truth for audio initialization
- Implement proper AudioContext lifecycle management
- Add suspended state handling

### 2. Fix Event Handler Architecture (Priority: High)
- Remove conflicting click handlers
- Standardize on mousedown/mouseup pattern
- Implement proper event cleanup
- Add touch event support for mobile

### 3. Improve Audio Cleanup (Priority: High)
- Sequence node disconnection properly
- Clear modulation before stopping sound
- Implement fade-out before cleanup
- Reset pad states reliably

### 4. Add Error Recovery (Priority: Medium)
- Add recoverable error states
- Implement auto-recovery for audio context
- Add user feedback for audio issues
- Improve error logging

### 5. Better State Management (Priority: Medium)
- Create AudioManager class to handle state
- Add proper state transitions
- Implement proper cleanup on state changes
- Add debug logging for state changes

## Implementation Steps

1. **Audio Engine Refactor**
```javascript
class AudioEngine {
    constructor() {
        this.context = null;
        this.nodes = new Map();
        this.isPlaying = false;
    }

    // Single entry point for audio setup
    async setup() {
        if (this.context?.state === 'suspended') {
            await this.context.resume();
        }
        // ...setup logic
    }

    // Proper cleanup sequence
    cleanup() {
        this.stopModulation();
        this.fadeOutAndStop();
        this.disconnectNodes();
    }
}
```

2. **Event Handler Cleanup**
```javascript
function initializePad(pad, soundFunction) {
    // Remove old handlers first
    pad.replaceWith(pad.cloneNode(true));
    const newPad = document.getElementById(pad.id);
    
    // Add unified handlers
    newPad.addEventListener('mousedown', startSound);
    newPad.addEventListener('mouseup', stopSound);
    newPad.addEventListener('mouseleave', stopSound);
}
```

3. **State Management**
```javascript
const AudioState = {
    INACTIVE: 'inactive',
    STARTING: 'starting',
    PLAYING: 'playing',
    STOPPING: 'stopping'
};

function updateState(newState) {
    if (validStateTransition(currentState, newState)) {
        currentState = newState;
        executeStateChange(newState);
    }
}
```

## Testing Plan

1. **Basic Functionality**
   - Pad press/release behavior
   - Audio start/stop timing
   - State transitions

2. **Error Cases**
   - Context suspension
   - Invalid state transitions
   - Resource cleanup

3. **Edge Cases**
   - Rapid pad switching
   - Multiple pad presses
   - Browser tab switching

## Implementation Schedule

1. Day 1: Audio Engine Refactor
2. Day 2: Event Handler Cleanup
3. Day 3: State Management
4. Day 4: Testing & Bug Fixes
5. Day 5: Documentation & Polish