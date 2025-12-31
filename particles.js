import * as THREE from 'https://esm.sh/three@0.172.0';

export class ZenParticles {
    constructor(scene, count = 50000) {
        this.scene = scene;
        this.count = count;
        this.init();
    }

    createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2;

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    init() {
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.count * 3);
        this.colors = new Float32Array(this.count * 3);
        this.velocities = new Float32Array(this.count * 3);
        this.sizes = new Float32Array(this.count);

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            // Random sphere distribution
            const r = Math.pow(Math.random(), 0.5) * 15; // Slightly larger radius for 50k stars
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            this.positions[i3] = r * Math.sin(phi) * Math.cos(theta);
            this.positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            this.positions[i3 + 2] = r * Math.cos(phi);

            // Initial velocities
            this.velocities[i3] = (Math.random() - 0.5) * 0.01;
            this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
            this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;

            // Sizes
            this.sizes[i] = Math.random() * 2;

            // Colors (Cool blue/teal palette)
            this.colors[i3] = 0.3;
            this.colors[i3 + 1] = 0.7;
            this.colors[i3 + 2] = 1.0;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: this.createCircleTexture(),
            alphaTest: 0.01
        });

        this.points = new THREE.Points(this.geometry, material);
        this.scene.add(this.points);
    }

    update(time, speed, mouse) {
        const positions = this.geometry.attributes.position.array;
        const sizes = this.geometry.attributes.size.array;

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;

            // Subtle drift
            positions[i3] += this.velocities[i3] * speed;
            positions[i3 + 1] += this.velocities[i3 + 1] * speed;
            positions[i3 + 2] += this.velocities[i3 + 2] * speed;

            // Near-field Fading (Hide stars too close to camera at Z=15)
            // Camera is at Z=15, particles are in a sphere around origin.
            // If posZ > 12, they start to get too big. 
            const distToCam = 15 - positions[i3 + 2];
            if (distToCam < 3) {
                sizes[i] = 0; // Hide them
            } else {
                // Restore size if they are far enough
                // We'll just keep their original random size but cap it
                sizes[i] = Math.min(distToCam * 0.2, 2.0);
            }

            // Mouse interaction (repulsion)
            const dx = positions[i3] - mouse.x * 10;
            const dy = positions[i3 + 1] - mouse.y * 10;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 3) {
                const force = (3 - dist) / 30;
                positions[i3] += dx * force;
                positions[i3 + 1] += dy * force;
            }

            // Boundary check (keep within 15 units radius)
            const r = Math.sqrt(positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2);
            if (r > 15) {
                positions[i3] *= 0.95;
                positions[i3 + 1] *= 0.95;
                positions[i3 + 2] *= 0.95;
            }
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
    }

    setHue(hue) {
        const colors = this.geometry.attributes.color.array;
        const color = new THREE.Color(`hsl(${hue}, 70%, 60%)`);
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        this.geometry.attributes.color.needsUpdate = true;
    }
}
