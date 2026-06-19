// ===== Zeutica — Registro de Ingresos (historial de inicios de sesión, solo lectura) =====
const { useState: ing_uS, useEffect: ing_uE, useMemo: ing_uM } = React;

function PageRegistroIngresos({ user }) {
  const [registros, setRegistros] = ing_uS([]);
  const [loading, setLoading] = ing_uS(true);
  const [desde, setDesde] = ing_uS('');
  const [hasta, setHasta] = ing_uS('');

  const cargar = async () => {
    setLoading(true);
    const data = await window.api.registroIngresos();
    setRegistros(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  ing_uE(() => { cargar(); }, []);

  // Normaliza cada registro a forma estable (backend shape desconocido → fallbacks).
  const normalizados = ing_uM(() => registros.map((r, i) => ({
    id: r.id ?? r.id_registro ?? i,
    usuario: r.nombre_usuario || r.usuario || r.user || r.nombre || r.empleado || '—',
    fecha: r.fecha || r.fecha_login || r.timestamp || r.created_at || null,
  })), [registros]);

  const filtrados = ing_uM(() => {
    return normalizados.filter(r => {
      if (!r.fecha) return !desde && !hasta;
      const t = new Date(r.fecha).getTime();
      if (desde && t < new Date(desde + 'T00:00:00').getTime()) return false;
      if (hasta && t > new Date(hasta + 'T23:59:59').getTime()) return false;
      return true;
    });
  }, [normalizados, desde, hasta]);

  const limpiarFiltro = () => { setDesde(''); setHasta(''); };

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h2 className="section-title">Registro de ingresos</h2>
          <p className="section-subtitle">Historial de inicios de sesión del sistema (solo lectura).</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field">
              <label className="field-label">Desde</label>
              <input className="input" type="date" value={desde} max={hasta || undefined} onChange={e => setDesde(e.target.value)}/>
            </div>
            <div className="field">
              <label className="field-label">Hasta</label>
              <input className="input" type="date" value={hasta} min={desde || undefined} onChange={e => setHasta(e.target.value)}/>
            </div>
            {(desde || hasta) && (
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
              <tr><th>Fecha</th><th>Usuario</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={2} className="empty">Cargando registros...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={2} className="empty">Sin registros de ingreso{(desde || hasta) ? ' en el rango seleccionado' : ''}</td></tr>
              ) : filtrados.map(r => (
                <tr key={r.id}>
                  <td className="td-muted" style={{ fontSize: 12 }}>{r.fecha ? window.fmt.datetime(r.fecha) : '—'}</td>
                  <td style={{ fontWeight: 500 }}>{r.usuario}</td>
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

window.PageRegistroIngresos = PageRegistroIngresos;
