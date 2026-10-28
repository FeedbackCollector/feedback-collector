import { BrowserRouter, Navigate, Outlet, useLocation, useRoutes } from 'react-router-dom'
import { Header } from './Components/Header'
import { NavBar } from './Components/Manager-Nav'
import { useAuthStore } from './store/authStore'
import './App.css'
import MyICs from './pages/MyICs'
import Dashboard from './pages/Dashboard'
import Management from './pages/Management'
import MyManagement from './pages/MyManagement'
import FeedbackLogComp from './Components/Feedback-log-comp'
import Login from './pages/login'

const VALID_ROLES = ['manager', 'director']

const managerRoutes = [
  { path: '/MyICs', title: 'My ICs', element: <MyICs /> },
  { path: '/feedback-log', title: 'FeedBack Log', element: <FeedbackLogComp /> },
]

const directorRoutes = [
  { path: '/dashboard', title: 'Dashboard', element: <Dashboard /> },
  { path: '/my-management', title: 'My Management', element: <MyManagement /> },
]

function AppLayout({ links }) {
  const { pathname } = useLocation()
  const title = links.find(({ to }) => to === pathname)?.label ?? 'Página no encontrada'

  return (
    <div className="app-layout">
      <NavBar links={links} />
      <main className="app-content">
        <Header title={title} />
        <Outlet />
      </main>
    </div>
  )
}

function AppRoutes() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasValidSession = isAuthenticated
    && user !== null
    && VALID_ROLES.includes(user.role)

  const routes = hasValidSession
    ? (() => {
        const homePath = user.role === 'director' ? '/dashboard' : '/MyICs'
        const visibleRoutes = user.role === 'director'
          ? [...directorRoutes, ...managerRoutes, { path: '/management', title: 'Management', element: <Management /> }]
          : managerRoutes
        const links = visibleRoutes.map(({ path, title }) => ({ to: path, label: title }))

        return [
          {
            element: <AppLayout links={links} />,
            children: [
              { index: true, element: <Navigate to={homePath} replace /> },
              ...visibleRoutes.map(({ path, title, element }) => ({
                path,
                element,
                handle: { title },
              })),
              { path: '*', element: <Navigate to={homePath} replace /> },
            ],
          },
        ]
      })()
    : [
      { path: '/', element: <Login /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ]

  return useRoutes(routes)
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
