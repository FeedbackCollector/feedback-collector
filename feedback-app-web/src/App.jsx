import { Route, Routes } from 'react-router-dom'
import { Header } from './Components/Header'
import { NavBar } from './Components/Manager-Nav'
import './App.css'
import FeedbackLogSearchComp from './Components/Feedback-log-comp'
import MyICs from './pages/MyICs'

function App() {
  return (
    <div className="app-layout">
      <NavBar />
      <main className="app-content">
        <Header />
        <Routes>
          <Route path="/feedback-log" element={ <FeedbackLogSearchComp/> } />
          <Route path="/MyICs" element={<MyICs/>} />
        </Routes>
      </main>
    </div>
  )
}

export default App
