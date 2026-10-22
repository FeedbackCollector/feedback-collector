import { createBrowserRouter, Outlet, RouterProvider, Route, Routes } from 'react-router-dom'
import { Header } from './Components/Header'
import { NavBar } from './Components/Manager-Nav'
import './App.css'
import FeedbackLogSearchComp from './Components/Feedback-log-comp'
import MyICs from './pages/MyICs'

function AppLayout() {
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

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/MyICs', element: <MyICs />, handle: { title: 'My ICs' } },
      { path: '/feedback-log', element: null, handle: { title: 'FeedBack Log' } },
      { path: '*', element: null },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
