export function playBeep() {
  try {
    // Check if AudioContext is supported
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio beep failed", e);
  }
}

export function notifyRestComplete() {
  playBeep();
  
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 500]);
  }
  
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Tempo de Descanso Concluído!', {
        body: 'Sua próxima série está te esperando. Vamos lá!',
        icon: '/favicon.ico', // fallback
        vibrate: [200, 100, 200, 100, 500],
        requireInteraction: true
      } as any);
    } catch (e) {
      console.error("Notification failed", e);
    }
  }
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
