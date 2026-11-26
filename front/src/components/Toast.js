import { html } from '../lib/html.js';

export function Toast({ message, visible }) {
  return html`
    <div className=${`toast-box${visible ? ' visible' : ''}`} role="status" aria-live="polite">
      <div className="toast-pill">${message}</div>
    </div>
  `;
}
