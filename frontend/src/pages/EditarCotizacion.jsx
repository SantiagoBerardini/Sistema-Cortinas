import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    getCotizacionById, updateCotizacion,
    getTiposCortina, getMecanismos, getProductos,
    calcularItem
} from '../services/api'

export default function EditarCotizacion() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [tipos, setTipos] = useState([])
    const [mecanismos, setMecanismos] = useState([])
    const [telas, setTelas] = useState([])
    const [margen, setMargen] = useState(30)
    const [notas, setNotas] = useState('')
    const [estado, setEstado] = useState('borrador')
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        Promise.all([
            getCotizacionById(id),
            getTiposCortina(),
            getMecanismos(),
            getProductos()
        ]).then(([cot, t, m, p]) => {
            const c = cot.data
            setMargen(c.margen)
            setNotas(c.notas || '')
            setEstado(c.estado)
            setTipos(t.data)
            setMecanismos(m.data)
            setTelas(p.data.filter(x => x.categorias?.nombre === 'Telas'))

            // Mapear items existentes al formato del formulario
            setItems(c.items_cotizacion.map(i => ({
                descripcion: i.descripcion,
                tipo_cortina_id: '',
                tipo_cortina: i.tipo_cortina,
                ancho: i.ancho,
                alto: i.alto,
                tipo_tela: i.tipo_tela,
                precio_tela_m2: i.precio_tela > 0 && i.cantidad_tela > 0
                    ? (i.precio_tela / i.cantidad_tela).toFixed(2)
                    : 0,
                mecanismo_id: '',
                mecanismo: i.mecanismo,
                cantidad_tela: i.cantidad_tela,
                precio_tela: i.precio_tela,
                precio_mecanismo: i.precio_mecanismo,
                mano_obra: i.mano_obra,
                subtotal: i.subtotal,
                precio_final: i.precio_final,
                calculo: {
                    area: +(i.ancho * i.alto).toFixed(2),
                    cantidad_tela: i.cantidad_tela,
                    precio_tela: i.precio_tela,
                    precio_mecanismo: i.precio_mecanismo,
                    mano_obra: i.mano_obra,
                    subtotal: i.subtotal,
                    precio_final: i.precio_final,
                    tipo_cortina: i.tipo_cortina,
                    mecanismo: i.mecanismo,
                }
            })))
            setCargando(false)
        })
    }, [id])

    const actualizarItem = (idx, campo, valor) => {
        setItems(prev => prev.map((it, i) =>
            i === idx ? { ...it, [campo]: valor, calculo: null } : it
        ))
    }

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
            alert('Para recalcular seleccioná el tipo de cortina y mecanismo de las listas')
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

    const agregarItem = () => setItems(prev => [...prev, {
        descripcion: '', tipo_cortina_id: '', tipo_cortina: '',
        ancho: '', alto: '', tipo_tela: '', precio_tela_m2: '',
        mecanismo_id: '', mecanismo: '', calculo: null
    }])

    const quitarItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

    const total = items.reduce((s, i) => s + (Number(i.precio_final) || 0), 0)

    const guardar = async () => {
        if (!items.every(i => i.calculo)) {
            alert('Hay items sin calcular. Revisá que todos tengan precio final.')
            return
        }
        setLoading(true)
        try {
            await updateCotizacion(id, { margen, notas, estado, items })
            navigate(`/cotizaciones/${id}`)
        } catch (err) {
            alert('Error al guardar: ' + err.message)
        }
        setLoading(false)
    }

    if (cargando) return <p style={{ padding: 32 }}>Cargando cotización...</p>

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2>Editar cotización #{id}</h2>
                <button className="btn" style={{ background: '#6b7280', color: 'white' }}
                    onClick={() => navigate(`/cotizaciones/${id}`)}>
                    ← Volver
                </button>
            </div>

            {/* Estado y margen */}
            <div className="card">
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group">
                        <label>Estado</label>
                        <select value={estado} onChange={e => setEstado(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}>
                            <option value="borrador">Borrador</option>
                            <option value="enviada">Enviada</option>
                            <option value="aprobada">Aprobada</option>
                            <option value="rechazada">Rechazada</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <label style={{ fontWeight: 500 }}>Margen:</label>
                        <input type="number" value={margen} min={0} max={200}
                            onChange={e => setMargen(+e.target.value)}
                            style={{ width: 80, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 8 }} />
                        <span style={{ color: '#6b7280' }}>%</span>
                    </div>
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
                            <input value={it.descripcion}
                                onChange={e => actualizarItem(idx, 'descripcion', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Tipo de cortina</label>
                            <select value={it.tipo_cortina_id}
                                onChange={e => actualizarItem(idx, 'tipo_cortina_id', e.target.value)}>
                                <option value="">— {it.tipo_cortina} (seleccioná para recalcular)</option>
                                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Ancho (m)</label>
                            <input type="number" step="0.01" value={it.ancho}
                                onChange={e => actualizarItem(idx, 'ancho', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Alto (m)</label>
                            <input type="number" step="0.01" value={it.alto}
                                onChange={e => actualizarItem(idx, 'alto', e.target.value)} />
                        </div>
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
                                Precio tela ($/m²)
                                {it.tipo_tela && it.tipo_tela !== 'otra' && (
                                    <span style={{ fontSize: 11, color: '#16a34a', marginLeft: 6, fontWeight: 400 }}>
                                        ✓ autocompletado
                                    </span>
                                )}
                            </label>
                            <input type="number" value={it.precio_tela_m2}
                                onChange={e => actualizarItem(idx, 'precio_tela_m2', e.target.value)}
                                style={{
                                    background: it.tipo_tela && it.tipo_tela !== 'otra' ? '#f0fdf4' : 'white',
                                    border: it.tipo_tela && it.tipo_tela !== 'otra'
                                        ? '1px solid #86efac' : '1px solid #d1d5db'
                                }} />
                        </div>
                        <div className="form-group">
                            <label>Mecanismo</label>
                            <select value={it.mecanismo_id}
                                onChange={e => actualizarItem(idx, 'mecanismo_id', e.target.value)}>
                                <option value="">— {it.mecanismo} (seleccioná para recalcular)</option>
                                {mecanismos.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.nombre} — ${Number(m.precio).toLocaleString('es-AR')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button className="btn btn-success" onClick={() => calcular(idx)}>
                        Recalcular precio
                    </button>

                    {it.calculo && (
                        <div style={{ marginTop: 16, background: '#f0fdf4', borderRadius: 8, padding: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
                                {[
                                    ['Área', `${it.calculo.area} m²`],
                                    ['Tela necesaria', `${it.calculo.cantidad_tela} m²`],
                                    ['Costo tela', `$${Number(it.calculo.precio_tela).toLocaleString('es-AR')}`],
                                    ['Mecanismo', `$${Number(it.calculo.precio_mecanismo).toLocaleString('es-AR')}`],
                                    ['Subtotal', `$${Number(it.calculo.subtotal).toLocaleString('es-AR')}`],
                                ].map(([k, v]) => (
                                    <div key={k}>
                                        <div style={{ fontSize: 12, color: '#6b7280' }}>{k}</div>
                                        <div style={{ fontWeight: 500 }}>{v}</div>
                                    </div>
                                ))}
                                <div>
                                    <div style={{ fontSize: 12, color: '#166534' }}>Precio final</div>
                                    <div style={{ fontWeight: 700, fontSize: 18, color: '#166534' }}>
                                        ${Number(it.calculo.precio_final).toLocaleString('es-AR')}
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

            {/* Notas y total */}
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
                        {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </>
    )
}