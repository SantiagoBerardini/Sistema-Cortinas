import { useEffect, useState } from 'react'
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { getReporteResumen } from '../services/api'

const COLORES_ESTADO = ['#94a3b8', '#3b82f6', '#22c55e', '#ef4444']

function KPI({ titulo, valor, subtitulo, color }) {
    return (
        <div className="card" style={{ textAlign: 'center', borderTop: `4px solid ${color}` }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{titulo}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color }}>{valor}</div>
            {subtitulo && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{subtitulo}</div>}
        </div>
    )
}

const formatPeso = (v) => `$${Number(v).toLocaleString('es-AR')}`

export default function Reportes() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getReporteResumen()
            .then(r => setData(r.data))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <p style={{ padding: 32 }}>Cargando reportes...</p>
    if (!data) return <p style={{ padding: 32 }}>Error al cargar los reportes</p>

    const datosTorta = [
        { name: 'Borrador', value: data.cotizacionesPorEstado.borrador },
        { name: 'Enviada', value: data.cotizacionesPorEstado.enviada },
        { name: 'Aprobada', value: data.cotizacionesPorEstado.aprobada },
        { name: 'Rechazada', value: data.cotizacionesPorEstado.rechazada },
    ].filter(d => d.value > 0)

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2>Reportes</h2>
                <button className="btn" style={{ background: '#e5e7eb' }}
                    onClick={() => window.location.reload()}>
                    Actualizar
                </button>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                <KPI
                    titulo="Total facturado"
                    valor={formatPeso(data.totalFacturado)}
                    subtitulo="Cotizaciones aprobadas"
                    color="#22c55e"
                />
                <KPI
                    titulo="Cotizaciones"
                    valor={data.totalCotizaciones}
                    subtitulo="Total histórico"
                    color="#3b82f6"
                />
                <KPI
                    titulo="Clientes"
                    valor={data.totalClientes}
                    subtitulo="Registrados"
                    color="#8b5cf6"
                />
                <KPI
                    titulo="Stock bajo"
                    valor={data.productosStockBajo}
                    subtitulo="Productos a reponer"
                    color={data.productosStockBajo > 0 ? '#ef4444' : '#22c55e'}
                />
            </div>

            {/* Gráfico de barras — facturación por mes */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
                    Facturación mensual (últimos 6 meses)
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.cotizacionesPorMes} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="mes" tick={{ fontSize: 13 }} />
                        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => formatPeso(v)} labelStyle={{ fontWeight: 600 }} />
                        <Bar dataKey="total" name="Facturado" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                {/* Gráfico de línea — cantidad de cotizaciones */}
                <div className="card">
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
                        Cotizaciones por mes
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={data.cotizacionesPorMes} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Line
                                type="monotone" dataKey="cantidad" name="Cotizaciones"
                                stroke="#8b5cf6" strokeWidth={2.5}
                                dot={{ fill: '#8b5cf6', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Gráfico de torta — estados */}
                <div className="card">
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
                        Cotizaciones por estado
                    </h3>
                    {datosTorta.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: 48 }}>
                            Sin datos aún
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={datosTorta} cx="50%" cy="50%"
                                    outerRadius={80} dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                    labelLine={true}
                                >
                                    {datosTorta.map((_, i) => (
                                        <Cell key={i} fill={COLORES_ESTADO[i % COLORES_ESTADO.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Gráfico compras vs uso */}
            <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
                    Movimientos de stock por mes
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.movimientosPorMes} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="mes" tick={{ fontSize: 13 }} />
                        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v, name) => name === 'compras' ? formatPeso(v) : v} />
                        <Legend />
                        <Bar dataKey="compras" name="Compras ($)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="uso" name="Usos en fabricación" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </>
    )
}