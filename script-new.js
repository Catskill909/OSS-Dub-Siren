// Debug logger
const DEBUG = true;
function log(message, type = 'info') {
    if (!DEBUG) return;
    const prefix = `[DubSiren ${type.toUpperCase()}]`;
    console.log(prefix, message);
}

// Audio system
let audioContext = null;
let oscillator = null;
let gainNode = null;
let delayNode = null;
let feedbackNode = null;
let convolverNode = null;
let dryGainNode = null;
let wetGainNode = null;
let mixerNode = null;
let currentPad = null;
let currentModulationInterval = null;

function initializeAudio() {
    try {
        log('Initializing audio system...');
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            log(`Created new audio context: ${audioContext.state}`);

            // Add resume handlers for user interaction
            ['mousedown', 'touchstart'].forEach(eventType => {
                document.addEventListener(eventType, () => {
                    if (audioContext.state === 'suspended') {
                        audioContext.resume()
                            .then(() => log('Audio context resumed on user interaction'))
                            .catch(err => log(`Error resuming context: ${err}`, 'error'));
                    }
                });
            });
        }
        return true;
    } catch (error) {
        log(`Failed to initialize audio: ${error}`, 'error');
        return false;
    }
}

function setupAudio() {
    try {
        log('Setting up audio system...');
        if (!initializeAudio()) return false;

        // Clean up existing oscillator if any
        if (oscillator) {
            log('Stopping existing oscillator...');
            oscillator.stop();
            oscillator = null;
        }

        // Create nodes
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        delayNode = audioContext.createDelay();
        feedbackNode = audioContext.createGain();
        convolverNode = audioContext.createConvolver();
        dryGainNode = audioContext.createGain();
        wetGainNode = audioContext.createGain();
        mixerNode = audioContext.createGain();

        log('Created audio nodes');

        // Set initial parameters
        const waveform = document.getElementById('waveform').value;
        const frequency = parseFloat(document.getElementById('frequencyKnob').dataset.value) || 440;
        const volume = parseFloat(document.getElementById('volumeKnob').dataset.value) || 0.5;

        // Configure nodes
        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        dryGainNode.gain.setValueAtTime(1, audioContext.currentTime);
        wetGainNode.gain.setValueAtTime(0, audioContext.currentTime);
        mixerNode.gain.setValueAtTime(1, audioContext.currentTime);
        feedbackNode.gain.setValueAtTime(0, audioContext.currentTime);

        log('Configured audio parameters:', { waveform, frequency, volume });

        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(dryGainNode);
        dryGainNode.connect(mixerNode);
        gainNode.connect(delayNode);
        delayNode.connect(feedbackNode);
        feedbackNode.connect(delayNode);
        delayNode.connect(mixerNode);
        mixerNode.connect(audioContext.destination);

        log('Connected audio chain');

        // Start oscillator
        oscillator.start();
        log('Oscillator started');

        return true;
    } catch (error) {
        log(`Error in setupAudio: ${error}`, 'error');
        return false;
    }
}

function stopSound() {
    log('Stopping sound...');
    const fadeTime = 0.05; // 50ms fade
    const now = audioContext.currentTime;

    // Fade out gains to avoid clicks
    if (gainNode) gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
    if (dryGainNode) dryGainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
    if (feedbackNode) feedbackNode.gain.linearRampToValueAtTime(0, now + fadeTime);

    // Stop oscillator after fade
    if (oscillator) {
        setTimeout(() => {
            try {
                oscillator.stop();
                oscillator = null;
                log('Oscillator stopped');
            } catch (error) {
                log(`Error stopping oscillator: ${error}`, 'warn');
            }
        }, fadeTime * 1000);
    }

    // Reset pad appearance
    if (currentPad) {
        const pad = document.getElementById(currentPad);
        if (pad) pad.style.backgroundColor = '#333';
        currentPad = null;
    }

    clearModulation();
}

function initializePad(padId, soundFunction) {
    const pad = document.getElementById(padId);
    if (!pad) {
        log(`Pad not found: ${padId}`, 'error');
        return;
    }

    log(`Initializing pad: ${padId}`);

    // Remove old listeners by cloning
    const newPad = pad.cloneNode(true);
    pad.parentNode.replaceChild(newPad, pad);

    let isTouch = false;

    function handleStart(e) {
        e.preventDefault();

        // Handle touch/mouse events
        if (e.type.includes('touch')) {
            isTouch = true;
        } else if (isTouch) {
            return;
        }

        log(`Pad ${padId} activated via ${e.type}`);

        // Stop current sound if any
        if (currentPad) {
            stopSound();
        }

        // Setup and start new sound
        if (setupAudio()) {
            try {
                soundFunction();
                currentPad = padId;
                newPad.style.backgroundColor = '#004400';
                log(`Sound started for pad ${padId}`);
            } catch (error) {
                log(`Error in sound function for pad ${padId}: ${error}`, 'error');
                stopSound();
            }
        }
    }

    function handleEnd(e) {
        e.preventDefault();
        if (e.type.includes('touch') !== isTouch) return;
        stopSound();
        isTouch = false;
    }

    // Add event listeners
    newPad.addEventListener('mousedown', handleStart);
    newPad.addEventListener('mouseup', handleEnd);
    newPad.addEventListener('mouseleave', handleEnd);
    newPad.addEventListener('touchstart', handleStart);
    newPad.addEventListener('touchend', handleEnd);
}

// Sound functions
function playHighSiren() {
    const now = audioContext.currentTime;
    oscillator.frequency.setValueAtTime(880, now);
    gainNode.gain.setValueAtTime(parseFloat(document.getElementById('volumeKnob').dataset.value) || 0.5, now);

    // Update UI
    const freqKnob = document.getElementById('frequencyKnob');
    if (freqKnob) {
        freqKnob.dataset.value = '880';
        updateKnobRotation(freqKnob, 880, 20, 2000);
    }
    document.getElementById('freqValue').textContent = '880 Hz';
}

function playLowSiren() {
    const now = audioContext.currentTime;
    oscillator.frequency.setValueAtTime(220, now);
    gainNode.gain.setValueAtTime(parseFloat(document.getElementById('volumeKnob').dataset.value) || 0.5, now);

    // Update UI
    const freqKnob = document.getElementById('frequencyKnob');
    if (freqKnob) {
        freqKnob.dataset.value = '220';
        updateKnobRotation(freqKnob, 220, 20, 2000);
    }
    document.getElementById('freqValue').textContent = '220 Hz';
}

function playFastMod() {
    const modSpeedKnob = document.getElementById('modSpeedKnob');
    if (modSpeedKnob) {
        modSpeedKnob.dataset.value = '5';
        updateKnobRotation(modSpeedKnob, 5, 0, 10);
    }
    document.getElementById('modSpeedValue').textContent = '5.0';
    setupModulation();
}

function playEchoDub() {
    const now = audioContext.currentTime;

    // Set delay parameters
    delayNode.delayTime.setValueAtTime(0.8, now);
    feedbackNode.gain.setValueAtTime(0.7, now);

    // Update UI
    const delayKnob = document.getElementById('delayTimeKnob');
    const feedbackKnob = document.getElementById('feedbackKnob');

    if (delayKnob) {
        delayKnob.dataset.value = '0.8';
        updateKnobRotation(delayKnob, 0.8, 0, 1);
    }
    if (feedbackKnob) {
        feedbackKnob.dataset.value = '0.7';
        updateKnobRotation(feedbackKnob, 0.7, 0, 0.9);
    }

    document.getElementById('delayTimeValue').textContent = '0.8s';
    document.getElementById('feedbackValue').textContent = '0.7';
}

// Modulation handling
function setupModulation() {
    if (currentModulationInterval) {
        clearInterval(currentModulationInterval);
    }

    const modSpeed = parseFloat(document.getElementById('modSpeedKnob').dataset.value) || 1;
    const baseFreq = parseFloat(document.getElementById('frequencyKnob').dataset.value) || 440;

    if (modSpeed > 0) {
        const now = audioContext.currentTime;
        oscillator.frequency.setValueAtTime(baseFreq, now);

        function modulateFrequency() {
            const now = audioContext.currentTime;
            oscillator.frequency.exponentialRampToValueAtTime(
                baseFreq * 2,
                now + (1 / (modSpeed * 2))
            );

            setTimeout(() => {
                oscillator.frequency.exponentialRampToValueAtTime(
                    baseFreq,
                    now + (1 / modSpeed)
                );
            }, (1000 / (modSpeed * 2)));
        }

        currentModulationInterval = setInterval(modulateFrequency, 1000 / modSpeed);
    }
}

function clearModulation() {
    if (currentModulationInterval) {
        clearInterval(currentModulationInterval);
        currentModulationInterval = null;
    }
}

// UI helpers
function updateKnobRotation(knob, value, min, max) {
    const rotation = ((value - min) / (max - min) * 270) - 135;
    knob.style.transform = `rotate(${rotation}deg)`;
}

// Initialize system
document.addEventListener('DOMContentLoaded', () => {
    log('Initializing dub siren system...');

    try {
        // Initialize audio system
        if (initializeAudio()) {
            log('Audio system initialized');

            // Initialize pads
            initializePad('pad1', playHighSiren);
            initializePad('pad2', playLowSiren);
            initializePad('pad3', playFastMod);
            initializePad('pad4', playEchoDub);

            // Set up waveform control
            const waveformSelect = document.getElementById('waveform');
            if (waveformSelect) {
                waveformSelect.addEventListener('change', (e) => {
                    if (oscillator) {
                        oscillator.type = e.target.value;
                        log(`Waveform changed to: ${e.target.value}`);
                    }
                });
            }

            setupKnobControls();
        }
    } catch (error) {
        log(`Error during system initialization: ${error}`, 'error');
    }
});

// Knob controls
function setupKnobControls() {
    setupKnob('frequency', 20, 2000);
    setupKnob('reverbAmount', 0, 1);
    setupKnob('roomSize', 0.1, 0.9);
    setupKnob('modSpeed', 0, 10);
    setupKnob('delayTime', 0, 1);
    setupKnob('feedback', 0, 0.9);
    setupKnob('volume', 0, 1);
}

function setupKnob(id, min, max) {
    const knob = document.getElementById(`${id}Knob`);
    const valueDisplay = document.getElementById(id === 'frequency' ? 'freqValue' : `${id}Value`);

    if (!knob || !valueDisplay) return;

    let isDragging = false;
    let startY, currentValue;

    function updateValue(newValue) {
        const clampedValue = Math.max(min, Math.min(max, newValue));
        knob.dataset.value = clampedValue.toString();
        updateDisplay(id, clampedValue);
        updateParameter(id, clampedValue);
        updateKnobRotation(knob, clampedValue, min, max);
    }

    knob.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        currentValue = parseFloat(knob.dataset.value);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
    });

    function handleMouseMove(e) {
        if (!isDragging) return;
        const deltaY = startY - e.clientY;
        const range = max - min;
        const newValue = currentValue + (deltaY / 100) * range;
        updateValue(newValue);
    }

    function handleMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
}

function updateDisplay(id, value) {
    const valueDisplay = document.getElementById(id === 'frequency' ? 'freqValue' : `${id}Value`);
    if (!valueDisplay) return;

    switch (id) {
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

function updateParameter(id, value) {
    if (!audioContext || !oscillator) return;

    const now = audioContext.currentTime;
    switch (id) {
        case 'frequency':
            oscillator.frequency.setValueAtTime(value, now);
            break;
        case 'delayTime':
            if (delayNode) delayNode.delayTime.setValueAtTime(value, now);
            break;
        case 'feedback':
            if (feedbackNode) feedbackNode.gain.setValueAtTime(value, now);
            break;
        case 'volume':
            if (gainNode) gainNode.gain.setValueAtTime(value, now);
            break;
        case 'reverbAmount':
            if (wetGainNode && dryGainNode) {
                wetGainNode.gain.setValueAtTime(value, now);
                dryGainNode.gain.setValueAtTime(1 - value, now);
            }
            break;
    }
}