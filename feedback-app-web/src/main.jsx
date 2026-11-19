import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/index.css'
import App from './App.jsx'
import { startSessionCheck } from './utils/checkSessions'
startSessionCheck();
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
