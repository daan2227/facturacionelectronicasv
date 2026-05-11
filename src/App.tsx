import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import NuevoDocumento from './pages/NuevoDocumento'
import Historial from './pages/Historial'
import Clientes from './pages/Clientes'

export default function App() {
  const user = useAuthStore((s) => s.user)

  if (!user) return <LoginPage />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="nuevo" element={<NuevoDocumento />} />
          <Route path="historial" element={<Historial />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
