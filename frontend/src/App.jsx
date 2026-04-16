import { Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Productos from './pages/Productos.jsx'
import Movimientos from './pages/Movimientos.jsx'
import Alertas from './pages/Alertas.jsx'
import Cotizaciones from './pages/Cotizaciones.jsx'
import NuevaCotizacion from './pages/NuevaCotizacion.jsx'
import DetalleCotizacion from './pages/DetalleCotizacion.jsx'
import EditarCotizacion from './pages/EditarCotizacion.jsx'
import Clientes from './pages/Clientes.jsx'
import Reportes from './pages/Reportes.jsx'
import Configuracion from './pages/Configuracion.jsx'
import { getAlertasStock } from './services/api'
import './App.css'

export default function App() {
  const [alertasCount, setAlertasCount] = useState(0)

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const { data } = await getAlertasStock()
        setAlertasCount(data.length)
      } catch { }
    }
    fetchAlertas()
    const intervalo = setInterval(fetchAlertas, 5 * 60 * 1000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div className="layout">
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <img src="/logo.jpeg" alt="BM Cortinas"
            onError={e => { e.target.style.display = 'none'; }} />
          <span className="subtitulo">Gestión de productos</span>
        </div>

        {/* Navegación */}
        <nav>
          <span className="sidebar-section">Inventario</span>
          <NavLink to="/" end>
            <span className="nav-icon">📦</span> Productos
          </NavLink>
          <NavLink to="/movimientos">
            <span className="nav-icon">🔄</span> Movimientos
          </NavLink>
          <NavLink to="/alertas">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="nav-icon">⚠️</span> Alertas de stock
            </span>
            {alertasCount > 0 && (
              <span className="alert-badge">{alertasCount}</span>
            )}
          </NavLink>

          <span className="sidebar-section">Ventas</span>
          <NavLink to="/cotizaciones">
            <span className="nav-icon">📋</span> Cotizaciones
          </NavLink>
          <NavLink to="/clientes">
            <span className="nav-icon">👥</span> Clientes
          </NavLink>

          <span className="sidebar-section">Análisis</span>
          <NavLink to="/reportes">
            <span className="nav-icon">📊</span> Reportes
          </NavLink>

          <span className="sidebar-section">Sistema</span>
          <NavLink to="/configuracion">
            <span className="nav-icon">⚙️</span> Configuración
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          BM Cortinas © {new Date().getFullYear()}
        </div>

      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<Productos />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/cotizaciones" element={<Cotizaciones />} />
          <Route path="/cotizaciones/nueva" element={<NuevaCotizacion />} />
          <Route path="/cotizaciones/:id" element={<DetalleCotizacion />} />
          <Route path="/cotizaciones/:id/editar" element={<EditarCotizacion />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </main>
    </div>
  )
}