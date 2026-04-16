const router = require('express').Router();
const productos = require('../controllers/productos.controller');
const movimientos = require('../controllers/movimientos.controller');
const supabase = require('../config/db');

router.get('/categorias', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .order('nombre');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/alertas/stock-bajo', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('productos')
            .select('*, categorias(nombre)')
            .eq('activo', true);
        if (error) throw error;
        // Filtrar en JS porque Supabase no permite comparar dos columnas directamente
        const alertas = data.filter(p => Number(p.stock_actual) <= Number(p.stock_minimo));
        res.json(alertas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/productos', productos.getAll);
router.get('/productos/:id', productos.getById);
router.post('/productos', productos.create);
router.put('/productos/:id', productos.update);
router.delete('/productos/:id', productos.remove);

// Rutas de productos (agregar al final de las rutas de productos)
router.get('/productos/:id/precios-tela', productos.getPreciosTela);
router.post('/productos/:id/registrar-corte', productos.registrarCorte);
router.post('/productos/:id/convertir-unidad', productos.convertirUnidad);

router.get('/movimientos', movimientos.getAll);
router.post('/movimientos', movimientos.create);

const cotizaciones = require('../controllers/cotizaciones.controller');

// Clientes
router.get('/clientes', cotizaciones.getClientes);
router.post('/clientes', cotizaciones.createCliente);

// Configuración
router.get('/tipos-cortina', cotizaciones.getTipos);
router.get('/mecanismos', cotizaciones.getMecanismos);



// ── Configuración — Mecanismos ─────────────────────
router.post('/mecanismos', async (req, res) => {
    try {
        const { nombre, precio } = req.body;
        const { data, error } = await supabase
            .from('mecanismos')
            .insert([{ nombre, precio: Number(precio) }])
            .select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/mecanismos/:id', async (req, res) => {
    try {
        const { nombre, precio, activo } = req.body;
        const { error } = await supabase
            .from('mecanismos')
            .update({ nombre, precio: Number(precio), activo })
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ mensaje: 'Mecanismo actualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Configuración — Tipos de cortina ──────────────
router.post('/tipos-cortina', async (req, res) => {
    try {
        const { nombre, factor_desperdicio, precio_mano_obra } = req.body;
        const { data, error } = await supabase
            .from('tipos_cortina')
            .insert([{ nombre, factor_desperdicio: Number(factor_desperdicio), precio_mano_obra: Number(precio_mano_obra) }])
            .select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/tipos-cortina/:id', async (req, res) => {
    try {
        const { nombre, factor_desperdicio, precio_mano_obra, activo } = req.body;
        const { error } = await supabase
            .from('tipos_cortina')
            .update({ nombre, factor_desperdicio: Number(factor_desperdicio), precio_mano_obra: Number(precio_mano_obra), activo })
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ mensaje: 'Tipo actualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Configuración — Categorías ────────────────────
router.post('/categorias', async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const { data, error } = await supabase
            .from('categorias')
            .insert([{ nombre, descripcion }])
            .select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/categorias/:id', async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const { error } = await supabase
            .from('categorias')
            .update({ nombre, descripcion })
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ mensaje: 'Categoría actualizada' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/categorias/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('categorias')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ mensaje: 'Categoría eliminada' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Motor de cálculo
router.post('/cotizaciones/calcular-item', cotizaciones.calcularItem);

// Cotizaciones
router.get('/cotizaciones', cotizaciones.getCotizaciones);
router.post('/cotizaciones', cotizaciones.createCotizacion);
router.get('/cotizaciones/:id', cotizaciones.getCotizacionById);
router.put('/cotizaciones/:id/estado', cotizaciones.updateEstado);
router.put('/cotizaciones/:id', async (req, res) => {
    const { margen, notas, estado, items } = req.body;
    try {
        const total = items.reduce((sum, i) => sum + (Number(i.precio_final) || 0), 0);

        const { error: errCot } = await supabase
            .from('cotizaciones')
            .update({ margen: Number(margen), notas, estado, total })
            .eq('id', req.params.id);
        if (errCot) throw errCot;

        // Borrar items anteriores y reinsertar
        const { error: errDel } = await supabase
            .from('items_cotizacion')
            .delete()
            .eq('cotizacion_id', req.params.id);
        if (errDel) throw errDel;

        const itemsLimpios = items.map(i => ({
            cotizacion_id: Number(req.params.id),
            descripcion: i.descripcion || '',
            tipo_cortina: i.tipo_cortina || '',
            ancho: Number(i.ancho),
            alto: Number(i.alto),
            tipo_tela: i.tipo_tela || '',
            mecanismo: i.mecanismo || '',
            cantidad_tela: Number(i.cantidad_tela) || 0,
            precio_tela: Number(i.precio_tela) || 0,
            precio_mecanismo: Number(i.precio_mecanismo) || 0,
            mano_obra: Number(i.mano_obra) || 0,
            subtotal: Number(i.subtotal) || 0,
            precio_final: Number(i.precio_final) || 0,
        }));

        const { error: errItems } = await supabase
            .from('items_cotizacion')
            .insert(itemsLimpios);
        if (errItems) throw errItems;

        res.json({ mensaje: 'Cotización actualizada' });
    } catch (err) {
        console.error('Error updateCotizacion:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/clientes/:id', async (req, res) => {
    try {
        const { nombre, telefono, direccion } = req.body;
        const { error } = await supabase
            .from('clientes')
            .update({ nombre, telefono, direccion })
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ mensaje: 'Cliente actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Reportes ──────────────────────────────────────────
router.get('/reportes/resumen', async (req, res) => {
    try {
        const [cotizaciones, productos, clientes, movimientos] = await Promise.all([
            supabase.from('cotizaciones').select('total, estado, fecha'),
            supabase.from('productos').select('stock_actual, stock_minimo, activo').eq('activo', true),
            supabase.from('clientes').select('id'),
            supabase.from('movimientos_stock').select('tipo, cantidad, costo_total, fecha'),
        ])

        const cots = cotizaciones.data || []
        const prods = productos.data || []

        const totalFacturado = cots
            .filter(c => c.estado === 'aprobada')
            .reduce((s, c) => s + Number(c.total), 0)

        const cotizacionesPorEstado = {
            borrador: cots.filter(c => c.estado === 'borrador').length,
            enviada: cots.filter(c => c.estado === 'enviada').length,
            aprobada: cots.filter(c => c.estado === 'aprobada').length,
            rechazada: cots.filter(c => c.estado === 'rechazada').length,
        }

        const productosStockBajo = prods.filter(p =>
            Number(p.stock_actual) <= Number(p.stock_minimo)
        ).length

        // Cotizaciones por mes (últimos 6 meses)
        const ahora = new Date()
        const meses = []
        for (let i = 5; i >= 0; i--) {
            const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
            const nombre = fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
            const cotsMes = cots.filter(c => {
                const f = new Date(c.fecha)
                return f.getMonth() === fecha.getMonth() && f.getFullYear() === fecha.getFullYear()
            })
            meses.push({
                mes: nombre,
                total: cotsMes.filter(c => c.estado === 'aprobada').reduce((s, c) => s + Number(c.total), 0),
                cantidad: cotsMes.length,
            })
        }

        // Compras vs uso de materiales (últimos 6 meses)
        const movs = movimientos.data || []
        const movsPorMes = []
        for (let i = 5; i >= 0; i--) {
            const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
            const nombre = fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
            const movsMes = movs.filter(m => {
                const f = new Date(m.fecha)
                return f.getMonth() === fecha.getMonth() && f.getFullYear() === fecha.getFullYear()
            })
            movsPorMes.push({
                mes: nombre,
                compras: movsMes.filter(m => m.tipo === 'compra').reduce((s, m) => s + Number(m.costo_total || 0), 0),
                uso: movsMes.filter(m => m.tipo === 'uso_fabricacion').length,
            })
        }

        res.json({
            totalFacturado,
            totalCotizaciones: cots.length,
            cotizacionesPorEstado,
            totalClientes: clientes.data?.length || 0,
            productosStockBajo,
            cotizacionesPorMes: meses,
            movimientosPorMes: movsPorMes,
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router;