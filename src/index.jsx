import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';

// Default to dark mode
document.documentElement.classList.add('dark');

const rootElement = document.getElementById('root');
createRoot(rootElement).render(<App />);