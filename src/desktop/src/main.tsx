import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import NetworkGuard from './components/NetworkGuard.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NetworkGuard>
      <App />
    </NetworkGuard>
  </React.StrictMode>
);;
