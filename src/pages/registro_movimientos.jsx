// ===== Zeutica — Registro de Movimientos (historial de acciones del sistema, solo lectura) =====
const { useState: mov_uS, useEffect: mov_uE, useMemo: mov_uM } = React;

function PageRegistroMovimientos({ user }) {
  const [registros, setRegistros] = mov_uS([]);
  const [loading, setLoading] = mov_uS(true);
  const [desde, setDesde] = mov_uS('');
  const [hasta, setHasta] = mov_uS('');
  const [q, setQ] = mov_uS('');

  const cargar = async () => {
    setLoading(true);
    const data = await window.api.consultaRegistros();
    setRegistros(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  mov_uE(() => { cargar(); }, []);

  // Normaliza cada registro a forma estable (backend shape desconocido → fallbacks).
  const normalizados = mov_uM(() => registros.map((r, i) => ({
    id: r.id ?? r.id_registro ?? i,
    usuario: r.nombre_usuario || r.usuario || r.user || r.nombre || r.empleado || '—',
    movimiento: r.movimiento || r.accion || r.tipo || r.descripcion || '—',
    seccion: r.seccion || r.modulo || r.tabla || r.area || '—',
    fecha: r.fecha || r.fecha_registro || r.timestamp || r.created_at || null,
  })), [registros]);

  const filtrados = mov_uM(() => {
    const lq = q.trim().toLowerCase();
    return normalizados.filter(r => {
      if (lq && !`${r.usuario} ${r.movimiento} ${r.seccion}`.toLowerCase().includes(lq)) return false;
      if (!r.fecha) return !desde && !hasta;
      const t = new Date(r.fecha).getTime();
      if (desde && t < new Date(desde + 'T00:00:00').getTime()) return false;
      if (hasta && t > new Date(hasta + 'T23:59:59').getTime()) return false;
      return true;
    });
  }, [normalizados, desde, hasta, q]);

  const limpiarFiltro = () => { setDesde(''); setHasta(''); setQ(''); };

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h2 className="section-title">Registro de movimientos</h2>
          <p className="section-subtitle">Historial de acciones realizadas en el sistema (solo lectura).</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field">
              <label className="field-label">Buscar</label>
              <div className="input-group">
                <span className="input-group-icon"><Icon name="search" size={14}/></span>
                <input className="input" placeholder="Usuario, movimiento o sección..." value={q} onChange={e => setQ(e.target.value)}/>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Desde</label>
              <input className="input" type="date" value={desde} max={hasta || undefined} onChange={e => setDesde(e.target.value)}/>
            </div>
            <div className="field">
              <label className="field-label">Hasta</label>
              <input className="input" type="date" value={hasta} min={desde || undefined} onChange={e => setHasta(e.target.value)}/>
            </div>
            {(desde || hasta || q) && (
              <button className="btn btn-ghost btn-sm" onClick={limpiarFiltro}>
                <Icon name="x" size={13}/> Limpiar
              </button>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={cargar} disabled={loading}>
            <Icon name="refresh" size={13}/> Actualizar
          </button>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Usuario</th><th>Movimiento</th><th>Sección</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="empty">Cargando registros...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={4} className="empty">Sin registros de movimientos{(desde || hasta || q) ? ' que coincidan con el filtro' : ''}</td></tr>
              ) : filtrados.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.usuario}</td>
                  <td>{r.movimiento}</td>
                  <td className="td-muted">{r.seccion}</td>
                  <td className="td-muted" style={{ fontSize: 12 }}>{r.fecha ? window.fmt.datetime(r.fecha) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtrados.length > 0 && (
          <div className="card-footer td-muted" style={{ fontSize: 12, padding: '10px 16px' }}>
            {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

window.PageRegistroMovimientos = PageRegistroMovimientos;
