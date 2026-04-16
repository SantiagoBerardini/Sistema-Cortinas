import { useEffect, useState } from 'react'
import { getProductos, getCategorias, createProducto, updateProducto, deleteProducto } from '../services/api'

const UNIDADES = ['unidad', 'metros', 'rollo', 'caja', 'kg']
const empty = {
    nombre: '', 
    sku: '', 
    descripcion: '', 
    categoria_id: '',
    unidad: 'unidad', 
    stock_actual: 0, 
    stock_minimo: 0, 
    costo_unitario: 0,
    ancho_rollo: 0,
    largo_rollo: 30,
    factor_desperdicio: 1.0,
    tipo_medida: 'unidad',
    es_producto_base: true,
    producto_padre_id: null
}

export default function Productos() {
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [form, setForm] = useState(empty)
    const [editandoId, setEditandoId] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [busqueda, setBusqueda] = useState('')
    const [filtroCat, setFiltroCat] = useState('')
    const [filtroStock, setFiltroStock] = useState('')

    const cargar = async () => {
        try {
            const [p, c] = await Promise.all([getProductos(), getCategorias()])
            setProductos(p.data || p)
            setCategorias(c.data || c)
        } catch (error) {
            console.error('Error cargando datos:', error)
        }
    }

    useEffect(() => { cargar() }, [])

    const productosFiltrados = productos.filter(p => {
        const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.sku || '').toLowerCase().includes(busqueda.toLowerCase())
        const matchCat = filtroCat ? p.categoria_id === Number(filtroCat) : true
        const matchStock = filtroStock === 'bajo'
            ? Number(p.stock_actual) <= Number(p.stock_minimo)
            : filtroStock === 'ok'
                ? Number(p.stock_actual) > Number(p.stock_minimo)
                : true
        return matchBusqueda && matchCat && matchStock
    })

    const abrirNuevo = () => {
        setForm(empty)
        setEditandoId(null)
        setShowModal(true)
    }

    const abrirEditar = (p) => {
        setForm({
            nombre: p.nombre,
            sku: p.sku || '',
            descripcion: p.descripcion || '',
            categoria_id: p.categoria_id,
            unidad: p.unidad || 'unidad',
            stock_actual: p.stock_actual || 0,
            stock_minimo: p.stock_minimo || 0,
            costo_unitario: p.costo_unitario || 0,
            ancho_rollo: p.ancho_rollo || 0,
            largo_rollo: p.largo_rollo || 30,
            factor_desperdicio: p.factor_desperdicio || 1.0,
            tipo_medida: p.tipo_medida || 'unidad',
            es_producto_base: p.es_producto_base !== false,
            producto_padre_id: p.producto_padre_id || null
        })
        setEditandoId(p.id)
        setShowModal(true)
    }

    const cerrarModal = () => {
        setShowModal(false)
        setEditandoId(null)
        setForm(empty)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (editandoId) {
                await updateProducto(editandoId, form)
            } else {
                await createProducto(form)
            }
            cerrarModal()
            await cargar()
        } catch (error) {
            console.error('Error guardando producto:', error)
            alert('Error al guardar: ' + (error.response?.data?.error || error.message))
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Desactivar este producto?')) return
        try {
            await deleteProducto(id)
            await cargar()
        } catch (error) {
            console.error('Error eliminando producto:', error)
            alert('Error al eliminar: ' + (error.response?.data?.error || error.message))
        }
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2>Productos</h2>
                <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo producto</button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarModal()}>
                    <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3>{editandoId ? 'Editar producto' : 'Nuevo producto'}</h3>
                            <button className="modal-close" onClick={cerrarModal}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                {/* Fila 1: Nombre y SKU */}
                                <div className="form-group">
                                    <label>Nombre *</label>
                                    <input 
                                        required 
                                        value={form.nombre}
                                        onChange={e => setForm({ ...form, nombre: e.target.value })} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>SKU</label>
                                    <input 
                                        value={form.sku}
                                        onChange={e => setForm({ ...form, sku: e.target.value })} 
                                    />
                                </div>

                                {/* Fila 2: Categoría */}
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Categoría *</label>
                                    <select 
                                        required 
                                        value={form.categoria_id}
                                        onChange={e => setForm({ ...form, categoria_id: e.target.value })}
                                    >
                                        <option value="">Seleccioná...</option>
                                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>

                                {/* Fila 3: Unidad de medida y Tipo de medida */}
                                <div className="form-group">
                                    <label>Unidad de medida</label>
                                    <select
                                        value={form.unidad}
                                        onChange={e => setForm({ ...form, unidad: e.target.value })}
                                    >
                                        <option value="unidad">Unidad</option>
                                        <option value="metros">Metros</option>
                                        <option value="metros_cuadrados">Metros Cuadrados (m²)</option>
                                        <option value="rollo">Rollo</option>
                                        <option value="caja">Caja</option>
                                        <option value="kg">Kilogramos</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Tipo de medida</label>
                                    <select
                                        value={form.tipo_medida}
                                        onChange={e => setForm({ ...form, tipo_medida: e.target.value })}
                                    >
                                        <option value="unidad">Unidad estándar</option>
                                        <option value="metros_cuadrados">Metros Cuadrados</option>
                                        <option value="metros">Metros Lineales</option>
                                    </select>
                                </div>

                                {/* Campos para telas (solo si tipo_medida es metros_cuadrados) */}
                                {form.tipo_medida === 'metros_cuadrados' && (
                                    <>
                                        <div className="form-group">
                                            <label>Ancho del rollo (m)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={form.ancho_rollo || ''}
                                                onChange={e => setForm({ ...form, ancho_rollo: parseFloat(e.target.value) || 0 })}
                                                placeholder="ej: 2.5"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Largo del rollo (m)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={form.largo_rollo || 30}
                                                onChange={e => setForm({ ...form, largo_rollo: parseFloat(e.target.value) || 30 })}
                                                placeholder="ej: 30"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Factor desperdicio</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="1.0"
                                                max="1.5"
                                                value={form.factor_desperdicio || 1.0}
                                                onChange={e => setForm({ ...form, factor_desperdicio: parseFloat(e.target.value) || 1.0 })}
                                                placeholder="ej: 1.1"
                                            />
                                            <small style={{ color: '#666' }}>
                                                Entre 1.0 (sin desperdicio) y 1.5 (máximo 50%)
                                            </small>
                                        </div>
                                        <div className="form-group">
                                            <label>¿Producto base?</label>
                                            <select
                                                value={form.es_producto_base ? 'si' : 'no'}
                                                onChange={e => setForm({ ...form, es_producto_base: e.target.value === 'si' })}
                                            >
                                                <option value="si">Sí (producto principal)</option>
                                                <option value="no">No (desperdicio/banda)</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* Fila 4: Stock */}
                                <div className="form-group">
                                    <label>Stock actual</label>
                                    <input 
                                        type="number" 
                                        value={form.stock_actual}
                                        onChange={e => setForm({ ...form, stock_actual: parseFloat(e.target.value) || 0 })} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stock mínimo</label>
                                    <input 
                                        type="number" 
                                        value={form.stock_minimo}
                                        onChange={e => setForm({ ...form, stock_minimo: parseFloat(e.target.value) || 0 })} 
                                    />
                                </div>

                                {/* Fila 5: Costo unitario */}
                                <div className="form-group">
                                    <label>Costo unitario ($)</label>
                                    <input 
                                        type="number" 
                                        value={form.costo_unitario}
                                        onChange={e => setForm({ ...form, costo_unitario: parseFloat(e.target.value) || 0 })} 
                                    />
                                </div>

                                {/* Fila 6: Descripción */}
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Descripción</label>
                                    <input 
                                        value={form.descripcion}
                                        onChange={e => setForm({ ...form, descripcion: e.target.value })} 
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                <button className="btn btn-primary" type="submit" disabled={loading}>
                                    {loading ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear producto'}
                                </button>
                                <button 
                                    className="btn" 
                                    type="button"
                                    style={{ background: '#f0ede8', color: '#6b6560' }} 
                                    onClick={cerrarModal}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="card" style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 2, minWidth: 180 }}>
                        <label>Buscar</label>
                        <input 
                            placeholder="Nombre o SKU..."
                            value={busqueda} 
                            onChange={e => setBusqueda(e.target.value)} 
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                        <label>Categoría</label>
                        <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
                            <option value="">Todas</option>
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 130 }}>
                        <label>Stock</label>
                        <select value={filtroStock} onChange={e => setFiltroStock(e.target.value)}>
                            <option value="">Todos</option>
                            <option value="ok">Stock normal</option>
                            <option value="bajo">Stock bajo</option>
                        </select>
                    </div>
                    {(busqueda || filtroCat || filtroStock) && (
                        <button 
                            className="btn" 
                            style={{ background: '#f0ede8', color: '#6b6560', marginBottom: 1 }}
                            onClick={() => { setBusqueda(''); setFiltroCat(''); setFiltroStock('') }}
                        >
                            Limpiar
                        </button>
                    )}
                </div>
                <div style={{ fontSize: 13, color: '#8a8279', marginTop: 8 }}>
                    Mostrando {productosFiltrados.length} de {productos.length} productos
                </div>
            </div>

            {/* Tabla */}
            <div className="card">
                <table className="tabla-productos">
                    <thead>
                        <tr>
                            <th>PRODUCTO</th>
                            <th>ANCHO</th>
                            <th>STOCK</th>
                            <th>UNIDAD</th>
                            <th>MÍNIMO</th>
                            <th>DESPERDICIO</th>
                            <th>ESTADO</th>
                            <th>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosFiltrados.map(p => (
                            <tr key={p.id} style={{
                                opacity: p.es_producto_base ? 1 : 0.6,
                                fontStyle: !p.es_producto_base ? 'italic' : 'normal'
                            }}>
                                <td>
                                    <div>{p.nombre}</div>
                                    {!p.es_producto_base && (
                                        <small style={{ color: '#999' }}>
                                            (Subproducto)
                                        </small>
                                    )}
                                </td>
                                <td>{p.ancho_rollo ? `${p.ancho_rollo}m` : '-'}</td>
                                <td style={{ fontWeight: 'bold' }}>
                                    {p.stock_actual}
                                    {p.tipo_medida === 'metros_cuadrados' ? ' m²' : p.unidad ? ` ${p.unidad}` : ''}
                                </td>
                                <td>{p.tipo_medida || p.unidad}</td>
                                <td>{p.stock_minimo}</td>
                                <td>
                                    {p.factor_desperdicio ? `${((p.factor_desperdicio - 1) * 100).toFixed(0)}%` : '-'}
                                </td>
                                <td>
                                    {p.stock_actual <= p.stock_minimo ?
                                        <span style={{
                                            backgroundColor: '#fee',
                                            color: '#c33',
                                            padding: '2px 6px',
                                            borderRadius: '3px',
                                            fontSize: '0.85em',
                                            fontWeight: 'bold'
                                        }}>BAJO</span>
                                        : <span style={{
                                            backgroundColor: '#efe',
                                            color: '#3c3',
                                            padding: '2px 6px',
                                            borderRadius: '3px',
                                            fontSize: '0.85em'
                                        }}>OK</span>
                                    }
                                </td>
                                <td style={{ display: 'flex', gap: 4 }}>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => abrirEditar(p)}
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    {p.es_producto_base && (
                                        <button
                                            className="btn btn-sm"
                                            title="Registrar corte"
                                            style={{
                                                backgroundColor: '#e8650a',
                                                color: 'white',
                                                border: 'none',
                                                padding: '4px 8px',
                                                borderRadius: '3px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🔪
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDelete(p.id)}
                                        title="Desactivar"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}