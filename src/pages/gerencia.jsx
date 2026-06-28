// ===== Zeutica — Monitor Gerencia: Pendientes de Registro =====
const { useState: gm_uS, useEffect: gm_uE, useCallback: gm_uC, useRef: gm_uR } = React;

const API_JAVA = 'http://3.151.25.133:19999'; // Zeutica Java Server

async function javaFetch(path, opts = {}) {
  try {
    const r = await fetch(`${API_JAVA}${path}`, { signal: AbortSignal.timeout(5000), ...opts });
    if (!r.ok) return { ok: false, data: null, error: `HTTP ${r.status}` };
    return { ok: true, data: await r.json() };
  } catch (err) {
    // Falla de red/CORS/timeout — el navegador no expone detalle, pero registramos.
    console.error(`javaFetch ${path} falló:`, err);
    return { ok: false, data: null, error: err.message || 'Sin conexión' };
  }
}

// Backend Java mezcla mayúsc/minúsc en prioridad/estado; normalizar para tono de badge.
const PRIO_TONE = { alta: 'danger', media: 'warn', baja: 'info' };
const ESTADO_TONE = { pendiente: 'warn', 'en proceso': 'info', completado: 'success', cancelado: '' };
const prioTone = (p) => PRIO_TONE[String(p || '').toLowerCase()] || 'info';
const estadoTone = (e) => ESTADO_TONE[String(e || '').toLowerCase()] ?? 'info';

function DrawerJava({ onClose }) {
  const [items, setItems]   = gm_uS([]);
  const [stats, setStats]   = gm_uS(null);
  const [detail, setDetail] = gm_uS(null);
  const [detLoading, setDetLoading] = gm_uS(false);
  const [loading, setLoading] = gm_uS(false);
  const [loadError, setLoadError] = gm_uS(null);

  const loadAll = gm_uC(async () => {
    setLoading(true);
    setLoadError(null);
    const [rItems, rStats] = await Promise.all([
      javaFetch('/api/pendientes'),
      javaFetch('/api/estadisticas'),
    ]);
    if (rItems.ok) setItems(Array.isArray(rItems.data) ? rItems.data : (rItems.data?.data ?? []));
    else setLoadError(rItems.error || 'No se pudo conectar con localhost:8080');
    if (rStats.ok) setStats(rStats.data);
    setLoading(false);
  }, []);

  gm_uE(() => { loadAll(); }, [loadAll]);

  const fetchDetail = async (id) => {
    if (detail?.id === id) { setDetail(null); return; }
    setDetLoading(true);
    const r = await javaFetch(`/api/pendientes/${id}`);
    setDetLoading(false);
    setDetail(r.ok ? r.data : { error: 'No encontrado' });
  };

  const statEntries = (obj) => obj ? Object.entries(obj) : [];

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.3)' }}
      />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 301,
        width: 420, background: 'var(--bg-1)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Pendientes Zeutica</div>
            <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>Api Java Server</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={loadAll} disabled={loading} title="Actualizar">
              <Icon name="refresh" size={14}/>
            </button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Cerrar">
              <Icon name="close" size={14}/>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Estadísticas</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <span className="td-muted" style={{ fontSize: 11 }}>En cola: <b>{stats.enCola ?? 0}</b></span>
              <span className="td-muted" style={{ fontSize: 11 }}>Atendidos: <b>{stats.atendidos ?? 0}</b></span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {statEntries(stats.porPrioridad).map(([k, v]) => (
                <span key={k} className={`badge badge-${prioTone(k)}`} style={{ fontSize: 11 }}>
                  <span className="badge-dot"/> {k}: {v}
                </span>
              ))}
            </div>
            {stats.porEstado && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {statEntries(stats.porEstado).map(([k, v]) => (
                  <span key={k} className={`badge badge-${estadoTone(k)}`} style={{ fontSize: 11 }}>
                    <span className="badge-dot"/> {k}: {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading && items.length === 0 && (
            <div className="empty" style={{ padding: 40 }}>
              <div className="spinner" style={{ width: 20, height: 20, margin: '0 auto 8px' }}/>
              <div>Cargando…</div>
            </div>
          )}
          {!loading && loadError && (
            <div className="empty" style={{ padding: 40 }}>
              <div className="empty-icon"><Icon name="close"/></div>
              <div style={{ color: 'var(--danger)' }}>Error de conexión</div>
              <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 4 }}>{loadError}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>Revisa CORS en el backend Java</div>
            </div>
          )}
          {!loading && !loadError && items.length === 0 && (
            <div className="empty" style={{ padding: 40 }}>
              <div className="empty-icon"><Icon name="ok"/></div>
              <div>Sin pendientes</div>
            </div>
          )}
          {items.map((item) => {
            const id = item.id ?? item.id_pendiente;
            const isOpen = detail?.id === id || detail?.id_pendiente === id;
            return (
              <div key={id ?? item.actividad}>
                <button
                  onClick={() => fetchDetail(id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
                    padding: '10px 20px', background: isOpen ? 'var(--bg-2)' : 'none',
                    border: 'none', borderBottom: '1px solid var(--line)', cursor: 'pointer',
                    textAlign: 'left', color: 'var(--fg-1)',
                  }}
                >
                  <span className={`badge badge-${prioTone(item.prioridad)}`} style={{ fontSize: 10, flexShrink: 0, marginTop: 2 }}>
                    {item.prioridad}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.actividad}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2, display: 'flex', gap: 8 }}>
                      <span>{item.usuario}</span>
                      {item.estado && (
                        <span className={`badge badge-${estadoTone(item.estado)}`} style={{ fontSize: 10 }}>
                          {item.estado}
                        </span>
                      )}
                      {item.fechaPromesa && <span>{window.fmt.date(item.fechaPromesa)}</span>}
                    </div>
                  </div>
                  <Icon name={isOpen ? 'chevUp' : 'chevRight'} size={12} style={{ color: 'var(--fg-3)', flexShrink: 0, marginTop: 4 }}/>
                </button>

                {/* Detalle inline */}
                {isOpen && (
                  <div style={{ padding: '12px 20px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                    {detLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-2)', fontSize: 12 }}>
                        <div className="spinner" style={{ width: 14, height: 14 }}/> Cargando detalle…
                      </div>
                    ) : detail?.error ? (
                      <div style={{ color: 'var(--danger)', fontSize: 12 }}>{detail.error}</div>
                    ) : detail && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Object.entries(detail).map(([k, v]) => v != null && v !== '' && (
                          <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                            <span style={{ color: 'var(--fg-2)', minWidth: 110, flexShrink: 0, textTransform: 'capitalize' }}>
                              {k.replace(/_/g, ' ')}
                            </span>
                            <span style={{ fontWeight: 500 }}>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}

const EMPTY_FORM = { usuario: 'fparra', actividad: '', prioridad: 'Media', estado: 'Pendiente', observaciones: '', fecha_promesa: '' };
const USUARIOS_PENDIENTE = ['fparra', 'ventas'];

function ModalAgregarPendiente({ onClose, onSaved }) {
  const toast = window.useToast();
  const [form, setForm] = gm_uS({ ...EMPTY_FORM });
  const [saving, setSaving] = gm_uS(false);
  const backdropRef = gm_uR(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.usuario.trim() || !form.actividad.trim()) {
      toast.warn('Campos requeridos', 'Usuario y actividad son obligatorios');
      return;
    }
    setSaving(true);
    const payload = {
      usuario:       form.usuario.trim(),
      actividad:     form.actividad.trim(),
      prioridad:     form.prioridad,
      estado:        form.estado,
      observaciones: form.observaciones.trim() || null,
      fecha_promesa: form.fecha_promesa || null,
    };
    // 1) Insertar en BD (FastAPI). 2) Recién entonces recargar cola Java —
    // si corren en paralelo, recargar lee BD antes del commit y trae datos viejos.
    const r = await window.api.agregarPendiente(payload);
    if (!r.ok) {
      setSaving(false);
      toast.error('Error al guardar', r.error || 'No se pudo conectar');
      return;
    }
    const rRecarga = await javaFetch('/api/recargar', { method: 'POST' });
    setSaving(false);
    if (!rRecarga.ok) {
      // Pendiente sí se guardó; solo falló recargar la cola Java.
      toast.warn('Guardado, sin recargar', 'No se pudo recargar cola Java: ' + (rRecarga.error || ''));
    } else {
      toast.success('Pendiente agregado', form.actividad);
    }
    onSaved();
    onClose();
  };

  return (
    <div
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.55)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: 'var(--bg-1)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 24, width: '100%', maxWidth: 480,
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Agregar pendiente</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" size={14}/>
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label className="field-label">Usuario <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select className="input" value={form.usuario} onChange={e => set('usuario', e.target.value)} required>
              {USUARIOS_PENDIENTE.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field-label">Actividad <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="input" value={form.actividad} onChange={e => set('actividad', e.target.value)} placeholder="Descripción de la actividad" required/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="field-label">Prioridad</label>
              <select className="input" value={form.prioridad} onChange={e => set('prioridad', e.target.value)}>
                <option>Alta</option>
                <option>Media</option>
                <option>Baja</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">Estado</label>
              <select className="input" value={form.estado} onChange={e => set('estado', e.target.value)}>
                <option>Pendiente</option>
                <option>En proceso</option>
                <option>Completado</option>
                <option>Cancelado</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label className="field-label">Observaciones</label>
            <textarea
              className="input"
              rows={3}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              value={form.observaciones}
              onChange={e => set('observaciones', e.target.value)}
              placeholder="Notas adicionales (opcional)"
            />
          </div>

          <div className="field">
            <label className="field-label">Fecha promesa</label>
            <input className="input" type="date" value={form.fecha_promesa} onChange={e => set('fecha_promesa', e.target.value)}/>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={saving}>
              <Icon name="plus" size={13}/> {saving ? 'Guardando…' : 'Agregar pendiente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const MONEY_KEYS = /monto|total|precio|saldo|importe|costo|valor|pago/i;
const DATE_KEYS  = /fecha|date|created|updated|registr/i;
const ID_KEYS    = /^id_|_id$|^id$/i;

function fmtCell(key, val) {
  if (val == null || val === '') return <span className="td-muted">—</span>;
  if (typeof val === 'boolean') return val ? 'Sí' : 'No';
  if (MONEY_KEYS.test(key) && !isNaN(Number(val))) return <span className="mono">{window.fmt.mxn(Number(val))}</span>;
  if (DATE_KEYS.test(key) && typeof val === 'string' && val.length > 7) {
    const d = new Date(val);
    if (!isNaN(d)) return <span className="td-muted">{window.fmt.datetime(val)}</span>;
  }
  if (ID_KEYS.test(key)) return <span className="mono td-muted" style={{ fontSize: 11 }}>#{String(val).slice(-8)}</span>;
  return String(val);
}

function fmtHeader(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function PageGerencia() {
  const toast = window.useToast();
  const [data, setData]         = gm_uS([]);
  const [loading, setLoading]   = gm_uS(false);
  const [lastUpdate, setLastUpdate] = gm_uS(null);
  const [tick, setTick]         = gm_uS(0);
  const [showForm, setShowForm]     = gm_uS(false);
  const [showDrawer, setShowDrawer] = gm_uS(false);

  const load = gm_uC(async () => {
    setLoading(true);
    const items = await window.api.pendientesRegistro();
    setData(Array.isArray(items) ? items : (items?.data ?? []));
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  gm_uE(() => {
    load();
    const refresh = setInterval(load, 30000);
    const tick    = setInterval(() => setTick(t => t + 1), 1000);
    return () => { clearInterval(refresh); clearInterval(tick); };
  }, [load]);

  const cols = data.length > 0 ? Object.keys(data[0]) : [];
  const secondsAgo = lastUpdate ? Math.floor((Date.now() - lastUpdate) / 1000) : null;

  return (
    <div className="page">
      {showForm && <ModalAgregarPendiente onClose={() => setShowForm(false)} onSaved={load}/>}
      {showDrawer && <DrawerJava onClose={() => setShowDrawer(false)}/>}
      <div className="section-header">
        <div>
          <h2 className="section-title">Monitor Gerencia</h2>
          <p className="section-subtitle">Pendientes de registro — actualización automática cada 30 s.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {secondsAgo !== null && (
            <span className="td-muted" style={{ fontSize: 12 }}>
              Actualizado hace {secondsAgo}s
            </span>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={load}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="refresh" size={13} style={loading ? { animation: 'spin 1s linear infinite' } : undefined}/>
            {loading ? 'Cargando…' : 'Actualizar'}
          </button>
          <button
            className={`btn btn-sm ${showDrawer ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setShowDrawer(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Ver pendientes Java"
          >
            <Icon name="eye" size={13}/> Monitor Procesos
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="plus" size={13}/> Agregar pendiente
          </button>
        </div>
      </div>

      <div className="dash-kpis">
        <window.MiniStat label="Pendientes" value={data.length} icon="clock"/>
        <window.MiniStat label="Última actualización" value={lastUpdate ? window.fmt.datetime(lastUpdate.toISOString()) : '—'} icon="eye"/>
        <window.MiniStat label="Estado" value={loading ? 'Cargando…' : data.length === 0 ? 'Sin pendientes' : 'Activo'} icon="ok" tone={data.length === 0 ? 'success' : 'warn'}/>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h3 className="card-title">Pendientes de registro</h3>
          {loading && <div className="spinner" style={{ width: 16, height: 16 }}/>}
        </div>
        <div className="table-wrap">
          {data.length === 0 && !loading ? (
            <div className="empty" style={{ padding: 48 }}>
              <div className="empty-icon"><Icon name="ok"/></div>
              <div>Sin pendientes de registro</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  {cols.map(k => (
                    <th key={k}>{fmtHeader(k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.id ?? row.id_registro ?? row.folio ?? i}>
                    {cols.map(k => (
                      <td key={k}>{fmtCell(k, row[k])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

window.PageGerencia = PageGerencia;
