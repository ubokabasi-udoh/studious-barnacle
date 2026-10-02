import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { TaskDrawerProvider } from './components/tasks/TaskDrawerProvider'
import { StoreProvider } from './context/store'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <TaskDrawerProvider><App /></TaskDrawerProvider>
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>)
