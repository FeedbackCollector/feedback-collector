import { BrowserRouter, Navigate, Outlet, useLocation, useRoutes } from 'react-router-dom'
import { Header } from './components/Header'
import { NavBar } from './components/Manager-Nav'
import { useAuthStore } from './store/authStore'
import './styles/App.css'
import MyICs from './pages/MyICs'
import Dashboard from './pages/Dashboard'
import Management from './pages/Management'
import MyManagement from './pages/MyManagement'
import FeedbackLog from './pages/Feedback-Log-Page'
import ICTimeline from './pages/ICTimeline'
import Login from './pages/login'
import { ToastContainer } from './components/ToastContainer'

const VALID_ROLES = ['manager', 'director']

const managerRoutes = [
  { path: '/my-ics', title: 'My ICs', element: <MyICs /> },
  { path: '/feedback-log', title: 'FeedBack Log', element: <FeedbackLog /> },
]

const directorRoutes = [
  { path: '/dashboard', title: 'Dashboard', element: <Dashboard /> },
  { path: '/my-management', title: 'My Managers', element: <MyManagement /> },
]

function AppLayout({ links }) {
  const { pathname } = useLocation()
  const title = links.find(({ to }) => pathname === to || pathname.startsWith(`${to}/`))?.label ?? 'Página no encontrada'

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
        const isDirector = user.role === 'director'
        const homePath = isDirector ? '/dashboard' : '/my-ics'
        const visibleRoutes = isDirector
          ? [...directorRoutes, ...managerRoutes, { path: '/management', title: 'Management', element: <Navigate to="/management/areas" replace /> }]
          : managerRoutes
        const links = visibleRoutes.map(({ path, title }) => ({ to: path, label: title }))
        const detailRoutes = [
          { path: '/my-ics/:icId', element: <ICTimeline /> },
          ...(isDirector ? [{ path: '/management/:tab', element: <Management /> }] : []),
        ]

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
              ...detailRoutes,
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
      <ToastContainer/>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
