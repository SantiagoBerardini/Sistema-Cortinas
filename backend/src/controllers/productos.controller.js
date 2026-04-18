const supabase = require('../config/db');

// ==========================================
// CRUD BÁSICO (actualizado)
// ==========================================

exports.getAll = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('productos')
            .select('*, categorias(nombre)')
            .eq('activo', true)
            .order('nombre');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const {
        categoria_id,
        nombre,
        sku,
        descripcion,
        tipo_medida = 'unidad',
        ancho_rollo = 0,
        largo_rollo = 30,
        factor_desperdicio = 1.0,
        stock_actual = 0,
        stock_minimo = 0,
        costo_unitario = 0,
        es_producto_base = true,
        producto_padre_id = null
    } = req.body;

    if (!nombre || !categoria_id) {
        return res.status(400).json({ error: 'Nombre y categoría requeridos' });
    }

    if (factor_desperdicio < 1.0 || factor_desperdicio > 1.5) {
        return res.status(400).json({
            error: 'Factor desperdicio debe estar entre 1.0 y 1.5'
        });
    }

    const skuLimpio = sku && String(sku).trim() !== '' ? String(sku).trim() : null;
    const descripcionLimpia = descripcion && String(descripcion).trim() !== ''
        ? String(descripcion).trim()
        : null;

    try {
        const { data, error } = await supabase
            .from('productos')
            .insert([{
                categoria_id: Number(categoria_id),
                nombre: String(nombre).trim(),
                sku: skuLimpio,
                descripcion: descripcionLimpia,
                tipo_medida,
                ancho_rollo: ancho_rollo ? Number(ancho_rollo) : null,
                largo_rollo: Number(largo_rollo),
                factor_desperdicio: Number(factor_desperdicio),
                stock_actual: Number(stock_actual),
                stock_minimo: Number(stock_minimo),
                costo_unitario: Number(costo_unitario),
                es_producto_base: Boolean(es_producto_base),
                producto_padre_id: producto_padre_id ? Number(producto_padre_id) : null
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            id: data.id,
            mensaje: 'Producto creado',
            data
        });
    } catch (err) {
        if (
            err.message?.includes('duplicate key value violates unique constraint') &&
            err.message?.includes('productos_sku_key')
        ) {
            return res.status(400).json({
                error: 'El SKU ya existe. Ingresá uno distinto o dejalo vacío.'
            });
        }

        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    const {
        nombre,
        sku,
        descripcion,
        tipo_medida,
        unidad,
        ancho_rollo,
        largo_rollo,
        factor_desperdicio,
        stock_actual,
        stock_minimo,
        costo_unitario,
        categoria_id,
        es_producto_base,
        producto_padre_id
    } = req.body;

    if (
        factor_desperdicio !== undefined &&
        Number(factor_desperdicio) !== 0 &&
        (Number(factor_desperdicio) < 1.0 || Number(factor_desperdicio) > 1.5)
    ) {
        return res.status(400).json({
            error: 'Factor desperdicio debe estar entre 1.0 y 1.5'
        });
    }

    const updates = {};

    if (nombre !== undefined) {
        updates.nombre = String(nombre).trim();
    }

    if (sku !== undefined) {
        updates.sku = sku && String(sku).trim() !== '' ? String(sku).trim() : null;
    }

    if (descripcion !== undefined) {
        updates.descripcion = descripcion && String(descripcion).trim() !== '' ? String(descripcion).trim() : null;
    }

    if (tipo_medida !== undefined) {
        updates.tipo_medida = tipo_medida;
    }

    if (unidad !== undefined) {
        updates.unidad = unidad;
    }

    if (ancho_rollo !== undefined) {
        updates.ancho_rollo = ancho_rollo === '' || ancho_rollo === null ? null : Number(ancho_rollo);
    }

    if (largo_rollo !== undefined) {
        updates.largo_rollo = Number(largo_rollo);
    }

    if (factor_desperdicio !== undefined) {
        updates.factor_desperdicio = Number(factor_desperdicio);
    }

    if (stock_actual !== undefined) {
        updates.stock_actual = Number(stock_actual);
    }

    if (stock_minimo !== undefined) {
        updates.stock_minimo = Number(stock_minimo);
    }

    if (costo_unitario !== undefined) {
        updates.costo_unitario = Number(costo_unitario);
    }

    if (categoria_id !== undefined) {
        updates.categoria_id = Number(categoria_id);
    }

    if (es_producto_base !== undefined) {
        updates.es_producto_base = Boolean(es_producto_base);
    }

    if (producto_padre_id !== undefined) {
        updates.producto_padre_id = producto_padre_id ? Number(producto_padre_id) : null;
    }

    updates.updated_at = new Date().toISOString();

    try {
        const { data, error } = await supabase
            .from('productos')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ mensaje: 'Producto actualizado', data });
    } catch (err) {
        if (
            err.message?.includes('duplicate key value violates unique constraint') &&
            err.message?.includes('productos_sku_key')
        ) {
            return res.status(400).json({
                error: 'El SKU ya existe. Ingresá uno distinto o dejalo vacío.'
            });
        }

        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { error } = await supabase
            .from('productos')
            .update({ activo: false, updated_at: new Date().toISOString() })
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ mensaje: 'Producto desactivado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ==========================================
// NUEVAS FUNCIONES PARA CONTROL DE TELA
// ==========================================

/**
 * Obtener precios históricos de una tela
 */
exports.getPreciosTela = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('precios_tela')
            .select('*')
            .eq('producto_id', req.params.id)
            .order('fecha_vigencia', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Registrar corte de cortina y generar desperdicios automáticamente
 */
exports.registrarCorte = async (req, res) => {
    const {
        producto_id,
        alto_cortina,
        ancho_cortina,
        cantidad = 1,
        incluir_bandas = false,
        usuario = 'sistema',
        notas = ''
    } = req.body;

    try {
        const { data: producto, error: errProd } = await supabase
            .from('productos')
            .select('*')
            .eq('id', req.params.id || producto_id)
            .single();
        if (errProd) throw errProd;

        if (!producto.es_producto_base) {
            return res.status(400).json({
                error: 'Solo se pueden registrar cortes en productos base'
            });
        }

        const area_cortina = Number(alto_cortina) * Number(ancho_cortina);
        const factor = producto.factor_desperdicio || 1.1;
        const m2_tela = area_cortina * factor * cantidad;

        const sobra_ancho = (producto.ancho_rollo || 2.5) - Number(ancho_cortina);
        const m2_desperdicio = sobra_ancho * Number(alto_cortina) * cantidad;

        let m2_bandas = 0;
        if (incluir_bandas) {
            m2_bandas = (0.09 * Number(alto_cortina)) * cantidad;
        }

        const { data: movPrincipal, error: errMov } = await supabase
            .from('movimientos_stock')
            .insert([{
                producto_id: producto.id,
                tipo: 'corte_cortina',
                cantidad: -m2_tela,
                cantidad_anterior: producto.stock_actual,
                cantidad_nueva: producto.stock_actual - m2_tela,
                m2_utilizado: m2_tela,
                m2_desperdicio: m2_desperdicio,
                m2_recuperado: m2_bandas,
                detalles_corte: {
                    alto: alto_cortina,
                    ancho: ancho_cortina,
                    cantidad_cortinas: cantidad,
                    incluir_bandas,
                    area_cortina,
                    factor_desperdicio: factor
                },
                notas: notas || `Corte: ${cantidad} cortina(s) ${alto_cortina}×${ancho_cortina}m`,
                usuario
            }])
            .select()
            .single();
        if (errMov) throw errMov;

        await supabase
            .from('productos')
            .update({ stock_actual: Math.max(0, producto.stock_actual - m2_tela) })
            .eq('id', producto.id);

        const nombreDesperdicio = `Desperdicio - ${producto.nombre}`;
        const { data: prodDesperdicio, error: errDesp } = await supabase
            .from('productos')
            .select('id, stock_actual')
            .eq('nombre', nombreDesperdicio)
            .eq('es_producto_base', false)
            .single();

        let desp_id;
        if (!prodDesperdicio) {
            const { data: newDesp, error: errNewDesp } = await supabase
                .from('productos')
                .insert([{
                    nombre: nombreDesperdicio,
                    categoria_id: producto.categoria_id,
                    tipo_medida: 'metros_cuadrados',
                    stock_actual: m2_desperdicio,
                    stock_minimo: 0,
                    es_producto_base: false,
                    producto_padre_id: producto.id,
                    factor_desperdicio: 0,
                    activo: true
                }])
                .select('id')
                .single();
            if (errNewDesp) throw errNewDesp;
            desp_id = newDesp.id;
        } else {
            desp_id = prodDesperdicio.id;
            await supabase
                .from('productos')
                .update({
                    stock_actual: (prodDesperdicio.stock_actual || 0) + m2_desperdicio
                })
                .eq('id', desp_id);
        }

        await supabase
            .from('movimientos_stock')
            .insert([{
                producto_id: desp_id,
                tipo: 'generacion_desperdicio',
                cantidad: m2_desperdicio,
                m2_desperdicio: m2_desperdicio,
                notas: `Desperdicios de corte de cortina (${cantidad} unidad/es)`,
                usuario
            }]);

        let bandas_id = null;
        if (incluir_bandas && m2_bandas > 0) {
            const nombreBandas = `Bandas 9cm - ${producto.nombre}`;
            const { data: prodBandas } = await supabase
                .from('productos')
                .select('id, stock_actual')
                .eq('nombre', nombreBandas)
                .eq('es_producto_base', false)
                .single();

            if (!prodBandas) {
                const { data: newBandas } = await supabase
                    .from('productos')
                    .insert([{
                        nombre: nombreBandas,
                        categoria_id: producto.categoria_id,
                        tipo_medida: 'metros_cuadrados',
                        ancho_especifico: 0.09,
                        stock_actual: m2_bandas,
                        stock_minimo: 0,
                        es_producto_base: false,
                        producto_padre_id: producto.id,
                        factor_desperdicio: 0,
                        activo: true
                    }])
                    .select('id')
                    .single();
                bandas_id = newBandas.id;
            } else {
                bandas_id = prodBandas.id;
                await supabase
                    .from('productos')
                    .update({
                        stock_actual: (prodBandas.stock_actual || 0) + m2_bandas
                    })
                    .eq('id', bandas_id);
            }

            await supabase
                .from('movimientos_stock')
                .insert([{
                    producto_id: bandas_id,
                    tipo: 'generacion_bandas',
                    cantidad: m2_bandas,
                    ancho_especifico: 0.09,
                    largo_especifico: Number(alto_cortina),
                    notas: `Bandas generadas de corte (${cantidad} unidad/es)`,
                    usuario
                }]);
        }

        res.status(201).json({
            movimiento_id: movPrincipal.id,
            resumen: {
                cortinas_cortadas: cantidad,
                area_cortina: +area_cortina.toFixed(2),
                m2_tela_utilizada: +m2_tela.toFixed(2),
                m2_desperdicio_generado: +m2_desperdicio.toFixed(2),
                m2_bandas_generadas: +m2_bandas.toFixed(2),
                stock_anterior: producto.stock_actual,
                stock_nuevo: Math.max(0, producto.stock_actual - m2_tela)
            },
            mensaje: 'Corte registrado exitosamente',
            desperdicio_id: desp_id,
            bandas_id: bandas_id
        });
    } catch (err) {
        console.error('Error registrarCorte:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Convertir entre unidades (ej: rollos a m²)
 */
exports.convertirUnidad = async (req, res) => {
    const { cantidad_origen, unidad_origen, unidad_destino } = req.body;

    try {
        const { data: producto } = await supabase
            .from('productos')
            .select('*')
            .eq('id', req.params.id)
            .single();

        let cantidad_destino;

        if (unidad_origen === 'rollos' && unidad_destino === 'metros_cuadrados') {
            cantidad_destino = cantidad_origen *
                (producto.largo_rollo || 30) *
                (producto.ancho_rollo || 2.5);
        } else if (unidad_origen === 'metros_cuadrados' && unidad_destino === 'rollos') {
            const m2_rollo = (producto.largo_rollo || 30) * (producto.ancho_rollo || 2.5);
            cantidad_destino = cantidad_origen / m2_rollo;
        } else {
            cantidad_destino = cantidad_origen;
        }

        res.json({
            cantidad_origen,
            unidad_origen,
            cantidad_destino: +cantidad_destino.toFixed(2),
            unidad_destino,
            m2_por_rollo: (producto.largo_rollo || 30) * (producto.ancho_rollo || 2.5)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};