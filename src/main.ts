import '@fontsource/lilita-one';
import { App } from './app/App';
import { installDebugApi, parseDebugParams } from './app/debug';

const style = document.createElement('style');
style.textContent = `html, body, #app { margin: 0; height: 100%; overflow: hidden; background: #1b2a1f; }
#game-canvas { display: block; width: 100%; height: 100%; }`;
document.head.appendChild(style);

const params = parseDebugParams(location.search);
const app = new App(document.getElementById('app')!, params);
if (params.debug || import.meta.env.DEV) installDebugApi(app);
app.startLevel(params.level ?? 1, params.autoplay);
