import '@fontsource/lilita-one';
import { App } from './app/App';

const style = document.createElement('style');
style.textContent = `html, body, #app { margin: 0; height: 100%; overflow: hidden; background: #1b2a1f; }
#game-canvas { display: block; width: 100%; height: 100%; }`;
document.head.appendChild(style);

const app = new App(document.getElementById('app')!);
const params = new URLSearchParams(location.search);
app.startLevel(Number(params.get('level') ?? 1), params.get('autoplay') === '1');
