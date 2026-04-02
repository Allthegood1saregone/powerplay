import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("index.tsx is executing!");
const rootElement = document.getElementById('root');
console.log("rootElement:", rootElement);

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log("Creating React root...");
const root = ReactDOM.createRoot(rootElement);
console.log("Rendering App...");
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log("Done calling root.render()");
