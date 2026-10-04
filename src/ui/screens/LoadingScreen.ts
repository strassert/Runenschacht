import { h } from '../dom';
import { BaseScreen } from '../UIManager';

export class LoadingScreen extends BaseScreen {
  constructor() {
    super('screen--loading');
    this.el.append(h('h1', { class: 'title' }, 'RUNENSCHACHT'), h('p', { class: 'subtitle' }, 'Lädt…'));
  }
}
