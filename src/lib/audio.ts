"use client";

export function playTone(type: 'start' | 'stop') {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'start') {
      oscillator.frequency.value = 880; // A5 note
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    } else { // 'stop'
      oscillator.frequency.value = 523.25; // C5 note
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    }

    oscillator.type = 'sine';
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
    
    setTimeout(() => {
        if (audioContext.state !== 'closed') {
            audioContext.close();
        }
    }, 200);

  } catch (error) {
    console.error("Failed to play tone:", error);
  }
}
