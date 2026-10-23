import { createBrowserRouter, Outlet, Route, RouterProvider, Routes } from 'react-router-dom'
import { Header } from './Components/Header'
import { NavBar } from './Components/Manager-Nav'
import './App.css'
import MyICs from './pages/MyICs'
import Dashboard from './pages/Dashboard'
import Management from './pages/Management'
import MyManagement from './pages/MyManagement'
import FeedbackLogComp from './Components/Feedback-log-comp'

const IS_ADMIN = true

const managerRoutes = [
  { path: '/MyICs', title: 'My ICs', element: <MyICs /> },
  { path: '/feedback-log', title: 'FeedBack Log', element: <FeedbackLogComp /> },
]

const adminRoutes = [
  { path: '/dashboard', title: 'Dashboard', element: <Dashboard /> },
  { path: '/management', title: 'Management', element: <Management /> },
  { path: '/my-management', title: 'My Management', element: <MyManagement /> },
]

const visibleRoutes = IS_ADMIN ? [...managerRoutes, ...adminRoutes] : managerRoutes

function AppLayout() {
  return (
    <div className="app-layout">
      <NavBar
        links={visibleRoutes.map(({ path, title }) => ({ to: path, label: title }))}
      />
      <main className="app-content">
        <Header />
        <Routes>
          <Route path="/feedback-log" element={ <FeedbackLogComp/> } />
          <Route path="/MyICs" element={<MyICs/>} />
        </Routes>
        <Outlet />
      </main>
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      ...visibleRoutes.map(({ path, title, element }) => ({
        path,
        element,
        handle: { title },
      })),
      { path: '*', element: null },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
