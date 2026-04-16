import { useEffect, useState } from 'react'
import { getProductos, getMovimientos, createMovimiento } from '../services/api'

const TIPOS = [
    { value: 'compra', label: 'Compra de insumos' },
    { value: 'uso_fabricacion', label: 'Uso en fabricación' },
    { value: 'venta', label: 'Venta' },
    { value: 'ajuste', label: 'Ajuste de inventario' },
    { value: 'rotura', label: 'Rotura / pérdida' },
]

const empty = { producto_id: '', tipo: 'compra', cantidad: '', costo_total: '', referencia: '', observaciones: '' }

export default function Movimientos() {
    const [movimientos, setMovimientos] = useState([])
    const [productos, setProductos] = useState([])
    const [form, setForm] = useState(empty)
    const [loading, setLoading] = useState(false)

    const cargar = async () => {
        const [m, p] = await Promise.all([getMovimientos(), getProductos()])
        setMovimientos(m.data)
        setProductos(p.data)
    }

    useEffect(() => { cargar() }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        await createMovimiento(form)
        setForm(empty)
        await cargar()
        setLoading(false)
    }

    const tipoLabel = (v) => TIPOS.find(t => t.value === v)?.label || v

    return (
        <>
            <h2>Movimientos de stock</h2>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Producto *</label>
                            <select required value={form.producto_id}
                                onChange={e => setForm({ ...form, producto_id: e.target.value })}>
                                <option value="">Seleccioná...</option>
                                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tipo *</label>
                            <select value={form.tipo}
                                onChange={e => setForm({ ...form, tipo: e.target.value })}>
                                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Cantidad *</label>
                            <input required type="number" min="0.01" step="0.01" value={form.cantidad}
                                onChange={e => setForm({ ...form, cantidad: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Costo total ($)</label>
                            <input type="number" value={form.costo_total}
                                onChange={e => setForm({ ...form, costo_total: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Referencia</label>
                            <input placeholder="Ej: Factura 0001" value={form.referencia}
                                onChange={e => setForm({ ...form, referencia: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Observaciones</label>
                            <input value={form.observaciones}
                                onChange={e => setForm({ ...form, observaciones: e.target.value })} />
                        </div>
                    </div>
                    <button className="btn btn-success" type="submit" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrar movimiento'}
                    </button>
                </form>
            </div>

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Producto</th>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Costo</th>
                            <th>Referencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movimientos.map(m => (
                            <tr key={m.id}>
                                <td>{new Date(m.fecha).toLocaleDateString('es-AR')}</td>
                                <td>{m.productos?.nombre}</td>
                                <td>{tipoLabel(m.tipo)}</td>
                                <td>{m.cantidad} {m.productos?.unidad}</td>
                                <td>{m.costo_total ? `$${m.costo_total}` : '—'}</td>
                                <td>{m.referencia || '—'}</td>
                            </tr>
                        ))}
                        {movimientos.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: 32 }}>
                                No hay movimientos registrados aún
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    )
}