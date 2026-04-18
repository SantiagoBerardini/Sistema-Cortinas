import { useState } from 'react'
import { registrarCorte } from '../services/api'

export default function RegistrarCorte({ producto, onClose }) {
    const [form, setForm] = useState({
        alto_cortina: '',
        ancho_cortina: '',
        cantidad: 1,
        incluir_bandas: false,
        notas: ''
    })
    const [loading, setLoading] = useState(false)
    const [resultado, setResultado] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const response = await registrarCorte(producto.id, form)
            setResultado(response.data)
        } catch (error) {
            alert('Error: ' + (error.response?.data?.error || error.message))
        } finally {
            setLoading(false)
        }
    }

    if (resultado) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>✅ Corte Registrado</h3>
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>
                    <div className="modal-body" style={{ padding: '20px' }}>
                        <table style={{ width: '100%', marginBottom: '20px' }}>
                            <tbody>
                                <tr><td style={{ fontWeight: 'bold' }}>Cortinas cortadas:</td><td>{resultado.resumen.cortinas_cortadas}</td></tr>
                                <tr style={{ backgroundColor: '#f5f5f5' }}><td style={{ fontWeight: 'bold' }}>m² de tela utilizada:</td><td style={{ color: '#d9534f', fontWeight: 'bold' }}>{resultado.resumen.m2_tela_utilizada} m²</td></tr>
                                <tr><td style={{ fontWeight: 'bold' }}>m² desperdicio generado:</td><td style={{ color: '#f0ad4e' }}>{resultado.resumen.m2_desperdicio_generado} m²</td></tr>
                                {resultado.resumen.m2_bandas_generadas > 0 && (<tr style={{ backgroundColor: '#f5f5f5' }}><td style={{ fontWeight: 'bold' }}>m² bandas generadas:</td><td style={{ color: '#5cb85c' }}>{resultado.resumen.m2_bandas_generadas} m²</td></tr>)}
                                <tr><td style={{ fontWeight: 'bold' }}>Stock anterior:</td><td>{resultado.resumen.stock_anterior} m²</td></tr>
                                <tr style={{ backgroundColor: '#efe', fontWeight: 'bold' }}><td>Stock nuevo:</td><td>{resultado.resumen.stock_nuevo} m²</td></tr>
                            </tbody>
                        </table>
                        <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Cerrar</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>🔪 Registrar Corte - {producto.nombre}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label>Alto de cortina (m) *</label>
                            <input type="number" step="0.01" value={form.alto_cortina} onChange={e => setForm({ ...form, alto_cortina: e.target.value })} placeholder="ej: 2.20" required />
                        </div>
                        <div>
                            <label>Ancho de cortina (m) *</label>
                            <input type="number" step="0.01" value={form.ancho_cortina} onChange={e => setForm({ ...form, ancho_cortina: e.target.value })} placeholder="ej: 2.50" required />
                        </div>
                        <div>
                            <label>Cantidad de cortinas</label>
                            <input type="number" min="1" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: Number(e.target.value) || 1 })} />
                        </div>
                        <div>
                            <label><input type="checkbox" checked={form.incluir_bandas} onChange={e => setForm({ ...form, incluir_bandas: e.target.checked })} />&nbsp;Incluir bandas verticales (9cm)</label>
                        </div>
                    </div>
                    <div>
                        <label>Notas</label>
                        <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Notas opcionales sobre este corte" rows="3" />
                    </div>
                    <div style={{ backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '4px', marginBottom: '12px', fontSize: '0.9em' }}>
                        <p><strong>Estimación:</strong></p>
                        {form.alto_cortina && form.ancho_cortina && (
                            <>
                                <p>• Área cortina: {(Number(form.alto_cortina) * Number(form.ancho_cortina)).toFixed(2)} m²</p>
                                <p>• Tela a usar (c/ factor {producto.factor_desperdicio || 1.1}): <strong>{(Number(form.alto_cortina) * Number(form.ancho_cortina) * (producto.factor_desperdicio || 1.1) * form.cantidad).toFixed(2)} m²</strong></p>
                            </>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '⏳ Registrando...' : '✅ Registrar corte'}</button>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
