import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';  // .jsx uzantısını ekleyelim
import './utils/axiosConfig';  // Axios konfigürasyonunu import et

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
