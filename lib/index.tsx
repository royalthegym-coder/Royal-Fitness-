
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from '../utils/components/App';
import '../index.css';
import { clearLegacySensitiveStorage } from './runtimeSecrets';

// Remove legacy plaintext credentials before the application first renders.
clearLegacySensitiveStorage();

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
        <Analytics />
      </React.StrictMode>
    );
}
