// ===== Zeutica — API Layer =====
// Primary: real backend. Mock data sólo se conserva para el login demo
// (cuando no hay servidor). Los datos de negocio vienen SIEMPRE de la API.

const API_BASE = 'http://10.0.9.227:8090';
//const API_BASE = 'http://3.151.25.133:8090';
//const API_BASE = 'http://127.0.0.1:8000';
const USE_MOCK_LOGIN_FALLBACK = true; // permite demo/login sin backend
const REQUEST_TIMEOUT = 4000;

// ---- MOCK DATA (realistic) ----
const MOCK = {
  productos: [
    { id: 1, sku: 'COFPLI-001', nombre: 'Cofia Plisada Blanca', categoria: 'COFIA', medida: 'PZA', ubicacion: 'CEDIS-E5', stock_bodega: 1240, stock_minimo: 300, costo_total: 4.20, precio: 8.50, precio_2: 7.90, precio_3: 7.20, precio_clean: 6.80, precio_amazon: 12.90 },
    { id: 2, sku: 'COFPLI-002', nombre: 'Cofia Plisada Azul', categoria: 'COFIA', medida: 'PZA', ubicacion: 'CEDIS-E5', stock_bodega: 86, stock_minimo: 300, costo_total: 4.40, precio: 8.70, precio_2: 8.10, precio_3: 7.40, precio_clean: 7.00, precio_amazon: 13.20 },
    { id: 3, sku: 'GUANITRL-S', nombre: 'Guante Nitrilo Negro S', categoria: 'GUANTES', medida: 'CAJA', ubicacion: 'CEDIS-A2', stock_bodega: 512, stock_minimo: 150, costo_total: 78.50, precio: 145.00, precio_2: 138.00, precio_3: 130.00, precio_clean: 125.00, precio_amazon: 189.00 },
    { id: 4, sku: 'GUANITRL-M', nombre: 'Guante Nitrilo Negro M', categoria: 'GUANTES', medida: 'CAJA', ubicacion: 'CEDIS-A2', stock_bodega: 680, stock_minimo: 150, costo_total: 78.50, precio: 145.00, precio_2: 138.00, precio_3: 130.00, precio_clean: 125.00, precio_amazon: 189.00 },
    { id: 5, sku: 'GUANITRL-L', nombre: 'Guante Nitrilo Negro L', categoria: 'GUANTES', medida: 'CAJA', ubicacion: 'CEDIS-A2', stock_bodega: 48, stock_minimo: 150, costo_total: 78.50, precio: 145.00, precio_2: 138.00, precio_3: 130.00, precio_clean: 125.00, precio_amazon: 189.00 },
    { id: 6, sku: 'MASKN95-01', nombre: 'Mascarilla N95 c/válvula', categoria: 'MASCARILLAS', medida: 'PZA', ubicacion: 'CEDIS-B1', stock_bodega: 2450, stock_minimo: 500, costo_total: 12.30, precio: 28.00, precio_2: 25.00, precio_3: 22.50, precio_clean: 21.00, precio_amazon: 39.00 },
    { id: 7, sku: 'MASKTRI-01', nombre: 'Cubrebocas Tricapa Azul', categoria: 'MASCARILLAS', medida: 'CAJA 50', ubicacion: 'CEDIS-B1', stock_bodega: 320, stock_minimo: 100, costo_total: 35.00, precio: 89.00, precio_2: 82.00, precio_3: 76.00, precio_clean: 72.00, precio_amazon: 120.00 },
    { id: 8, sku: 'BATADES-M', nombre: 'Bata Desechable PP M', categoria: 'BATAS', medida: 'PZA', ubicacion: 'CEDIS-C3', stock_bodega: 180, stock_minimo: 80, costo_total: 22.40, precio: 49.00, precio_2: 45.00, precio_3: 42.00, precio_clean: 39.00, precio_amazon: 65.00 },
    { id: 9, sku: 'BATADES-L', nombre: 'Bata Desechable PP L', categoria: 'BATAS', medida: 'PZA', ubicacion: 'CEDIS-C3', stock_bodega: 14, stock_minimo: 80, costo_total: 22.40, precio: 49.00, precio_2: 45.00, precio_3: 42.00, precio_clean: 39.00, precio_amazon: 65.00 },
    { id: 10, sku: 'GELALC-250', nombre: 'Gel Antibacterial 250ml', categoria: 'SANITIZANTE', medida: 'PZA', ubicacion: 'CEDIS-D4', stock_bodega: 890, stock_minimo: 200, costo_total: 18.00, precio: 42.00, precio_2: 38.00, precio_3: 35.00, precio_clean: 32.00, precio_amazon: 58.00 },
    { id: 11, sku: 'GELALC-1L', nombre: 'Gel Antibacterial 1L', categoria: 'SANITIZANTE', medida: 'PZA', ubicacion: 'CEDIS-D4', stock_bodega: 245, stock_minimo: 100, costo_total: 58.00, precio: 129.00, precio_2: 119.00, precio_3: 109.00, precio_clean: 99.00, precio_amazon: 169.00 },
    { id: 12, sku: 'OVEREXP-XL', nombre: 'Overol Expositor XL', categoria: 'UNIFORMES', medida: 'PZA', ubicacion: 'CEDIS-F6', stock_bodega: 92, stock_minimo: 40, costo_total: 180.00, precio: 349.00, precio_2: 329.00, precio_3: 309.00, precio_clean: 289.00, precio_amazon: 459.00 },
  ],
  clientes: [
    { id: 1001, nombre: 'Farmacia Benavides CEDIS', email: 'compras@fbenavides.mx', telefono: '81-8123-4567', ciudad: 'Monterrey', credito: true, saldo: 45200 },
    { id: 1002, nombre: 'Hospital Ángeles Pedregal', email: 'suministros@hangeles.mx', telefono: '55-5449-5500', ciudad: 'CDMX', credito: true, saldo: 128500 },
    { id: 1003, nombre: 'Clínica Santa María', email: 'admin@csm.com.mx', telefono: '33-3812-7700', ciudad: 'Guadalajara', credito: false, saldo: 0 },
    { id: 1004, nombre: 'Dental Spa Querétaro', email: 'info@dentalspa.mx', telefono: '442-215-8900', ciudad: 'Querétaro', credito: true, saldo: 18900 },
    { id: 1005, nombre: 'Consultorio Dr. Reyes', email: 'reyes@medic.mx', telefono: '55-2345-6781', ciudad: 'CDMX', credito: false, saldo: 0 },
    { id: 1006, nombre: 'Veterinaria Vida Animal', email: 'compras@vidaanimal.mx', telefono: '81-8390-1122', ciudad: 'Monterrey', credito: true, saldo: 7800 },
    { id: 1007, nombre: 'Estética Bella Vida', email: 'bella@vida.mx', telefono: '33-1256-4444', ciudad: 'Guadalajara', credito: false, saldo: 0 },
    { id: 1008, nombre: 'Laboratorio Clínico Sur', email: 'compras@labsur.mx', telefono: '55-5678-9012', ciudad: 'CDMX', credito: true, saldo: 62300 },
  ],
  ventas: (() => {
    const productos = ['Cofia Plisada Blanca','Guante Nitrilo Negro M','Mascarilla N95 c/válvula','Gel Antibacterial 250ml','Bata Desechable PP M','Cubrebocas Tricapa Azul','Overol Expositor XL','Cofia Plisada Azul'];
    const plataformas = ['Amazon','Mercado Libre','Directo','Local'];
    const today = new Date();
    const out = [];
    for (let i = 0; i < 68; i++) {
      const d = new Date(today); d.setDate(d.getDate() - Math.floor(Math.random() * 28));
      const cant = Math.floor(Math.random() * 40) + 1;
      const precio = [89, 145, 28, 42, 49, 349, 8.5][Math.floor(Math.random() * 7)];
      out.push({
        id_venta: 1000000000 + i * 7777,
        fecha: d.toISOString(),
        producto: productos[Math.floor(Math.random() * productos.length)],
        sku: 'SKU-' + (100 + i),
        cantidad: cant,
        precio: precio,
        total: cant * precio,
        utilidad_total: cant * precio * 0.28,
        plataforma: plataformas[Math.floor(Math.random() * plataformas.length)],
        nombreComprador: MOCK_getCli(i),
        condicion_pago: ['CONTADO','TRANSFERENCIA','CREDITO'][Math.floor(Math.random() * 3)],
        usuario: ['gerencia','vendedor1','fparra'][Math.floor(Math.random() * 3)],
      });
    }
    return out.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
  })(),
  cotizaciones: [
    { codigo_cotizacion: 'COT-2026-0182', empresa: 'Farmacia Benavides CEDIS', fecha: '2026-04-18', subtotal: 45200, total: 52432, items_count: 12, vendido: 0, estado: 'Abierta' },
    { codigo_cotizacion: 'COT-2026-0181', empresa: 'Hospital Ángeles Pedregal', fecha: '2026-04-17', subtotal: 128500, total: 149060, items_count: 23, vendido: 0, estado: 'Enviada' },
    { codigo_cotizacion: 'COT-2026-0180', empresa: 'Dental Spa Querétaro', fecha: '2026-04-15', subtotal: 18900, total: 21924, items_count: 6, vendido: 1, estado: 'Vendida' },
    { codigo_cotizacion: 'COT-2026-0179', empresa: 'Laboratorio Clínico Sur', fecha: '2026-04-14', subtotal: 62300, total: 72268, items_count: 15, vendido: 0, estado: 'Abierta' },
    { codigo_cotizacion: 'COT-2026-0178', empresa: 'Veterinaria Vida Animal', fecha: '2026-04-12', subtotal: 7800, total: 9048, items_count: 4, vendido: 0, estado: 'Seguimiento' },
    { codigo_cotizacion: 'COT-2026-0177', empresa: 'Clínica Santa María', fecha: '2026-04-10', subtotal: 23400, total: 27144, items_count: 8, vendido: 1, estado: 'Vendida' },
  ],
  creditos: [
    { id_ventas: 9001234567, nombre: 'Hospital Ángeles Pedregal', fecha: '2026-03-22', total: 128500, abonado: 0, saldo_pendiente: 128500, dias_vencido: 32 },
    { id_ventas: 9002345678, nombre: 'Farmacia Benavides CEDIS', fecha: '2026-04-05', total: 52432, abonado: 7232, saldo_pendiente: 45200, dias_vencido: 18 },
    { id_ventas: 9003456789, nombre: 'Laboratorio Clínico Sur', fecha: '2026-04-10', total: 72268, abonado: 9968, saldo_pendiente: 62300, dias_vencido: 13 },
    { id_ventas: 9004567890, nombre: 'Dental Spa Querétaro', fecha: '2026-04-15', total: 21924, abonado: 3024, saldo_pendiente: 18900, dias_vencido: 8 },
    { id_ventas: 9005678901, nombre: 'Veterinaria Vida Animal', fecha: '2026-04-12', total: 9048, abonado: 1248, saldo_pendiente: 7800, dias_vencido: 11 },
  ],
  gastos: [
    { id: 1, fecha: '2026-04-20', concepto: 'Renta bodega CEDIS', categoria: 'Renta', monto: 45000, metodo: 'Transferencia' },
    { id: 2, fecha: '2026-04-19', concepto: 'Combustible flota', categoria: 'Logística', monto: 8200, metodo: 'Efectivo' },
    { id: 3, fecha: '2026-04-18', concepto: 'Nómina quincenal', categoria: 'Nómina', monto: 185000, metodo: 'Transferencia' },
    { id: 4, fecha: '2026-04-17', concepto: 'CFE consumo abril', categoria: 'Servicios', monto: 12400, metodo: 'Domiciliado' },
    { id: 5, fecha: '2026-04-15', concepto: 'Empaques y etiquetas', categoria: 'Insumos', monto: 6800, metodo: 'Tarjeta' },
    { id: 6, fecha: '2026-04-12', concepto: 'Mantenimiento impresora', categoria: 'Servicios', monto: 2400, metodo: 'Efectivo' },
    { id: 7, fecha: '2026-04-10', concepto: 'Publicidad Meta Ads', categoria: 'Marketing', monto: 15000, metodo: 'Tarjeta' },
  ],
  compras: [
    { id: 1, fecha: '2026-04-18', proveedor: 'Suministros Médicos MX', factura: 'F-88412', items: 12, monto: 158900, estado: 'Recibida' },
    { id: 2, fecha: '2026-04-15', proveedor: 'Textil Industrial SA', factura: 'F-88399', items: 5, monto: 89400, estado: 'En tránsito' },
    { id: 3, fecha: '2026-04-12', proveedor: 'Químicos del Bajío', factura: 'F-88356', items: 8, monto: 42300, estado: 'Recibida' },
    { id: 4, fecha: '2026-04-10', proveedor: 'Packaging Global', factura: 'F-88312', items: 3, monto: 18200, estado: 'Pendiente pago' },
    { id: 5, fecha: '2026-04-05', proveedor: 'Suministros Médicos MX', factura: 'F-88287', items: 18, monto: 245600, estado: 'Recibida' },
  ],
};

function MOCK_getCli(i) {
  const names = ['Farmacia Benavides CEDIS','Hospital Ángeles Pedregal','Clínica Santa María','Dental Spa Querétaro','Consultorio Dr. Reyes','Veterinaria Vida Animal','Estética Bella Vida','Laboratorio Clínico Sur'];
  return names[i % names.length];
}

// ---- Fetch helper ----
async function tryFetch(path, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);
  try {
    const authHeader = api.token ? { Authorization: `Bearer ${api.token}` } : {};
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...authHeader, ...(options.headers || {}) },
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true, data: await res.json(), live: true };
  } catch (err) {
    clearTimeout(t);
    return { ok: false, error: err.message, live: false };
  }
}

// ---- Public API ----
const api = {
  live: false, // flipped true on first successful call
  token: null, // JWT set after login; sent in every request via Authorization: Bearer

  async login(usuario, password) {
    const r = await tryFetch('/login', { method: 'POST', body: JSON.stringify({ usuario, password }) });
    if (r.ok && r.data.access_token) {
      api.live = true;
      api.token = r.data.access_token;
      api.usuario = usuario;
      return { ok: true, token: r.data.access_token, user: usuario, live: true };
    }
    if (USE_MOCK_LOGIN_FALLBACK) {
      const valid = [
        { u: 'gerencia', p: 'gerencia' },
        { u: 'fparra', p: 'fparra' },
        { u: 'ventas', p: 'ventas' },
        { u: 'demo', p: 'demo' },
      ];
      const ok = valid.some(c => c.u === usuario.toLowerCase() && c.p === password);
      if (ok) {
        api.usuario = usuario.toLowerCase();
        return { ok: true, token: 'mock-token-' + Date.now(), user: usuario.toLowerCase(), live: false };
      }
      return { ok: false, error: 'Credenciales inválidas' };
    }
    return { ok: false, error: r.error };
  },

  async serverStatus() {
    const r = await tryFetch('/');
    return { online: r.ok, live: r.ok };
  },

  async productos() {
    const r = await tryFetch('/zeutica/productos');
    return r.ok ? r.data : [];
  },
  async clientes() {
    const r = await tryFetch('/zeutica/clientes');
    return r.ok ? r.data : [];
  },
  async crearCliente(payload) {
    return tryFetch('/zeutica/clientes', { method: 'POST', body: JSON.stringify(payload) });
  },
  async ventasMes(f1, f2) {
    const r = await tryFetch(`/zeutica/ventas/${f1}/${f2}`);
    return r.ok ? r.data : [];
  },
  async cotizaciones() {
    const r = await tryFetch('/zeutica/consulta/cotizacion');
    if (!r.ok) return [];
    return r.data.cotizaciones || r.data || [];
  },
  async creditos() {
    const r = await tryFetch('/zeutica/ventas-credito');
    if (!r.ok) return [];
    return Array.isArray(r.data) ? r.data : (r.data.data || []);
  },
  async gastos() {
    const r = await tryFetch('/zeutica/gastos');
    return r.ok ? (Array.isArray(r.data) ? r.data : (r.data.data || [])) : [];
  },
  async compras() {
    const r = await tryFetch('/zeutica/compras');
    return r.ok ? (Array.isArray(r.data) ? r.data : (r.data.data || [])) : [];
  },
  async traspasos() {
    const r = await tryFetch('/zeutica/traspaso', {
      method: 'POST',
      body: JSON.stringify({ usuario: api.usuario || '', movimientos: [] }),
    });
    return r.ok ? (Array.isArray(r.data) ? r.data : (r.data.data || [])) : [];
  },
  async cotizacionDetalle(codigo) {
    const r = await tryFetch('/zeutica/consulta/cotizacion', {
      method: 'GET',
    });
    return r.ok ? r.data : null;
  },
  async nuevoCodigo() {
    const r = await tryFetch('/zeutica/cotizaciones/nuevo-codigo');
    return r.ok ? r.data.nuevo_codigo : 'ZTC-ERR';
  },
  async guardarCotizacion(payload) {
    return tryFetch('/zeutica/cotizaciones/guardar', { method: 'POST', body: JSON.stringify(payload) });
  },
  async marcarCotizacionVendida(codigo) {
    return tryFetch('/zeutica/cotizaciones/vendido', {
      method: 'POST',
      body: JSON.stringify({ vendido: 1, codigo_cotizacion: codigo }),
    });
  },
  async registrarVenta(payload) {
    return tryFetch('/zeutica/producto/venta', { method: 'POST', body: JSON.stringify(payload) });
  },
};

window.api = api;
window.fmt = {
  mxn: (n) => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  int: (n) => Number(n || 0).toLocaleString('es-MX'),
  date: (iso) => {
    try { return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  },
  datetime: (iso) => {
    try { return new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  },
  relative: (iso) => {
    const diff = (new Date() - new Date(iso)) / 1000;
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff/3600)} h`;
    return `hace ${Math.floor(diff/86400)} d`;
  },
};
