import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PUBLIC_SITE_URL } from './lib/navigation.ts';
import './index.css';

const isLocalhost3001 = window.location.hostname === 'localhost' && window.location.port === '3001';
const isLocalOAuthReturn = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  && new URLSearchParams(window.location.search).has('code');

if (isLocalhost3001 || isLocalOAuthReturn) {
  const hashRoute = window.location.hash || '#/';
  window.location.replace(`${PUBLIC_SITE_URL}/${hashRoute}`);
} else {
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
}
