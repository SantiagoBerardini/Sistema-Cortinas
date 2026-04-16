import { useEffect, useState } from 'react'
import { getCotizaciones, updateEstado } from '../services/api'
import { useNavigate } from 'react-router-dom'

const ESTADOS = {
    borrador: { label: 'Borrador', clase: 'badge-warning' },
    enviada: { label: 'Enviada', clase: 'badge-ok' },
    aprobada: { label: 'Aprobada', clase: 'badge-ok' },
    rechazada: { label: 'Rechazada', clase: 'badge-danger' },
}

export default function Cotizaciones() {
    const [cotizaciones, setCotizaciones] = useState([])
    const navigate = useNavigate()

    const cargar = async () => {
        const { data } = await getCotizaciones()
        setCotizaciones(data)
    }

    useEffect(() => { cargar() }, [])

    const cambiarEstado = async (id, estado) => {
        await updateEstado(id, estado)
        await cargar()
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2>Cotizaciones</h2>
                <button className="btn btn-primary" onClick={() => navigate('/cotizaciones/nueva')}>
                    + Nueva cotización
                </button>
            </div>

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Cliente</th>
                            <th>Teléfono</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {cotizaciones.map(c => (
                            <tr key={c.id}>
                                <td>#{c.id}</td>
                                <td>{c.clientes?.nombre}</td>
                                <td>{c.clientes?.telefono || '—'}</td>
                                <td>{new Date(c.fecha).toLocaleDateString('es-AR')}</td>
                                <td style={{ fontWeight: 600 }}>${Number(c.total).toLocaleString('es-AR')}</td>
                                <td>
                                    <span className={`badge ${ESTADOS[c.estado]?.clase || 'badge-warning'}`}>
                                        {ESTADOS[c.estado]?.label || c.estado}
                                    </span>
                                </td>
                                <td style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-primary"
                                        onClick={() => navigate(`/cotizaciones/${c.id}`)}>
                                        Ver
                                    </button>
                                    {c.estado === 'borrador' && (
                                        <button className="btn btn-success"
                                            onClick={() => cambiarEstado(c.id, 'enviada')}>
                                            Enviar
                                        </button>
                                    )}
                                    {c.estado === 'enviada' && (
                                        <button className="btn btn-success"
                                            onClick={() => cambiarEstado(c.id, 'aprobada')}>
                                            Aprobar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {cotizaciones.length === 0 && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 32 }}>
                                No hay cotizaciones aún
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    )
}