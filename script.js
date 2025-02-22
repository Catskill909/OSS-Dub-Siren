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