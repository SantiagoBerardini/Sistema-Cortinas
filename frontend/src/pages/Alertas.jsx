import { useEffect, useState } from 'react'
import { getAlertasStock } from '../services/api'

export default function Alertas() {
    const [alertas, setAlertas] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getAlertasStock()
            .then(r => setAlertas(r.data))
            .finally(() => setLoading(false))
    }, [])

    return (
        <>
            <h2>Alertas de stock bajo</h2>

            {!loading && alertas.length === 0 && (
                <div className="card" style={{ textAlign: 'center', color: '#22c55e', padding: 48 }}>
                    Todo el stock está en niveles normales
                </div>
            )}

            {alertas.length > 0 && (
                <div className="alert-banner">
                    {alertas.length} producto{alertas.length > 1 ? 's' : ''} por debajo del stock mínimo
                </div>
            )}

            {alertas.length > 0 && (
                <div className="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Stock actual</th>
                                <th>Stock mínimo</th>
                                <th>Diferencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alertas.map(p => (
                                <tr key={p.id}>
                                    <td>{p.nombre}</td>
                                    <td>{p.categorias?.nombre}</td>
                                    <td><span className="badge badge-danger">{p.stock_actual}</span></td>
                                    <td>{p.stock_minimo}</td>
                                    <td style={{ color: '#ef4444', fontWeight: 500 }}>
                                        {(p.stock_actual - p.stock_minimo).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    )
}