import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Router from './Router/router'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
