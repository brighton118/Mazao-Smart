// Browser Web Audio synthesizer service for soft, alerts/alarms
class NotificationService {
    private ctx: AudioContext | null = null;

    private initCtx() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        // Resume context if suspended (browser security autoplays)
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch((err) => console.warn('AudioContext failed to resume', err));
        }
    }

    // Soft high-pitched notification chime (ping!)
    playNotification() {
        try {
            this.initCtx();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            // Nice sine chime
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now); // A5 note
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6 note

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35); // fade out over 350ms

            osc.start(now);
            osc.stop(now + 0.4);
        } catch (e) {
            console.warn('Failed to play notification audio chime', e);
        }
    }

    // Dual-tone urgent alert siren (warning alert)
    playAlarm() {
        try {
            this.initCtx();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            // Triangle wave is softer than square but louder than sine
            osc.type = 'triangle';

            // Dual tone alternation sweep (siren effect)
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.15);
            osc.frequency.linearRampToValueAtTime(500, now + 0.3);
            osc.frequency.linearRampToValueAtTime(800, now + 0.45);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6); // fade out of warning

            osc.start(now);
            osc.stop(now + 0.65);
        } catch (e) {
            console.warn('Failed to play alarm audio chime', e);
        }
    }
}

export const notificationService = new NotificationService();
