import '@fontsource/lilita-one';
import './ui/styles.css';
import { App } from './app/App';
import { installDebugApi, parseDebugParams } from './app/debug';

// iOS: Pinch-Zoom unterbinden
document.addEventListener('gesturestart', (e) => e.preventDefault());

const params = parseDebugParams(location.search);
const app = new App(document.getElementById('app')!, params);
if (params.debug || import.meta.env.DEV) installDebugApi(app);
void app.boot();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}
