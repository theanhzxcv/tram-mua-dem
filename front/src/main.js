import { createRoot } from 'react-dom/client';
import { html } from './lib/html.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { App } from './App.js';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(html`
    <${ErrorBoundary}>
      <${App} />
    <//>
  `);
}
