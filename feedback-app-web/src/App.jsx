import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { Header } from './Components/Header'
import { NavBar } from './Components/Manager-Nav'
import './App.css'
import MyICs from './pages/MyICs'

function AppLayout() {
  return (
    <div className="app-layout">
      <NavBar />
      <main className="app-content">
        <Header />
        <Outlet />
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
