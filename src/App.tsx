import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEmpresaStore } from './store/empresaStore'
import Layout from './components/Layout'
import SetupEmpresa from './pages/SetupEmpresa'
import Dashboard from './pages/Dashboard'
import NuevoDocumento from './pages/NuevoDocumento'
import Historial from './pages/Historial'
import Clientes from './pages/Clientes'
import Ajustes from './pages/Ajustes'

export default function App() {
  const { empresa, load } = useEmpresaStore()

  useEffect(() => { load() }, [load])

  if (!empresa) return <SetupEmpresa />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="nuevo" element={<NuevoDocumento />} />
          <Route path="historial" element={<Historial />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
