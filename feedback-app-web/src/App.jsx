import { BrowserRouter, Outlet, useLocation, useRoutes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Header } from './Components/Header'
import { NavBar } from './Components/Manager-Nav'
import './App.css'
import FeedbackLogSearchComp from './Components/Feedback-log-comp'
import MyICs from './pages/MyICs'
import Dashboard from './pages/Dashboard'
import Management from './pages/Management'
import MyManagement from './pages/MyManagement'

const TOKEN_STORAGE_KEY = 'token'
const VALID_ROLES = ['manager', 'director']

const managerRoutes = [
  { path: '/MyICs', title: 'My ICs', element: <MyICs /> },
  { path: '/feedback-log', title: 'FeedBack Log', element: <FeedbackLogSearchComp /> },
]

const directorRoutes = [
  { path: '/dashboard', title: 'Dashboard', element: <Dashboard /> },
  { path: '/management', title: 'Management', element: <Management /> },
  { path: '/my-management', title: 'My Management', element: <MyManagement /> },
]

function readCurrentUser() {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!token) {
    return { user: null, error: 'No hay una sesión iniciada.' }
  }

  try {
    const payload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
    if (!payload) throw new Error('Token inválido')

    const claims = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(window.atob(payload), (character) => character.charCodeAt(0)),
      ),
    )

    if (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now()) {
      return { user: null, error: 'La sesión expiró. Iniciá sesión nuevamente.' }
    }

    if (typeof claims.email !== 'string' || !VALID_ROLES.includes(claims.role)) {
      return { user: null, error: 'La sesión no contiene un usuario o rol válido.' }
    }

    return { user: { email: claims.email, role: claims.role }, error: null }
  } catch {
    return { user: null, error: 'No se pudo leer la sesión. Iniciá sesión nuevamente.' }
  }
}

function AppLayout({ user, links }) {
  const { pathname } = useLocation()
  const title = links.find(({ to }) => to === pathname)?.label ?? 'Página no encontrada'

  return (
    <div className="app-layout">
      <NavBar
        links={links}
        user={user}
      />
      <main className="app-content">
        <Header title={title} />
        <Outlet />
      </main>
    </div>
  )
}

function SessionNotice({ message, title = 'Acceso' }) {
  return (
    <main className="app-content">
      <Header title={title} />
      <p role="status">{message}</p>
    </main>
  )
}

function AuthenticatedApp() {
  const [session, setSession] = useState(readCurrentUser)

  useEffect(() => {
    function syncSession(event) {
      if (event.key === TOKEN_STORAGE_KEY || event.key === null) {
        setSession(readCurrentUser())
      }
    }

    window.addEventListener('storage', syncSession)
    return () => window.removeEventListener('storage', syncSession)
  }, [])

  const user = session.user
  const visibleRoutes = user?.role === 'director'
    ? [...managerRoutes, ...directorRoutes]
    : user?.role === 'manager'
      ? managerRoutes
      : []
  const links = visibleRoutes.map(({ path, title }) => ({ to: path, label: title }))
  const routeElements = visibleRoutes.map(({ path, title, element }) => ({
    path,
    element,
    handle: { title },
  }))
  const routes = user
    ? [
        {
          element: <AppLayout user={user} links={links} />,
          children: [...routeElements, {
            path: '*',
            element: <p role="status">No tenés acceso a esta página.</p>,
          }],
        },
      ]
    : [{ path: '*', element: <SessionNotice message={session.error} /> }]
  const element = useRoutes(routes)

  return element
}

function App() {
  return (
    <BrowserRouter>
      <AuthenticatedApp />
    </BrowserRouter>
  )
}

export default App
