import { Route, Routes } from 'react-router-dom'
import { Header } from './Components/Header'
import { NavBar } from './Components/Manager-Nav'
import './App.css'

function App() {
  return (
    <div className="app-layout">
      <NavBar />
      <div className="app-content">
        <Header />
        <main className="app-page">
          <Routes>
            <Route path="/MyICs" element={null} />
            <Route path="/feedback-log" element={null} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
