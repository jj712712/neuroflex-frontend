  // src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { FirebaseProvider } from './contexts/FirebaseContext'; // NEW IMPORTANT IMPORT

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <FirebaseProvider> {/* Wrap your entire App with the FirebaseProvider */}
      <App />
    </FirebaseProvider>
  </React.StrictMode>
);

