# Knob Rotation Issues and Failed Attempts

## Initial Implementation Issues

### 1. Basic Rotation Logic Failure
```javascript
// Failed attempt: Direct degree-based rotation
knob.style.transform = `rotate(${value * 360}deg)`;
// Problem: Resulted in wild spinning and incorrect value mapping
```

### 2. Linear Value Mapping Issue
```javascript
const rotation = value * 270; // Failed linear mapping
// Problem: Didn't account for min/max range, caused incorrect rotation angles
```

### 3. Event Handling Problems
```javascript
// Failed mouse movement calculation
const deltaY = e.clientY - startY;
// Problem: Inverted movement, knob moved opposite to mouse direction
```

## Value Update Issues

### 1. Direct Value Assignment
```javascript
input.value = newValue;
// Problem: No clamping, allowed values outside min/max range
```

### 2. Event Dispatch Failure
```javascript
// Failed to trigger value updates
input.dispatchEvent(new Event('change'));
// Problem: Should have used 'input' event instead of 'change'
```

## UI Update Problems

### 1. Value Display Sync Issues
```javascript
// Incorrect value display update
valueDisplay.textContent = value;
// Problem: Didn't format values properly (Hz, seconds, etc)
```

### 2. Rotation Range Problems
```javascript
// Incorrect rotation range
const rotation = (value / max) * 360;
// Problem: Full 360-degree rotation made it hard to control
```

## Audio Parameter Update Failures

### 1. Timing Issues
```javascript
// Direct parameter updates without proper timing
oscillator.frequency.value = clampedValue;
// Problem: Should have used setValueAtTime with audioContext.currentTime
```

### 2. Node Connection Problems
```javascript
// Incorrect gain node updates
gainNode.gain = clampedValue;
// Problem: Should have used gainNode.gain.setValueAtTime()
```

## Mouse Event Handling Issues

### 1. Drag Detection Problems
```javascript
// Failed drag detection
let isDragging = e.buttons === 1;
// Problem: Didn't properly track mouse down/up states
```

### 2. Event Cleanup Failures
```javascript
// Incomplete event listener cleanup
document.removeEventListener('mousemove', handleMouseMove);
// Problem: Didn't remove mouseup listener, caused memory leaks
```

## Lessons Learned

1. Always implement proper value clamping
2. Use appropriate event types ('input' vs 'change')
3. Properly clean up event listeners
4. Use proper audio parameter timing methods
5. Implement correct rotation angle calculations
6. Maintain proper state tracking for drag operations
7. Format display values appropriately for each parameter type
8. Use proper audio node parameter update methods


FILES WHERE KNOB ROTATION WORKED:

let audioContext = null;
let oscillator = null;
let gainNode = null;
let delayNode = null;
let feedbackNode = null;
let isPlaying = false;
let currentPad = null;

function initializeAudio() {
    try {
        console.log('Initializing audio...');
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Created new audio context:', audioContext.state);
        }
        return true;
    } catch (error) {
        console.error('Failed to initialize audio:', error);
        return false;
    }
}

function setupAudio() {
    try {
        if (!initializeAudio()) return false;

        console.log('Setting up audio nodes...');
        
        // Clean up existing oscillator if any
        if (oscillator) {
            console.log('Stopping existing oscillator...');
            oscillator.stop();
            oscillator = null;
        }

        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        delayNode = audioContext.createDelay();
        feedbackNode = audioContext.createGain();

        // Set initial values from UI controls
        const waveform = document.getElementById('waveform').value;
        const frequency = parseFloat(document.getElementById('frequency').value) || 440;
        const volume = parseFloat(document.getElementById('volume').value) || 0.5;
        const delayTime = parseFloat(document.getElementById('delayTime').value) || 0;
        const feedback = parseFloat(document.getElementById('feedback').value) || 0;

        console.log('Configuring audio parameters:', {
            waveform, frequency, volume, delayTime, feedback
        });

        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        delayNode.delayTime.setValueAtTime(delayTime, audioContext.currentTime);
        feedbackNode.gain.setValueAtTime(feedback, audioContext.currentTime);

        // Connect audio nodes
        console.log('Connecting audio nodes...');
        oscillator.connect(gainNode);
        gainNode.connect(delayNode);
        delayNode.connect(feedbackNode);
        feedbackNode.connect(delayNode);
        gainNode.connect(audioContext.destination);
        delayNode.connect(audioContext.destination);

        oscillator.start();
        console.log('Audio setup complete - Oscillator started');
        return true;
    } catch (error) {
        console.error('Error in setupAudio:', error);
        return false;
    }
}

function playSound(frequency, padId) {
    try {
        console.log(`Playing sound: frequency=${frequency}, padId=${padId}`);
        
        if (currentPad) {
            document.getElementById(currentPad).style.backgroundColor = '#333';
        }

        if (!setupAudio()) {
            console.error('Failed to setup audio');
            return;
        }

        const now = audioContext.currentTime;
        oscillator.frequency.setValueAtTime(frequency, now);
        gainNode.gain.setValueAtTime(document.getElementById('volume').value, now);
        
        document.getElementById('frequency').value = frequency;
        document.getElementById('freqValue').textContent = frequency + ' Hz';
        
        currentPad = padId;
        document.getElementById(padId).style.backgroundColor = '#004400';
        isPlaying = true;

        console.log('Sound playing successfully');
    } catch (error) {
        console.error('Error in playSound:', error);
    }
}

// Simplified pad click handlers
document.getElementById('pad1').addEventListener('click', () => playSound(880, 'pad1'));
document.getElementById('pad2').addEventListener('click', () => playSound(220, 'pad2'));
document.getElementById('pad3').addEventListener('click', () => {
    playSound(440, 'pad3');
    document.getElementById('modSpeed').value = 5;
    document.getElementById('modSpeedValue').textContent = '5.0';
    setupModulation();
});
document.getElementById('pad4').addEventListener('click', () => {
    playSound(440, 'pad4');
    const now = audioContext.currentTime;
    document.getElementById('delayTime').value = 0.8;
    document.getElementById('feedback').value = 0.7;
    document.getElementById('delayTimeValue').textContent = '0.8s';
    document.getElementById('feedbackValue').textContent = '0.7';
    delayNode.delayTime.setValueAtTime(0.8, now);
    feedbackNode.gain.setValueAtTime(0.7, now);
});

function initAudioAndPlayHighSiren() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('New audio context created:', audioContext.state);
            
            audioContext.resume().then(() => {
                console.log('Audio context resumed:', audioContext.state);
                setupAudio();
                playHighSiren();
            }).catch(err => {
                console.error('Error resuming audio context:', err);
            });
        } else {
            setupAudio();
            playHighSiren();
        }
    } catch (err) {
        console.error('Error creating new audio context:', err);
    }
}

function initAudioAndPlayLowSiren() {
    initializeNewAudioContext('pad2', playLowSiren);
}

function initAudioAndPlayFastMod() {
    initializeNewAudioContext('pad3', playFastMod);
}

function initAudioAndPlayEchoDub() {
    initializeNewAudioContext('pad4', playEchoDub);
}

function initializeNewAudioContext(padId, soundFunction) {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('New audio context created:', audioContext.state);
        
        audioContext.resume().then(() => {
            console.log('Audio context resumed:', audioContext.state);
            setupAudio();
            soundFunction();
            currentPad = padId;
            document.getElementById(padId).style.backgroundColor = '#004400';
            isPlaying = true;
        }).catch(err => {
            console.error('Error resuming audio context:', err);
        });
    } catch (err) {
        console.error('Error creating new audio context:', err);
    }
}

function stopSound() {
    if (oscillator) {
        oscillator.stop();
        oscillator = null;
    }
    if (currentPad) {
        document.getElementById(currentPad).style.backgroundColor = '#333';
        currentPad = null;
    }
    isPlaying = false;
}

function initializePad(padId, soundFunction) {
    const pad = document.getElementById(padId);
    pad.addEventListener('mousedown', () => {
        if (audioContext) {
            audioContext.resume().then(() => {
                setupAudio();
                soundFunction();
                currentPad = padId;
                document.getElementById(padId).style.backgroundColor = '#004400';
                isPlaying = true;
            });
        } else {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.resume().then(() => {
                setupAudio();
                soundFunction();
                currentPad = padId;
                document.getElementById(padId).style.backgroundColor = '#004400';
                isPlaying = true;
            });
        }
    });

    pad.addEventListener('mouseup', stopSound);
    pad.addEventListener('mouseleave', stopSound);
}

// Initialize all pads
initializePad('pad1', playHighSiren);
initializePad('pad2', playLowSiren);
initializePad('pad3', playFastMod);
initializePad('pad4', playEchoDub);

// Remove old event listeners
document.getElementById('pad1').removeEventListener('click', initAudioAndPlayHighSiren);
document.getElementById('pad2').removeEventListener('click', initAudioAndPlayLowSiren);
document.getElementById('pad3').removeEventListener('click', initAudioAndPlayFastMod);
document.getElementById('pad4').removeEventListener('click', initAudioAndPlayEchoDub);

function setupAudio() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context created:', audioContext.state);
        }

    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();
    delayNode = audioContext.createDelay();
    feedbackNode = audioContext.createGain();

    // Set initial values from UI controls
    const waveform = document.getElementById('waveform').value;
    const frequency = parseFloat(document.getElementById('frequency').value) || 440;
    const volume = parseFloat(document.getElementById('volume').value) || 0.5;
    const delayTime = parseFloat(document.getElementById('delayTime').value) || 0;
    const feedback = parseFloat(document.getElementById('feedback').value) || 0;

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    delayNode.delayTime.setValueAtTime(delayTime, audioContext.currentTime);
    feedbackNode.gain.setValueAtTime(feedback, audioContext.currentTime);

    // Connect audio nodes
    oscillator.connect(gainNode);
    gainNode.connect(delayNode);
    delayNode.connect(feedbackNode);
    feedbackNode.connect(delayNode);
    gainNode.connect(audioContext.destination);
    delayNode.connect(audioContext.destination);

    oscillator.start();
    setupKnobControls();
    console.log('Audio setup complete - Oscillator started');
    } catch (error) {
        console.error('Error in setupAudio:', error);
    }
}

function setupKnobControls() {
    setupKnob('frequency', 20, 2000);
    setupKnob('modSpeed', 0, 10);
    setupKnob('delayTime', 0, 1);
    setupKnob('feedback', 0, 0.9);
    setupKnob('volume', 0, 1);
}

function setupKnob(id, min, max) {
    const knob = document.getElementById(`${id}Knob`);
    const input = document.getElementById(id);
    let isDragging = false;
    let startY;
    let startValue;

    knob.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startValue = parseFloat(input.value);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
        });
    });

    function handleMouseMove(e) {
        if (!isDragging) return;
        const deltaY = startY - e.clientY;
        const range = max - min;
        const newValue = startValue + (deltaY / 100) * range;
        const clampedValue = Math.max(min, Math.min(max, newValue));
        input.value = clampedValue;
        input.dispatchEvent(new Event('input'));
        knob.style.transform = `rotate(${(clampedValue - min) / (max - min) * 270 - 135}deg)`;
    }
}

function playHighSiren() {
    const now = audioContext.currentTime;
    oscillator.frequency.setValueAtTime(880, now);
    gainNode.gain.setValueAtTime(document.getElementById('volume').value, now);
    document.getElementById('frequency').value = 880;
    document.getElementById('freqValue').textContent = '880 Hz';
}

function playLowSiren() {
    const now = audioContext.currentTime;
    oscillator.frequency.setValueAtTime(220, now);
    gainNode.gain.setValueAtTime(document.getElementById('volume').value, now);
    document.getElementById('frequency').value = 220;
    document.getElementById('freqValue').textContent = '220 Hz';
}

function playFastMod() {
    const now = audioContext.currentTime;
    document.getElementById('modSpeed').value = 5;
    document.getElementById('modSpeedValue').textContent = '5.0';
    setupModulation();
}

function playEchoDub() {
    const now = audioContext.currentTime;
    document.getElementById('delayTime').value = 0.8;
    document.getElementById('feedback').value = 0.7;
    document.getElementById('delayTimeValue').textContent = '0.8s';
    document.getElementById('feedbackValue').textContent = '0.7';
    delayNode.delayTime.setValueAtTime(0.8, now);
    feedbackNode.gain.setValueAtTime(0.7, now);
}

function setupModulation() {
    const modSpeed = document.getElementById('modSpeed').value;
    const baseFreq = parseFloat(document.getElementById('frequency').value);
    
    const now = audioContext.currentTime;
    oscillator.frequency.setValueAtTime(baseFreq, now);
    
    function modulateFrequency() {
        const now = audioContext.currentTime;
        const speed = parseFloat(document.getElementById('modSpeed').value);
        const freq = parseFloat(document.getElementById('frequency').value);
        
        oscillator.frequency.exponentialRampToValueAtTime(
            freq * 2,
            now + (1 / (speed * 2))
        );
        
        setTimeout(() => {
            oscillator.frequency.exponentialRampToValueAtTime(
                freq,
                now + (1 / speed)
            );
        }, (1000 / (speed * 2)));
    }

    if (modSpeed > 0) {
        setInterval(modulateFrequency, 1000 / modSpeed);
    }
}

// Update parameter values
document.getElementById('waveform').addEventListener('change', (e) => {
    if (oscillator) oscillator.type = e.target.value;
});

document.getElementById('frequency').addEventListener('input', (e) => {
    document.getElementById('freqValue').textContent = e.target.value + ' Hz';
    if (oscillator) oscillator.frequency.setValueAtTime(e.target.value, audioContext.currentTime);
});

document.getElementById('modSpeed').addEventListener('input', (e) => {
    document.getElementById('modSpeedValue').textContent = e.target.value;
});

document.getElementById('delayTime').addEventListener('input', (e) => {
    document.getElementById('delayTimeValue').textContent = e.target.value + 's';
    if (delayNode) delayNode.delayTime.setValueAtTime(e.target.value, audioContext.currentTime);
});

document.getElementById('feedback').addEventListener('input', (e) => {
    document.getElementById('feedbackValue').textContent = e.target.value;
    if (feedbackNode) feedbackNode.gain.setValueAtTime(e.target.value, audioContext.currentTime);
});

document.getElementById('volume').addEventListener('input', (e) => {
    document.getElementById('volumeValue').textContent = e.target.value;
    if (gainNode && isPlaying) gainNode.gain.setValueAtTime(e.target.value, audioContext.currentTime);
});

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Dub Siren</title>
    <style>
        body {
            background: #1a1a1a;
            color: #fff;
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .dub-siren {
            background: linear-gradient(145deg, #2a2a2a, #333);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
            width: 90%;
            max-width: 800px;
            border: 2px solid #444;
        }

        .device-header {
            text-align: center;
            background: #000;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #00ff00;
        }

        h1 {
            font-family: 'Courier New', monospace;
            color: #00ff00;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin: 0;
            text-shadow: 0 0 10px rgba(0,255,0,0.5);
        }

        .controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }

        .control-group {
            background: #222;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #444;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
        }

        .knob-container {
            text-align: center;
            margin-bottom: 25px;
        }

        .knob {
            width: 80px;
            height: 80px;
            background: linear-gradient(145deg, #333, #222);
            border-radius: 50%;
            position: relative;
            margin: 0 auto 10px;
            border: 2px solid #444;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            cursor: pointer;
        }

        .knob::after {
            content: '';
            position: absolute;
            width: 4px;
            height: 40%;
            background: #00ff00;
            top: 10%;
            left: 50%;
            transform-origin: bottom;
            transform: translateX(-50%);
        }

        .knob-label {
            color: #00ff00;
            font-size: 0.9em;
            margin-top: 5px;
        }

        .knob-value {
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 0.8em;
            background: #000;
            padding: 2px 8px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 5px;
        }

        .pads-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 20px;
        }

        .pad {
            background: linear-gradient(145deg, #333, #222);
            border: 2px solid #444;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.1s;
            box-shadow: 0 4px 0 #111;
        }

        .pad:active {
            transform: translateY(4px);
            box-shadow: none;
        }

        .pad-label {
            color: #00ff00;
            font-size: 0.9em;
            margin-top: 10px;
        }

        select {
            width: 100%;
            padding: 8px;
            background: #333;
            color: #00ff00;
            border: 1px solid #00ff00;
            border-radius: 4px;
            margin-bottom: 20px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="dub-siren">
        <div class="device-header">
            <h1>Digital Dub Siren</h1>
        </div>
        <div class="controls">
            <div class="control-group">
                <select id="waveform">
                    <option value="sine">Sine Wave</option>
                    <option value="square">Square Wave</option>
                    <option value="sawtooth">Sawtooth Wave</option>
                    <option value="triangle">Triangle Wave</option>
                </select>

                <div class="knob-container">
                    <div class="knob" id="frequencyKnob"></div>
                    <div class="knob-label">Frequency</div>
                    <div class="knob-value" id="freqValue">440 Hz</div>
                    <input type="range" id="frequency" min="20" max="2000" value="440" style="display: none;">
                </div>

                <div class="knob-container">
                    <div class="knob" id="modSpeedKnob"></div>
                    <div class="knob-label">Mod Speed</div>
                    <div class="knob-value" id="modSpeedValue">1.0</div>
                    <input type="range" id="modSpeed" min="0" max="10" step="0.1" value="1" style="display: none;">
                </div>
            </div>

            <div class="control-group">
                <div class="knob-container">
                    <div class="knob" id="delayTimeKnob"></div>
                    <div class="knob-label">Delay Time</div>
                    <div class="knob-value" id="delayTimeValue">0.5s</div>
                    <input type="range" id="delayTime" min="0" max="1" step="0.01" value="0.5" style="display: none;">
                </div>

                <div class="knob-container">
                    <div class="knob" id="feedbackKnob"></div>
                    <div class="knob-label">Feedback</div>
                    <div class="knob-value" id="feedbackValue">0.3</div>
                    <input type="range" id="feedback" min="0" max="0.9" step="0.1" value="0.3" style="display: none;">
                </div>

                <div class="knob-container">
                    <div class="knob" id="volumeKnob"></div>
                    <div class="knob-label">Volume</div>
                    <div class="knob-value" id="volumeValue">0.5</div>
                    <input type="range" id="volume" min="0" max="1" step="0.01" value="0.5" style="display: none;">
                </div>
            </div>
        </div>

        <div class="pads-container">
            <div class="pad" id="pad1">
                <div class="pad-label">High Siren</div>
            </div>
            <div class="pad" id="pad2">
                <div class="pad-label">Low Siren</div>
            </div>
            <div class="pad" id="pad3">
                <div class="pad-label">Fast Mod</div>
            </div>
            <div class="pad" id="pad4">
                <div class="pad-label">Echo Dub</div>
            </div>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>