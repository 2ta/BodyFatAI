import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initAnalytics } from './services/analytics';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialize Google Analytics
initAnalytics();

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);