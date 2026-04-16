import { useEffect, useState } from 'react'
import {
    getCategorias, createCategoria, updateCategoria, deleteCategoria,
    getAllMecanismos, createMecanismo, updateMecanismo,
    getAllTiposCortina, createTipoCortina, updateTipoCortina,
} from '../services/api'

// ── Componente de sección reutilizable ──────────────
function Seccion({ titulo, children }) {
    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{
                fontSize: 16, fontWeight: 600, marginBottom: 20, paddingBottom: 12,
                borderBottom: '1px solid #f3f4f6'
            }}>{titulo}</h3>
            {children}
        </div>
    )
}

// ── Fila editable genérica ───────────────────────────
function FilaEditable({ item, campos, onGuardar, onEliminar, colorDesactivado }) {
    const [editando, setEditando] = useState(false)
    const [form, setForm] = useState(item)

    const guardar = async () => {
        await onGuardar(item.id, form)
        setEditando(false)
    }

    if (!editando) return (
        <tr style={{ opacity: item.activo === false ? 0.45 : 1 }}>
            {campos.map(c => (
                <td key={c.key}>
                    {c.tipo === 'boolean'
                        ? <span className={`badge ${item[c.key] ? 'badge-ok' : 'badge-danger'}`}>
                            {item[c.key] ? 'Activo' : 'Inactivo'}
                        </span>
                        : c.prefix
                            ? `${c.prefix}${Number(item[c.key]).toLocaleString('es-AR')}`
                            : item[c.key]}
                </td>
            ))}
            <td style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary" onClick={() => { setForm(item); setEditando(true) }}>
                    Editar
                </button>
                {onEliminar && (
                    <button className="btn btn-danger" onClick={() => onEliminar(item.id)}>
                        Eliminar
                    </button>
                )}
            </td>
        </tr>
    )

    return (
        <tr style={{ background: '#f8faff' }}>
            {campos.map(c => (
                <td key={c.key}>
                    {c.tipo === 'boolean' ? (
                        <select value={form[c.key]} onChange={e => setForm({ ...form, [c.key]: e.target.value === 'true' })}
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}>
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                        </select>
                    ) : (
                        <input type={c.tipo || 'text'} value={form[c.key] ?? ''}
                            onChange={e => setForm({ ...form, [c.key]: e.target.value })}
                            style={{
                                padding: '4px 8px', borderRadius: 6, border: '1px solid #3b82f6',
                                fontSize: 13, width: c.ancho || '100%'
                            }} />
                    )}
                </td>
            ))}
            <td style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-success" onClick={guardar}>Guardar</button>
                <button className="btn" style={{ background: '#e5e7eb' }} onClick={() => setEditando(false)}>
                    Cancelar
                </button>
            </td>
        </tr>
    )
}

// ── Formulario de nuevo item ─────────────────────────
function FormNuevo({ campos, onGuardar, placeholder }) {
    const inicial = campos.reduce((o, c) => ({ ...o, [c.key]: c.default ?? '' }), {})
    const [form, setForm] = useState(inicial)
    const [abierto, setAbierto] = useState(false)
    const [loading, setLoading] = useState(false)

    const guardar = async () => {
        if (!form[campos[0].key]) return
        setLoading(true)
        await onGuardar(form)
        setForm(inicial)
        setAbierto(false)
        setLoading(false)
    }

    if (!abierto) return (
        <button className="btn btn-primary" style={{ marginTop: 12 }}
            onClick={() => setAbierto(true)}>
            + Agregar nuevo
        </button>
    )

    return (
        <div style={{
            marginTop: 16, padding: 16, background: '#f0f9ff',
            borderRadius: 8, border: '1px solid #bae6fd'
        }}>
            <div className="form-grid">
                {campos.map(c => (
                    <div className="form-group" key={c.key}>
                        <label>{c.label}</label>
                        <input type={c.tipo || 'text'} placeholder={c.placeholder || ''}
                            value={form[c.key]}
                            onChange={e => setForm({ ...form, [c.key]: e.target.value })} />
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-success" onClick={guardar} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button className="btn" style={{ background: '#e5e7eb' }}
                    onClick={() => setAbierto(false)}>Cancelar</button>
            </div>
        </div>
    )
}

// ── Página principal ─────────────────────────────────
export default function Configuracion() {
    const [categorias, setCategorias] = useState([])
    const [mecanismos, setMecanismos] = useState([])
    const [tipos, setTipos] = useState([])

    const cargar = async () => {
        const [c, m, t] = await Promise.all([
            getCategorias(), getAllMecanismos(), getAllTiposCortina()
        ])
        setCategorias(c.data)
        setMecanismos(m.data)
        setTipos(t.data)
    }

    useEffect(() => { cargar() }, [])

    // Categorías
    const guardarCategoria = async (id, d) => { await updateCategoria(id, d); await cargar() }
    const nuevaCategoria = async (d) => { await createCategoria(d); await cargar() }
    const eliminarCategoria = async (id) => {
        if (!confirm('¿Eliminar esta categoría? Solo funcionará si no tiene productos asociados.')) return
        await deleteCategoria(id); await cargar()
    }

    // Mecanismos
    const guardarMecanismo = async (id, d) => { await updateMecanismo(id, d); await cargar() }
    const nuevoMecanismo = async (d) => { await createMecanismo(d); await cargar() }

    // Tipos de cortina
    const guardarTipo = async (id, d) => { await updateTipoCortina(id, d); await cargar() }
    const nuevoTipo = async (d) => { await createTipoCortina(d); await cargar() }

    return (
        <>
            <h2>Configuración</h2>

            {/* Categorías */}
            <Seccion titulo="Categorías de productos">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {categorias.map(c => (
                            <FilaEditable key={c.id} item={c}
                                campos={[
                                    { key: 'nombre', label: 'Nombre' },
                                    { key: 'descripcion', label: 'Descripción' },
                                ]}
                                onGuardar={guardarCategoria}
                                onEliminar={eliminarCategoria}
                            />
                        ))}
                    </tbody>
                </table>
                <FormNuevo
                    campos={[
                        { key: 'nombre', label: 'Nombre', placeholder: 'Ej: Rieles especiales' },
                        { key: 'descripcion', label: 'Descripción', placeholder: 'Descripción opcional' },
                    ]}
                    onGuardar={nuevaCategoria}
                />
            </Seccion>

            {/* Mecanismos */}
            <Seccion titulo="Mecanismos y sistemas">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Precio ($)</th>
                            <th>Estado</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {mecanismos.map(m => (
                            <FilaEditable key={m.id} item={m}
                                campos={[
                                    { key: 'nombre', label: 'Nombre' },
                                    { key: 'precio', label: 'Precio', tipo: 'number', prefix: '$', ancho: 100 },
                                    { key: 'activo', label: 'Estado', tipo: 'boolean' },
                                ]}
                                onGuardar={guardarMecanismo}
                            />
                        ))}
                    </tbody>
                </table>
                <FormNuevo
                    campos={[
                        { key: 'nombre', label: 'Nombre', placeholder: 'Ej: Motor inalámbrico' },
                        { key: 'precio', label: 'Precio $', placeholder: '0', tipo: 'number', default: 0 },
                    ]}
                    onGuardar={nuevoMecanismo}
                />
            </Seccion>

            {/* Tipos de cortina */}
            <Seccion titulo="Tipos de cortina">
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                    El factor de desperdicio indica cuánta tela extra se necesita (1.10 = 10% extra).
                    La mano de obra es el costo fijo de instalación por cortina.
                </p>
                <table>
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Factor desperdicio</th>
                            <th>Mano de obra ($)</th>
                            <th>Estado</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tipos.map(t => (
                            <FilaEditable key={t.id} item={t}
                                campos={[
                                    { key: 'nombre', label: 'Tipo' },
                                    { key: 'factor_desperdicio', label: 'Factor', tipo: 'number', ancho: 80 },
                                    { key: 'precio_mano_obra', label: 'Mano de obra', tipo: 'number', prefix: '$', ancho: 100 },
                                    { key: 'activo', label: 'Estado', tipo: 'boolean' },
                                ]}
                                onGuardar={guardarTipo}
                            />
                        ))}
                    </tbody>
                </table>
                <FormNuevo
                    campos={[
                        { key: 'nombre', label: 'Nombre', placeholder: 'Ej: Cortina romana' },
                        { key: 'factor_desperdicio', label: 'Factor desperdicio', placeholder: '1.10', tipo: 'number', default: 1.10 },
                        { key: 'precio_mano_obra', label: 'Mano de obra ($)', placeholder: '0', tipo: 'number', default: 0 },
                    ]}
                    onGuardar={nuevoTipo}
                />
            </Seccion>
        </>
    )
}