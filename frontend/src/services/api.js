import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });

export const getCategorias = () => api.get('/categorias');
export const getProductos = () => api.get('/productos');
export const createProducto = (data) => api.post('/productos', data);
export const updateProducto = (id, d) => api.put(`/productos/${id}`, d);
export const deleteProducto = (id) => api.delete(`/productos/${id}`);
export const getMovimientos = (pid) => api.get('/movimientos', { params: { producto_id: pid } });
export const createMovimiento = (data) => api.post('/movimientos', data);
export const getAlertasStock = () => api.get('/alertas/stock-bajo');
export const getClientes = () => api.get('/clientes');
export const createCliente = (data) => api.post('/clientes', data);
export const getTiposCortina = () => api.get('/tipos-cortina');
export const getMecanismos = () => api.get('/mecanismos');
export const calcularItem = (data) => api.post('/calcular-item', data);
export const getCotizaciones = () => api.get('/cotizaciones');
export const getCotizacionById = (id) => api.get(`/cotizaciones/${id}`);
export const createCotizacion = (data) => api.post('/cotizaciones', data);
export const updateEstado = (id, e) => api.put(`/cotizaciones/${id}/estado`, { estado: e });
// Mecanismos
export const getAllMecanismos = () => api.get('/mecanismos');
export const createMecanismo = (data) => api.post('/mecanismos', data);
export const updateMecanismo = (id, d) => api.put(`/mecanismos/${id}`, d);

// Tipos de cortina
export const getAllTiposCortina = () => api.get('/tipos-cortina');
export const createTipoCortina = (data) => api.post('/tipos-cortina', data);
export const updateTipoCortina = (id, d) => api.put(`/tipos-cortina/${id}`, d);

// Categorías
export const createCategoria = (data) => api.post('/categorias', data);
export const updateCategoria = (id, d) => api.put(`/categorias/${id}`, d);
export const deleteCategoria = (id) => api.delete(`/categorias/${id}`);
export const updateCotizacion = (id, data) => api.put(`/cotizaciones/${id}`, data);
export const getReporteResumen = () => api.get('/reportes/resumen');