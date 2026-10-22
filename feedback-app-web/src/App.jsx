import { Route, Routes } from 'react-router-dom'
import { Header } from './Components/Header'
import { NavBar } from './Components/Manager-Nav'
import './App.css'
import MyICs from './pages/MyICs'

function App() {
  return (
    <div className="app-layout">
      <NavBar />
      <main className="app-content">
        <Header />
        <Routes>
          <Route path="/MyICs" element={<MyICs/>} />
          <Route path="/feedback-log" element={null} />
        </Routes>
      </main>
    </div>
  )
}

export default App
