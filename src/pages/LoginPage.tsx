import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const { signIn, init } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { init() }, [init])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const err = await signIn(email, password)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div className="min-h-screen bg-sv-blue flex flex-col items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-sv-blue">FacturaSV</h1>
          <p className="text-gray-500 text-sm mt-1">Documentos Tributarios Electrónicos</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Correo electrónico</label>
            <input
              type="email"
              className="input-field mt-0.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Contraseña</label>
            <input
              type="password"
              className="input-field mt-0.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
