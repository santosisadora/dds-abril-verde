/**
 * src/components/ar-hologram-fx.js
 * A-Frame Components dedicados para:
 * - holo-scanline: Linha de varredura biométrica subindo e descendo no eixo Y
 * - holo-glow-pulse: Pulsação de energia holográfica no contorno/fundo
 * - dds-target-listener: Gerencia eventos targetFound / targetLost, métricas e áudio guiado
 */

import { Analytics } from './analytics-tracker.js';
import { playBeep } from './sound-fx.js';

export function registerArComponents(callbacks = {}) {
  if (typeof window.AFRAME === 'undefined') return;
  const AFRAME = window.AFRAME;

  // 1. Componente de Scanline Holográfica (subindo e descendo continuamente)
  if (!AFRAME.components['holo-scanline']) {
    AFRAME.registerComponent('holo-scanline', {
      schema: {
        minY: { type: 'number', default: -1.85 },
        maxY: { type: 'number', default: 1.85 },
        speed: { type: 'number', default: 1.35 },
        zOffset: { type: 'number', default: 0.035 }
      },
      init() {
        this.dir = -1;
        this.currY = this.data.maxY;
      },
      tick(time, timeDelta) {
        if (!this.el.object3D.visible) return;
        const dt = Math.min(timeDelta / 1000, 0.1);
        this.currY += this.dir * this.data.speed * dt;
        if (this.currY <= this.data.minY) {
          this.currY = this.data.minY;
          this.dir = 1;
        } else if (this.currY >= this.data.maxY) {
          this.currY = this.data.maxY;
          this.dir = -1;
        }
        this.el.object3D.position.set(0, this.currY, this.data.zOffset);
      }
    });
  }

  // 2. Componente de Respiração / Pulsação de Energia (Glow Pulse)
  if (!AFRAME.components['holo-glow-pulse']) {
    AFRAME.registerComponent('holo-glow-pulse', {
      schema: {
        minOpacity: { type: 'number', default: 0.52 },
        maxOpacity: { type: 'number', default: 0.85 },
        speed: { type: 'number', default: 2.2 }
      },
      tick(time) {
        const mesh = this.el.getObject3D('mesh');
        if (!mesh || !mesh.material) return;
        const t = (Math.sin((time / 1000) * this.data.speed) + 1) * 0.5;
        mesh.material.opacity =
          this.data.minOpacity + t * (this.data.maxOpacity - this.data.minOpacity);
      }
    });
  }

  // 3. Componente de Giro Contínuo Suave para o Laço 3D GLTF
  if (!AFRAME.components['holo-spin']) {
    AFRAME.registerComponent('holo-spin', {
      schema: {
        speedDeg: { type: 'number', default: 42 }
      },
      tick(time, timeDelta) {
        const dt = Math.min(timeDelta / 1000, 0.1);
        this.el.object3D.rotation.y += THREE.MathUtils.degToRad(this.data.speedDeg * dt);
      }
    });
  }

  // 4. Componente de Eventos do Marcador (targetFound / targetLost)
  if (!AFRAME.components['dds-target-handler']) {
    AFRAME.registerComponent('dds-target-handler', {
      init() {
        this.el.addEventListener('targetFound', () => {
          playBeep(1046, 80, 'sine', 0.1);
          Analytics.startTargetFocus();
          if (typeof callbacks.onTargetFound === 'function') {
            callbacks.onTargetFound();
          }
        });

        this.el.addEventListener('targetLost', () => {
          Analytics.endTargetFocus();
          if (typeof callbacks.onTargetLost === 'function') {
            callbacks.onTargetLost();
          }
        });
      }
    });
  }
}
