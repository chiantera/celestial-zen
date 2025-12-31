export class ZenAudio {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.nextTickTime = 0;
        this.tempo = 120;
        this.lookahead = 25.0; // How frequently to call scheduler (ms)
        this.scheduleAheadTime = 0.1; // How far ahead to schedule audio (s)
        this.timerID = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    async toggle() {
        this.init();
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        this.isPlaying = true;
        this.nextTickTime = this.ctx.currentTime;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
    }

    scheduler() {
        while (this.nextTickTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleBeat(this.nextTickTime);
            this.nextTickTime += 60.0 / this.tempo; // Simply play on every beat
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }

    scheduleBeat(time) {
        // Kick
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.5);

        // Subtle Hi-hat-like noise for texture
        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.05, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(time);
    }
}
