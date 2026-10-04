import { h } from '../dom';
import { BaseScreen } from '../UIManager';

export class LoadingScreen extends BaseScreen {
  constructor() {
    super();
    this.el.append(h('h1', { class: 'title' }, 'RUNENSCHACHT'), h('p', { class: 'subtitle' }, 'Lädt…'));
    this.el.style.background = '#1b2a1f';
  }
}
