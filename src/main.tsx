import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initPWA } from './lib/pwaUpdate'
import './index.css'

initPWA()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
