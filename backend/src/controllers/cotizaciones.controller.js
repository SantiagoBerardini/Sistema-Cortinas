const supabase = require('../config/db');

// ── Clientes ──────────────────────────────────────────
exports.getClientes = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('clientes').select('*').order('nombre');
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createCliente = async (req, res) => {
    const { nombre, telefono, direccion } = req.body;
    try {
        const { data, error } = await supabase
            .from('clientes').insert([{ nombre, telefono, direccion }])
            .select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Tipos de cortina y mecanismos ─────────────────────
exports.getTipos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tipos_cortina').select('*').eq('activo', true).order('nombre');
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getMecanismos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('mecanismos').select('*').eq('activo', true).order('nombre');
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Cotizaciones ──────────────────────────────────────
exports.getCotizaciones = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cotizaciones')
            .select('*, clientes(nombre, telefono)')
            .order('fecha', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getCotizacionById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cotizaciones')
            .select('*, clientes(*), items_cotizacion(*)')
            .eq('id', req.params.id)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createCotizacion = async (req, res) => {
    const { cliente_id, margen, notas, items } = req.body;
    try {
        const total = items.reduce((sum, i) => sum + (Number(i.precio_final) || 0), 0);

        const { data: cot, error: errCot } = await supabase
            .from('cotizaciones')
            .insert([{ cliente_id: Number(cliente_id), margen: Number(margen), notas, total }])
            .select().single();
        if (errCot) throw errCot;

        // Limpiar items — solo los campos que existen en la tabla
        const itemsLimpios = items.map(i => ({
            cotizacion_id: cot.id,
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

        res.status(201).json({ id: cot.id, total, mensaje: 'Cotización creada' });
    } catch (err) {
        console.error('Error createCotizacion:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateEstado = async (req, res) => {
    const { estado } = req.body;
    try {
        const { error } = await supabase
            .from('cotizaciones')
            .update({ estado })
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ mensaje: 'Estado actualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Motor de cálculo ──────────────────────────────────
exports.calcularItem = async (req, res) => {
    const {
        alto_cortina,
        ancho_cortina,
        tipo_cortina_id,
        precio_tela_m2,
        mecanismo_id,
        margen = 30,
        incluir_bandas = false
    } = req.body;

    try {
        // Obtener tipo cortina
        const { data: tipo, error: errTipo } = await supabase
            .from('tipos_cortina')
            .select('*')
            .eq('id', tipo_cortina_id)
            .single();
        if (errTipo) throw errTipo;

        // Obtener mecanismo
        const { data: mec, error: errMec } = await supabase
            .from('mecanismos')
            .select('*')
            .eq('id', mecanismo_id)
            .single();
        if (errMec) throw errMec;

        // CÁLCULOS (basados en Excel del tío)
        const area_cortina = Number(alto_cortina) * Number(ancho_cortina);
        const factor = tipo.factor_desperdicio || 1.1;
        const m2_tela = area_cortina * factor;

        const costo_tela = m2_tela * Number(precio_tela_m2);
        const costo_mecanismo = Number(mec.precio) || 0;
        const mano_obra = Number(tipo.precio_mano_obra) || 0;

        let m2_bandas = 0;
        let costo_bandas = 0;
        if (incluir_bandas) {
            m2_bandas = 0.09 * Number(alto_cortina);
            costo_bandas = m2_bandas * Number(precio_tela_m2);
        }

        const subtotal = costo_tela + costo_mecanismo + mano_obra + costo_bandas;
        const precio_final = subtotal * (1 + Number(margen) / 100);

        const desperdicio_m2 = area_cortina * (factor - 1);

        res.json({
            // Inputs
            alto_cortina: +Number(alto_cortina).toFixed(2),
            ancho_cortina: +Number(ancho_cortina).toFixed(2),

            // Cálculos área
            area_cortina: +area_cortina.toFixed(2),

            // Cálculo tela
            factor_desperdicio: +factor.toFixed(2),
            m2_tela_utilizada: +m2_tela.toFixed(2),
            costo_tela: +costo_tela.toFixed(2),

            // Cálculo desperdicios
            desperdicio_m2: +desperdicio_m2.toFixed(2),

            // Mecanismo
            precio_mecanismo: +costo_mecanismo.toFixed(2),
            mecanismo: mec.nombre,

            // Mano de obra
            mano_obra: +mano_obra.toFixed(2),

            // Bandas (si aplica)
            m2_bandas: +m2_bandas.toFixed(2),
            costo_bandas: +costo_bandas.toFixed(2),

            // Totales
            subtotal: +subtotal.toFixed(2),
            margen_porcentaje: Number(margen),
            precio_final: +precio_final.toFixed(2),

            // Info
            tipo_cortina: tipo.nombre,
            incluir_bandas: Boolean(incluir_bandas)
        });
    } catch (err) {
        console.error('Error calcularItem:', err);
        res.status(500).json({ error: err.message });
    }
};