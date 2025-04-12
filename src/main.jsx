import { StrictMode } from 'react'
import React from 'react';
import { createRoot } from 'react-dom/client'
import ReactDOM from 'react-dom/client';
import App from './App.jsx'
import './styles/index.css'
import AppRouter from './routes/AppRouter';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);