const supabase = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const { producto_id } = req.query;
        let query = supabase
            .from('movimientos_stock')
            .select('*, productos(nombre, unidad)')
            .order('fecha', { ascending: false })
            .limit(200);
        if (producto_id) query = query.eq('producto_id', producto_id);
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { producto_id, tipo, cantidad, costo_total, referencia, observaciones } = req.body;
    try {
        const { error: errMov } = await supabase
            .from('movimientos_stock')
            .insert([{ producto_id, tipo, cantidad, costo_total, referencia, observaciones }]);
        if (errMov) throw errMov;

        const egreso = ['uso_fabricacion', 'venta', 'rotura'];
        const signo = egreso.includes(tipo) ? -1 : 1;

        const { data: prod, error: errProd } = await supabase
            .from('productos')
            .select('stock_actual')
            .eq('id', producto_id)
            .single();
        if (errProd) throw errProd;

        const { error: errUpd } = await supabase
            .from('productos')
            .update({ stock_actual: prod.stock_actual + (signo * cantidad) })
            .eq('id', producto_id);
        if (errUpd) throw errUpd;

        res.status(201).json({ mensaje: 'Movimiento registrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};