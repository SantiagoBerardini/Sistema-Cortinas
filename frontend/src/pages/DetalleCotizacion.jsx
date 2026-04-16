import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCotizacionById } from '../services/api'

export default function DetalleCotizacion() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [cot, setCot] = useState(null)
    const printRef = useRef()

    useEffect(() => {
        getCotizacionById(id).then(r => setCot(r.data))
    }, [id])

    const imprimir = () => window.print()

    if (!cot) return <p>Cargando...</p>

    return (
        <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }} className="no-print">
                <button className="btn" style={{ background: '#6b7280', color: 'white' }}
                    onClick={() => navigate('/cotizaciones')}>← Volver</button>
                <button className="btn btn-primary" onClick={imprimir}>Imprimir / PDF</button>
                <button className="btn btn-success" onClick={() => navigate(`/cotizaciones/${id}/editar`)}>
                    Editar cotización
                </button>
            </div>

            <div ref={printRef} style={{ maxWidth: 800, margin: '0 auto' }}>
                {/* Encabezado */}
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ marginBottom: 4 }}>Presupuesto #{cot.id}</h2>
                        <p style={{ color: '#6b7280', fontSize: 14 }}>
                            Fecha: {new Date(cot.fecha).toLocaleDateString('es-AR')} &nbsp;·&nbsp;
                            Válido hasta: {new Date(cot.validez).toLocaleDateString('es-AR')}
                        </p>
                    </div>
                    <span className={`badge ${cot.estado === 'aprobada' ? 'badge-ok' : 'badge-warning'}`}
                        style={{ fontSize: 14, padding: '4px 14px' }}>
                        {cot.estado}
                    </span>
                </div>

                {/* Cliente */}
                <div className="card">
                    <h3 style={{ fontSize: 15, marginBottom: 12 }}>Cliente</h3>
                    <p style={{ fontWeight: 600 }}>{cot.clientes?.nombre}</p>
                    {cot.clientes?.telefono && <p style={{ color: '#6b7280', fontSize: 14 }}>Tel: {cot.clientes.telefono}</p>}
                    {cot.clientes?.direccion && <p style={{ color: '#6b7280', fontSize: 14 }}>Dir: {cot.clientes.direccion}</p>}
                </div>

                {/* Items */}
                <div className="card">
                    <h3 style={{ fontSize: 15, marginBottom: 16 }}>Detalle</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Descripción</th>
                                <th>Tipo</th>
                                <th>Medidas</th>
                                <th>Tela</th>
                                <th>Mecanismo</th>
                                <th>Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cot.items_cotizacion?.map((it, i) => (
                                <tr key={it.id}>
                                    <td>{i + 1}</td>
                                    <td>{it.descripcion || '—'}</td>
                                    <td>{it.tipo_cortina}</td>
                                    <td>{it.ancho}m × {it.alto}m</td>
                                    <td>{it.tipo_tela || '—'}</td>
                                    <td>{it.mecanismo}</td>
                                    <td style={{ fontWeight: 600 }}>${Number(it.precio_final).toLocaleString('es-AR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totales */}
                <div className="card" style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                        Margen aplicado: {cot.margen}%
                    </div>
                    {cot.notas && (
                        <div style={{ textAlign: 'left', fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                            Notas: {cot.notas}
                        </div>
                    )}
                    <div style={{ fontSize: 14, color: '#6b7280' }}>Total</div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#1e293b' }}>
                        ${Number(cot.total).toLocaleString('es-AR')}
                    </div>
                </div>
            </div>

            <style>{`
        @media print {
          .no-print { display: none !important; }
          .sidebar, .content { margin: 0 !important; }
          body { background: white; }
        }
      `}</style>
        </>
    )
}