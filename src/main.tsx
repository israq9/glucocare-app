import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AuthGate from './AuthGate.tsx'
import './style.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate>
      {(session) => <App session={session} />}
    </AuthGate>
  </React.StrictMode>,
)