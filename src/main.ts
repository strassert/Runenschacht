import '@fontsource/lilita-one';
import './ui/styles.css';
import { App } from './app/App';
import { installDebugApi, parseDebugParams } from './app/debug';

const params = parseDebugParams(location.search);
const app = new App(document.getElementById('app')!, params);
if (params.debug || import.meta.env.DEV) installDebugApi(app);
app.startLevel(params.level ?? 1, params.autoplay);
