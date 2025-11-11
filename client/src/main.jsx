import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ClerkAuthProvider from './context/ClerkAuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkAuthProvider>
      <App />
    </ClerkAuthProvider>
  </React.StrictMode>,
);
