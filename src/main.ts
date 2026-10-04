import * as THREE from 'three';
import { Renderer } from './render/Renderer';
import { simToThree } from './render/coords';
import { Simulation } from './core/simulation';
import { Bot } from './core/bot';
import { getLevel } from './core/level/levels';
import { CONFIG } from './core/config';

// Temporäre Vorschau (wird in Schritt 5.2 durch App ersetzt).
const style = document.createElement('style');
style.textContent = `html, body, #app { margin: 0; height: 100%; overflow: hidden; background: #1b2a1f; }
#game-canvas { display: block; width: 100%; height: 100%; }`;
document.head.appendChild(style);

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const r = new Renderer({ canvas, maxPixelRatio: 2, shadows: false, antialias: true });
r.scene.background = new THREE.Color(0x87a7c4);

const ground = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 400), new THREE.MeshNormalMaterial());
ground.position.set(0, -0.25, -190);
r.scene.add(ground);
const marker = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0x2f6bff }),
);
r.scene.add(marker);

const sim = new Simulation(getLevel(1)!);
const bot = new Bot();
sim.start();
const v = new THREE.Vector3();
let acc = 0;
let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;
  while (acc >= CONFIG.sim.dt) {
    bot.update(sim.world, CONFIG.sim.dt);
    sim.step();
    sim.clearEvents();
    acc -= CONFIG.sim.dt;
  }
  const s = sim.world.squad;
  simToThree(s.x, 0.5, s.z, marker.position);
  simToThree(s.x, 10, s.z - 12, r.camera.position);
  r.camera.lookAt(simToThree(s.x, 0, s.z + 10, v));
  r.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
