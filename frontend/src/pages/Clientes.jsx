import { useEffect, useState } from 'react'
import { getClientes, createCliente, updateCotizacion } from '../services/api'
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3001/api' })

const empty = { nombre: '', telefono: '', direccion: '' }

export default function Clientes() {
    const [clientes, setClientes] = useState([])
    const [historial, setHistorial] = useState([])
    const [clienteSel, setClienteSel] = useState(null)
    const [form, setForm] = useState(empty)
    const [editandoId, setEditandoId] = useState(null)
    const [mostrarForm, setMostrarForm] = useState(false)
    const [busqueda, setBusqueda] = useState('')
    const [loading, setLoading] = useState(false)

    const cargar = async () => {
        const { data } = await getClientes()
        setClientes(data)
    }

    useEffect(() => { cargar() }, [])

    const verHistorial = async (cliente) => {
        setClienteSel(cliente)
        const { data } = await api.get(`/cotizaciones?cliente_id=${cliente.id}`)
        setHistorial(data.filter(c => c.cliente_id === cliente.id))
    }

    const clientesFiltrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.telefono || '').includes(busqueda)
    )

    const abrirNuevo = () => {
        setForm(empty)
        setEditandoId(null)
        setMostrarForm(true)
        setClienteSel(null)
    }

    const abrirEditar = (c) => {
        setForm({ nombre: c.nombre, telefono: c.telefono || '', direccion: c.direccion || '' })
        setEditandoId(c.id)
        setMostrarForm(true)
        setClienteSel(null)
    }

    const cerrarForm = () => {
        setMostrarForm(false)
        setEditandoId(null)
        setForm(empty)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        if (editandoId) {
            await api.put(`/clientes/${editandoId}`, form)
        } else {
            await createCliente(form)
        }
        cerrarForm()
        await cargar()
        setLoading(false)
    }

    const ESTADOS = {
        borrador: { label: 'Borrador', clase: 'badge-warning' },
        enviada: { label: 'Enviada', clase: 'badge-ok' },
        aprobada: { label: 'Aprobada', clase: 'badge-ok' },
        rechazada: { label: 'Rechazada', clase: 'badge-danger' },
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2>Clientes</h2>
                <button className="btn btn-primary" onClick={abrirNuevo}>
                    + Nuevo cliente
                </button>
            </div>

            {/* Modal nuevo / editar cliente */}
            {mostrarForm && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarForm()}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editandoId ? 'Editar cliente' : 'Nuevo cliente'}</h3>
                            <button className="modal-close" onClick={cerrarForm}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nombre *</label>
                                    <input required value={form.nombre}
                                        onChange={e => setForm({ ...form, nombre: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Teléfono</label>
                                    <input value={form.telefono}
                                        onChange={e => setForm({ ...form, telefono: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Dirección</label>
                                    <input value={form.direccion}
                                        onChange={e => setForm({ ...form, direccion: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button className="btn btn-primary" type="submit" disabled={loading}>
                                    {loading ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear cliente'}
                                </button>
                                <button className="btn" type="button"
                                    style={{ background: '#f0ede8', color: '#6b6560' }} onClick={cerrarForm}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: clienteSel ? '1fr 1fr' : '1fr', gap: 24 }}>
                {/* Lista de clientes */}
                <div>
                    <div className="card" style={{ padding: '16px 24px', marginBottom: 0 }}>
                        <input
                            className="buscador-clientes"
                            placeholder="Buscar por nombre o teléfono..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />
                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
                            {clientesFiltrados.length} clientes
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: 16 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Teléfono</th>
                                    <th>Dirección</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientesFiltrados.map(c => (
                                    <tr key={c.id}
                                        style={{ background: clienteSel?.id === c.id ? '#eff6ff' : 'white' }}>
                                        <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                                        <td>{c.telefono || '—'}</td>
                                        <td style={{ color: '#6b7280', fontSize: 13 }}>{c.direccion || '—'}</td>
                                        <td style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-primary"
                                                onClick={() => verHistorial(c)}>
                                                Historial
                                            </button>
                                            <button className="btn"
                                                style={{ background: '#e5e7eb' }}
                                                onClick={() => abrirEditar(c)}>
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {clientesFiltrados.length === 0 && (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', padding: 32 }}>
                                        No hay clientes cargados aún
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Panel de historial */}
                {clienteSel && (
                    <div>
                        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <h3 style={{ fontSize: 16, marginBottom: 4 }}>{clienteSel.nombre}</h3>
                                    {clienteSel.telefono && <p style={{ fontSize: 13, color: '#6b7280' }}>📞 {clienteSel.telefono}</p>}
                                    {clienteSel.direccion && <p style={{ fontSize: 13, color: '#6b7280' }}>📍 {clienteSel.direccion}</p>}
                                </div>
                                <button className="btn" style={{ background: '#e5e7eb' }}
                                    onClick={() => setClienteSel(null)}>✕</button>
                            </div>

                            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
                                    Historial de cotizaciones ({historial.length})
                                </h4>
                                {historial.length === 0 ? (
                                    <p style={{ color: '#9ca3af', fontSize: 14 }}>Sin cotizaciones aún</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {historial.map(cot => (
                                            <div key={cot.id} style={{
                                                background: '#f9fafb', borderRadius: 8,
                                                padding: '10px 14px', display: 'flex',
                                                justifyContent: 'space-between', alignItems: 'center'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: 14 }}>
                                                        Presupuesto #{cot.id}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                                                        {new Date(cot.fecha).toLocaleDateString('es-AR')}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                                                        ${Number(cot.total).toLocaleString('es-AR')}
                                                    </div>
                                                    <span className={`badge ${ESTADOS[cot.estado]?.clase || 'badge-warning'}`}>
                                                        {ESTADOS[cot.estado]?.label || cot.estado}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        <div style={{
                                            marginTop: 8, padding: '10px 14px',
                                            background: '#eff6ff', borderRadius: 8,
                                            display: 'flex', justifyContent: 'space-between'
                                        }}>
                                            <span style={{ fontWeight: 500, fontSize: 14 }}>Total facturado</span>
                                            <span style={{ fontWeight: 700, fontSize: 16, color: '#1d4ed8' }}>
                                                ${historial.reduce((s, c) => s + Number(c.total), 0).toLocaleString('es-AR')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}