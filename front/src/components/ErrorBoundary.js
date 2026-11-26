import { Component, html } from '../lib/html.js';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Lỗi không xác định' };
  }

  render() {
    if (this.state.hasError) {
      return html`
        <div className="app-shell" style=${{ alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
          <div className="glass-card" style=${{ maxWidth: '420px', padding: '28px' }}>
            <div style=${{ fontSize: '32px', marginBottom: '12px' }}>🕯️</div>
            <h2 style=${{ margin: '0 0 8px', color: 'var(--amber-pale)', fontSize: '18px' }}>
              Ngọn nến vừa chập chờn một chút
            </h2>
            <p style=${{ margin: '0 0 18px', color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6 }}>
              ${this.state.message}
            </p>
            <button
              type="button"
              className="btn-primary-amber"
              onClick=${() => window.location.reload()}
            >
              Thắp nến lại
            </button>
          </div>
        </div>
      `;
    }
    return this.props.children;
  }
}
