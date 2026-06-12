// ===== Zeutica — Flujo de venta automática para historial Cleanest =====
// Lógica pura (sin JSX) para poder probarla en Node y reutilizarla en la página.
// Contrato backend /zeutica/verifica-venta/{norden}: 200 = la venta ya existe,
// 404 = no existe (hay que registrarla), otro status = error temporal.

(function (root) {
  // Guard anti-duplicados: órdenes ya verificadas/registradas en esta sesión
  // o con registro en curso. Evita doble POST al remontar la pestaña Historial.
  const ventasProcesadas = new Set();

  function nordenCorto(numeroOrden) {
    return String(numeroOrden || '').replace(/^OC/, '');
  }

  function construirPayloadCleanest(pedido, item, usuario, fechaIso) {
    return {
      id_venta: nordenCorto(pedido.numero_orden),
      sku: pedido.sku,
      producto: item.nombre || pedido.sku,
      stock_clean: +pedido.cantidad,
      precio: parseFloat(item.precio_clean || 0),
      fecha: fechaIso,
      nombreComprador: 'CLEANEST CHOICE',
      otros: 'FARMACEUTICA',
      plataforma: 'SISTEMA ZEUTICA',
      usuario: usuario || 'sistema',
      condicion_pago: 'CREDITO',
    };
  }

  // Devuelve { accion: 'ignorada' | 'registrada' | 'en-proceso' | 'error', norden, payload?, error? }
  async function procesarVentaHistorial({ pedido, inv, api, usuario, ahora }) {
    const corto = nordenCorto(pedido.numero_orden);
    if (ventasProcesadas.has(corto)) return { accion: 'en-proceso', norden: corto };
    ventasProcesadas.add(corto);
    try {
      const r = await api.verificarVenta(corto);
      if (r.ok) return { accion: 'ignorada', norden: corto }; // ya existe en la DB
      if (r.status !== 404) {
        // Error temporal (timeout, 401, 500): liberar guard para reintentar después
        ventasProcesadas.delete(corto);
        return { accion: 'error', norden: corto, error: r.error || 'No se pudo verificar la venta' };
      }
      const item = (inv || []).find(p => p.sku === pedido.sku) || {};
      const fechaIso = (ahora || new Date()).toISOString().slice(0, 19).replace('T', ' ');
      const payload = construirPayloadCleanest(pedido, item, usuario, fechaIso);
      const rc = await api.registrarVentaCleanest(payload);
      if (rc.ok) return { accion: 'registrada', norden: corto, payload };
      ventasProcesadas.delete(corto);
      return { accion: 'error', norden: corto, error: rc.error || 'No se pudo registrar la venta' };
    } catch (err) {
      ventasProcesadas.delete(corto);
      return { accion: 'error', norden: corto, error: err.message };
    }
  }

  const mod = {
    nordenCorto,
    construirPayloadCleanest,
    procesarVentaHistorial,
    _reset: () => ventasProcesadas.clear(), // solo para tests
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  else root.cleanestVenta = mod;
})(typeof self !== 'undefined' ? self : this);
