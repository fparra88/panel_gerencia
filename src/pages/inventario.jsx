// ===== Zeutica — Inventario =====
const { useState: inv_uS, useEffect: inv_uE, useMemo: inv_uM } = React;

function PageInventario({ user }) {
  const toast = window.useToast();
  const [loading, setLoading] = inv_uS(true);
  const [productos, setProductos] = inv_uS([]);
  const [q, setQ] = inv_uS('');
  const [cat, setCat] = inv_uS('Todas');
  const [stockFilter, setStockFilter] = inv_uS('todos');
  const [showNew, setShowNew] = inv_uS(false);

  inv_uE(() => { (async () => {
    setLoading(true);
    const data = await window.api.productos();
    setProductos(Array.isArray(data) ? data : []);
    setLoading(false);
  })(); }, []);

  const cats = inv_uM(() => ['Todas', ...Array.from(new Set(productos.map(p => p.categoria)))], [productos]);

  const filtered = inv_uM(() => productos.filter(p => {
    if (cat !== 'Todas' && p.categoria !== cat) return false;
    if (stockFilter === 'bajo' && p.stock_bodega >= p.stock_minimo) return false;
    if (stockFilter === 'critico' && p.stock_bodega >= p.stock_minimo * 0.3) return false;
    if (q && !`${p.sku} ${p.nombre} ${p.categoria}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [productos, q, cat, stockFilter]);

  const stats = inv_uM(() => {
    const total = productos.length;
    const bajo = productos.filter(p => p.stock_bodega < p.stock_minimo).length;
    const critico = productos.filter(p => p.stock_bodega < p.stock_minimo * 0.3).length;
    const valor = productos.reduce((s, p) => s + (p.stock_bodega * p.costo_total), 0);
    return { total, bajo, critico, valor };
  }, [productos]);

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h2 className="section-title">Inventario</h2>
          <p className="section-subtitle">Gestiona productos, niveles de stock y precios.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm"><Icon name="download" size={13}/> Exportar</button>
          {window.AppShell.GERENCIA_USERS?.includes(user) && <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Icon name="plus" size={13}/> Nuevo producto</button>}
        </div>
      </div>

      <div className="dash-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <MiniStat label="SKUs totales" value={window.fmt.int(stats.total)} icon="box"/>
        <MiniStat label="Stock bajo" value={stats.bajo} icon="alert" tone="warn"/>
        <MiniStat label="Stock crítico" value={stats.critico} icon="alert" tone="danger"/>
        <MiniStat label="Valor en bodega" value={window.fmt.mxn(stats.valor)} icon="wallet"/>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, maxWidth: 320 }}>
              <span className="input-group-icon"><Icon name="search" size={14}/></span>
              <input className="input" placeholder="Buscar por SKU, nombre..." value={q} onChange={e => setQ(e.target.value)}/>
            </div>
            <select className="select" style={{ width: 160 }} value={cat} onChange={e => setCat(e.target.value)}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
            <div className="tabs">
              <button className={`tab ${stockFilter === 'todos' ? 'active' : ''}`} onClick={() => setStockFilter('todos')}>Todos</button>
              <button className={`tab ${stockFilter === 'bajo' ? 'active' : ''}`} onClick={() => setStockFilter('bajo')}>Bajo</button>
              <button className={`tab ${stockFilter === 'critico' ? 'active' : ''}`} onClick={() => setStockFilter('critico')}>Crítico</button>
            </div>
          </div>
          <span className="badge">{filtered.length} productos</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr>
              <th>SKU</th><th>Producto</th><th>Categoría</th><th>Ubicación</th>
              <th className="td-right">Stock</th><th className="td-right">Mínimo</th>
              <th className="td-right">Costo</th><th className="td-right">Precio</th><th></th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}><span className="spinner"/></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="empty">Sin resultados</td></tr>
              ) : filtered.map(p => {
                const ratio = p.stock_bodega / p.stock_minimo;
                const tone = ratio < 0.3 ? 'danger' : ratio < 1 ? 'warn' : 'success';
                return (
                  <tr key={p.sku}>
                    <td className="mono" style={{ fontSize: 12 }}>{p.sku}</td>
                    <td>{p.nombre}</td>
                    <td><span className="badge">{p.categoria}</span></td>
                    <td className="td-muted mono" style={{ fontSize: 12 }}>{p.ubicacion}</td>
                    <td className="td-right mono"><span className={`badge badge-${tone}`}><span className="badge-dot"/>{p.stock_bodega}</span></td>
                    <td className="td-right td-muted mono">{p.stock_minimo}</td>
                    <td className="td-right mono">{window.fmt.mxn(p.costo_total)}</td>
                    <td className="td-right mono" style={{ fontWeight: 500 }}>{window.fmt.mxn(p.precio)}</td>
                    <td className="td-right">
                      {window.AppShell.GERENCIA_USERS.includes(user) ? (
                        <button className="btn btn-ghost btn-sm btn-icon" title="Editar"><Icon name="edit" size={13}/></button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Nuevo producto</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowNew(false)}><Icon name="x" size={14}/></button>
            </div>
            <div className="card-body" style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field"><label className="field-label">SKU</label><input className="input" placeholder="COFPLI-001"/></div>
                <div className="field"><label className="field-label">Categoría</label><input className="input" placeholder="COFIA"/></div>
              </div>
              <div className="field"><label className="field-label">Nombre</label><input className="input" placeholder="Producto..."/></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div className="field"><label className="field-label">Costo</label><input className="input" placeholder="0.00"/></div>
                <div className="field"><label className="field-label">Precio A</label><input className="input" placeholder="0.00"/></div>
                <div className="field"><label className="field-label">Stock mín.</label><input className="input" placeholder="300"/></div>
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={() => { toast.success('Producto creado', 'Se agregó al inventario'); setShowNew(false); }}>Crear producto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, icon, tone }) {
  const toneMap = { warn: 'var(--warn)', danger: 'var(--danger)', success: 'var(--success)' };
  return (
    <div className="kpi">
      <span className="kpi-label" style={{ color: tone ? toneMap[tone] : undefined }}><Icon name={icon} size={12}/> {label}</span>
      <div className="kpi-value" style={{ fontSize: 22, marginTop: 6 }}>{value}</div>
    </div>
  );
}

window.PageInventario = PageInventario;
window.MiniStat = MiniStat;
