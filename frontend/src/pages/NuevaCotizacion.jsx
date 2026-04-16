import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    getClientes, createCliente, getTiposCortina,
    getMecanismos, calcularItem, createCotizacion, getProductos
} from '../services/api'

const itemVacio = {
    descripcion: '', tipo_cortina_id: '', tipo_cortina: '',
    ancho: '', alto: '', tipo_tela: '', precio_tela_m2: '',
    mecanismo_id: '', mecanismo: '', calculo: null
}

export default function NuevaCotizacion() {
    const navigate = useNavigate()
    const [clientes, setClientes] = useState([])
    const [tipos, setTipos] = useState([])
    const [mecanismos, setMecanismos] = useState([])
    const [telas, setTelas] = useState([])
    const [clienteId, setClienteId] = useState('')
    const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', direccion: '' })
    const [modoCliente, setModoCliente] = useState('existente')
    const [margen, setMargen] = useState(30)
    const [notas, setNotas] = useState('')
    const [items, setItems] = useState([{ ...itemVacio }])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        Promise.all([getClientes(), getTiposCortina(), getMecanismos(), getProductos()])
            .then(([c, t, m, p]) => {
                setClientes(c.data)
                setTipos(t.data)
                setMecanismos(m.data)
                setTelas(p.data.filter(x => x.categorias?.nombre === 'Telas'))
            })
    }, [])

    const actualizarItem = (idx, campo, valor) => {
        setItems(prev => prev.map((it, i) =>
            i === idx ? { ...it, [campo]: valor, calculo: null } : it
        ))
    }

    // Cuando se selecciona una tela, autocompleta el precio
    const seleccionarTela = (idx, nombreTela) => {
        const telaSeleccionada = telas.find(t => t.nombre === nombreTela)
        setItems(prev => prev.map((it, i) =>
            i === idx ? {
                ...it,
                tipo_tela: nombreTela,
                precio_tela_m2: telaSeleccionada ? telaSeleccionada.costo_unitario : it.precio_tela_m2,
                calculo: null
            } : it
        ))
    }

    const calcular = async (idx) => {
        const it = items[idx]
        if (!it.ancho || !it.alto || !it.tipo_cortina_id || !it.mecanismo_id || !it.precio_tela_m2) {
            alert('Completá ancho, alto, tipo, mecanismo y precio de tela para calcular')
            return
        }
        const { data } = await calcularItem({
            ancho: +it.ancho,
            alto: +it.alto,
            tipo_cortina_id: +it.tipo_cortina_id,
            precio_tela_m2: +it.precio_tela_m2,
            mecanismo_id: +it.mecanismo_id,
            margen: +margen,
        })
        setItems(prev => prev.map((x, i) =>
            i === idx ? {
                ...x,
                calculo: data,
                tipo_cortina: data.tipo_cortina,
                mecanismo: data.mecanismo,
                cantidad_tela: data.cantidad_tela,
                precio_tela: data.precio_tela,
                precio_mecanismo: data.precio_mecanismo,
                mano_obra: data.mano_obra,
                subtotal: data.subtotal,
                precio_final: data.precio_final,
            } : x
        ))
    }

    const agregarItem = () => setItems(prev => [...prev, { ...itemVacio }])
    const quitarItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))
    const total = items.reduce((s, i) => s + (i.precio_final || 0), 0)

    const guardar = async () => {
        if (!items.every(i => i.calculo)) {
            alert('Calculá el precio de todos los items antes de guardar')
            return
        }
        setLoading(true)
        try {
            let cid = clienteId
            if (modoCliente === 'nuevo') {
                const { data } = await createCliente(nuevoCliente)
                cid = data.id
            }
            if (!cid) { alert('Seleccioná o creá un cliente'); setLoading(false); return }
            await createCotizacion({ cliente_id: cid, margen, notas, items })
            navigate('/cotizaciones')
        } catch (err) {
            alert('Error al guardar: ' + err.message)
        }
        setLoading(false)
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2>Nueva cotización</h2>
                <button className="btn" style={{ background: '#6b7280', color: 'white' }}
                    onClick={() => navigate('/cotizaciones')}>
                    ← Volver
                </button>
            </div>

            {/* Cliente */}
            <div className="card">
                <h3 style={{ marginBottom: 16, fontSize: 16 }}>Datos del cliente</h3>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <button className={`btn ${modoCliente === 'existente' ? 'btn-primary' : ''}`}
                        onClick={() => setModoCliente('existente')}>Cliente existente</button>
                    <button className={`btn ${modoCliente === 'nuevo' ? 'btn-primary' : ''}`}
                        onClick={() => setModoCliente('nuevo')}>Nuevo cliente</button>
                </div>
                {modoCliente === 'existente' ? (
                    <div className="form-group" style={{ maxWidth: 320 }}>
                        <label>Seleccioná cliente</label>
                        <select value={clienteId} onChange={e => setClienteId(e.target.value)}>
                            <option value="">Seleccioná...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.telefono}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre *</label>
                            <input value={nuevoCliente.nombre}
                                onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input value={nuevoCliente.telefono}
                                onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Dirección</label>
                            <input value={nuevoCliente.direccion}
                                onChange={e => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })} />
                        </div>
                    </div>
                )}
            </div>

            {/* Margen global */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <label style={{ fontWeight: 500 }}>Margen de ganancia:</label>
                    <input type="number" value={margen} min={0} max={200}
                        onChange={e => setMargen(+e.target.value)}
                        style={{ width: 80, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 8 }} />
                    <span style={{ color: '#6b7280' }}>%</span>
                </div>
            </div>

            {/* Items */}
            {items.map((it, idx) => (
                <div className="card" key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15 }}>Cortina #{idx + 1}</h3>
                        {items.length > 1 &&
                            <button className="btn btn-danger" onClick={() => quitarItem(idx)}>Quitar</button>}
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Descripción</label>
                            <input placeholder="Ej: Ventana living" value={it.descripcion}
                                onChange={e => actualizarItem(idx, 'descripcion', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Tipo de cortina *</label>
                            <select value={it.tipo_cortina_id}
                                onChange={e => actualizarItem(idx, 'tipo_cortina_id', e.target.value)}>
                                <option value="">Seleccioná...</option>
                                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Ancho (m) *</label>
                            <input type="number" step="0.01" placeholder="1.20" value={it.ancho}
                                onChange={e => actualizarItem(idx, 'ancho', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Alto (m) *</label>
                            <input type="number" step="0.01" placeholder="1.50" value={it.alto}
                                onChange={e => actualizarItem(idx, 'alto', e.target.value)} />
                        </div>

                        {/* Tela con autocompletado */}
                        <div className="form-group">
                            <label>Tipo de tela</label>
                            <select value={it.tipo_tela}
                                onChange={e => seleccionarTela(idx, e.target.value)}>
                                <option value="">Seleccioná...</option>
                                {telas.map(t => (
                                    <option key={t.id} value={t.nombre}>
                                        {t.nombre} — ${Number(t.costo_unitario).toLocaleString('es-AR')}/m²
                                    </option>
                                ))}
                                <option value="otra">Otra</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>
                                Precio tela ($/m²) *
                                {it.tipo_tela && it.tipo_tela !== 'otra' && (
                                    <span style={{ fontSize: 11, color: '#16a34a', marginLeft: 6, fontWeight: 400 }}>
                                        ✓ autocompletado
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                placeholder="800"
                                value={it.precio_tela_m2}
                                onChange={e => actualizarItem(idx, 'precio_tela_m2', e.target.value)}
                                style={{
                                    background: it.tipo_tela && it.tipo_tela !== 'otra' ? '#f0fdf4' : 'white',
                                    border: it.tipo_tela && it.tipo_tela !== 'otra'
                                        ? '1px solid #86efac'
                                        : '1px solid #d1d5db'
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Mecanismo *</label>
                            <select value={it.mecanismo_id}
                                onChange={e => actualizarItem(idx, 'mecanismo_id', e.target.value)}>
                                <option value="">Seleccioná...</option>
                                {mecanismos.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.nombre} — ${Number(m.precio).toLocaleString('es-AR')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button className="btn btn-success" onClick={() => calcular(idx)}>
                        Calcular precio
                    </button>

                    {it.calculo && (
                        <div style={{ marginTop: 16, background: '#f0fdf4', borderRadius: 8, padding: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
                                {[
                                    ['Área', `${it.calculo.area} m²`],
                                    ['Tela necesaria', `${it.calculo.cantidad_tela} m²`],
                                    ['Costo tela', `$${it.calculo.precio_tela.toLocaleString('es-AR')}`],
                                    ['Mecanismo', `$${it.calculo.precio_mecanismo.toLocaleString('es-AR')}`],
                                    ['Subtotal', `$${it.calculo.subtotal.toLocaleString('es-AR')}`],
                                ].map(([k, v]) => (
                                    <div key={k}>
                                        <div style={{ fontSize: 12, color: '#6b7280' }}>{k}</div>
                                        <div style={{ fontWeight: 500 }}>{v}</div>
                                    </div>
                                ))}
                                <div>
                                    <div style={{ fontSize: 12, color: '#166534' }}>Precio final</div>
                                    <div style={{ fontWeight: 700, fontSize: 18, color: '#166534' }}>
                                        ${it.calculo.precio_final.toLocaleString('es-AR')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            <button className="btn" style={{ background: '#e5e7eb', marginBottom: 24 }}
                onClick={agregarItem}>
                + Agregar otra cortina
            </button>

            {/* Resumen y notas */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="form-group" style={{ flex: 1, marginRight: 32 }}>
                        <label>Notas internas</label>
                        <textarea rows={3} value={notas}
                            onChange={e => setNotas(e.target.value)}
                            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical' }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>Total cotización</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#1e293b' }}>
                            ${total.toLocaleString('es-AR')}
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={guardar} disabled={loading}
                        style={{ fontSize: 15, padding: '10px 28px' }}>
                        {loading ? 'Guardando...' : 'Guardar cotización'}
                    </button>
                </div>
            </div>
        </>
    )
}