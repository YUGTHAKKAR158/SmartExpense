// ═══════════════════════════════════════════════
// src/main.jsx — React entry point
//
// This is the first file React loads.
// It mounts the App component into the HTML div
// with id="root" (in public/index.html)
// ═══════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Tailwind styles

ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode renders components twice in development
  // to help detect side effects and bugs early
  <React.StrictMode>
    <App />
  </React.StrictMode>
);