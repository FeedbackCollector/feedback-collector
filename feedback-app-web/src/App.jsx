import { Route, Routes } from 'react-router-dom'
import { NavBar } from './Components/Manager-Nav'
import './App.css'

function App() {
  return (
    <div className="app-layout">
      <NavBar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={null} />
          <Route path="/feedback-log" element={null} />
        </Routes>
      </main>
    </div>
  )
}

export default App
