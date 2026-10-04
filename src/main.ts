import '@fontsource/lilita-one';
import { Renderer } from './render/Renderer';
import { CameraRig } from './render/CameraRig';
import { Lighting } from './render/Lighting';
import { applyFog, createSky } from './render/Sky';
import { TrackView } from './render/views/TrackView';
import { SquadView } from './render/views/SquadView';
import { Simulation } from './core/simulation';
import { Bot } from './core/bot';
import { getLevel } from './core/level/levels';
import { CONFIG } from './core/config';

// Temporäre Vorschau (wird in Schritt 5.2 durch App ersetzt).
const style = document.createElement('style');
style.textContent = `html, body, #app { margin: 0; height: 100%; overflow: hidden; background: #1b2a1f; }
#game-canvas { display: block; width: 100%; height: 100%; }`;
document.head.appendChild(style);

const params = new URLSearchParams(location.search);
const startZ = Number(params.get('z') ?? 0);
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const r = new Renderer({ canvas, maxPixelRatio: 2, shadows: true, antialias: true });
const rig = new CameraRig(r.camera);
r.onResize((w, h) => rig.setAspect(w / h));
const lighting = new Lighting(true);
r.scene.add(lighting.root);
const sky = createSky(lighting.sunDirection);
r.scene.add(sky);
applyFog(r.scene);

const level = getLevel(1)!;
r.scene.add(new TrackView(level).root);
const squadView = new SquadView(true);
r.scene.add(squadView.root);

const sim = new Simulation(level);
const bot = new Bot();
sim.start();
sim.world.squad.z = startZ;
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
  squadView.sync(sim.world, dt);
  rig.update(sim.world, dt);
  lighting.update(sim.world);
  sky.position.copy(r.camera.position);
  r.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
