"use client";

export function playTone(type: 'start' | 'stop') {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    let duration;

    if (type === 'start') {
      oscillator.frequency.value = 880; // A5 note
      // Increased gain for more volume
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      // Increased duration
      duration = 0.25;
    } else { // 'stop'
      oscillator.frequency.value = 523.25; // C5 note
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
      duration = 0.15;
    }

    oscillator.type = 'sine';
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
    
    // Adjust timeout to ensure tone plays fully before context is closed
    setTimeout(() => {
        if (audioContext.state !== 'closed') {
            audioContext.close();
        }
    }, duration * 1000 + 50);

  } catch (error) {
    console.error("Failed to play tone:", error);
  }
}
