import * as THREE from 'https://esm.sh/three@0.172.0';
import gsap from 'https://esm.sh/gsap@3.12.5';
import { ZenParticles } from './particles.js';

import { ZenAudio } from './audio.js';

class ZenApp {
    constructor() {
        this.canvas = document.getElementById('zen-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });

        this.mouse = new THREE.Vector2();
        this.targetMouse = new THREE.Vector2();
        this.time = 0;
        this.flowSpeed = 1.0;

        // Audio
        this.audio = new ZenAudio();

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.camera.position.z = 15;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Particle System
        this.particles = new ZenParticles(this.scene);

        // GUI Interactions
        this.setupEventListeners();

        // Start Loop
        this.animate();

        // Intro Animation
        gsap.from('.ui-overlay header, .ui-overlay .controls, .ui-overlay footer', {
            opacity: 0,
            y: 30,
            duration: 1.5,
            stagger: 0.3,
            ease: 'power3.out'
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.flowSpeed = parseFloat(e.target.value);
        });

        document.getElementById('hue-slider').addEventListener('input', (e) => {
            this.particles.setHue(e.target.value);
        });

        document.getElementById('beat-toggle').addEventListener('click', (e) => {
            this.audio.toggle();
            e.target.textContent = this.audio.isPlaying ? 'Mute Harmony Beat' : 'Enable Harmony Beat';
            e.target.classList.toggle('active', this.audio.isPlaying);
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            gsap.to(this.camera.position, { z: 15, duration: 2, ease: 'expo.inOut' });
            gsap.to(this.particles.points.rotation, { x: 0, y: 0, z: 0, duration: 2, ease: 'expo.inOut' });
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.time += 0.01 * this.flowSpeed;

        // Smooth mouse movement
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        this.particles.update(this.time, this.flowSpeed, this.mouse);

        this.particles.points.rotation.y += 0.002 * this.flowSpeed;
        this.particles.points.rotation.x += 0.001 * this.flowSpeed;

        this.renderer.render(this.scene, this.camera);
    }
}

new ZenApp();
