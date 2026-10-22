import { Route, Routes } from 'react-router-dom'
import { NavBar } from './Components/Manager-Nav'
import './App.css'
import FeedbackLogSearchComp from './Components/Feedback-log-comp'


function App() {
  return (
    <div className="app-layout">
      <NavBar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={null} />
          <Route path="/feedback-log" element={ <FeedbackLogSearchComp/> } />
        </Routes>
      </main>
    </div>
  )
}

export default App
