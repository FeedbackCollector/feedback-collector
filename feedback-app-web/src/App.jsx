import { Route, Routes } from 'react-router-dom'
import { NavBar } from './Components/Manager-Nav'

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={null} />
        <Route path="/feedback-log" element={null} />
      </Routes>
    </>
  )
}

export default App
