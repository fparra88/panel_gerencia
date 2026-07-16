// ===== Zeutica — Clientes Potenciales (solo lectura: consulta, búsqueda y export CSV) =====
const { useState: cp_uS, useEffect: cp_uE, useMemo: cp_uM } = React;

// Columnas dinámicas: el shape del backend puede variar, así que las derivamos
// de la unión de llaves de todos los registros (orden de primera aparición).
function cpColumnas(lista) {
  const cols = [];
  const seen = new Set();
  for (const row of lista) {
    for (const k of Object.keys(row || {})) {
      if (!seen.has(k)) { seen.add(k); cols.push(k); }
    }
  }
  return cols;
}

// Encabezado legible: snake_case / camelCase a "Titulo Con Espacios".
const cpEtiqueta = (k) =>
  String(k)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const cpValor = (v) => {
  if (v == null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

// Escapado CSV estándar: comillas dobles si hay coma, comilla o salto de línea.
function cpCsvCell(v) {
  const s = cpValor(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function cpDescargarCsv(lista, columnas) {
  const filas = [
    columnas.map(cpEtiqueta).map(cpCsvCell).join(','),
    ...lista.map((row) => columnas.map((c) => cpCsvCell(row?.[c])).join(',')),
  ];
  // BOM para que Excel abra UTF-8 con acentos correctos.
  const blob = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `clientes-potenciales-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function PageClientesPotenciales() {
  const [lista, setLista]     = cp_uS([]);
  const [loading, setLoading] = cp_uS(true);
  const [error, setError]     = cp_uS(null);
  const [busqueda, setBusqueda] = cp_uS('');

  const cargar = async () => {
    setLoading(true);
    setError(null);
    const r = await window.api.clientesPotenciales();
    setLoading(false);
    if (!r.ok) {
      setError(r.error || 'No se pudo cargar clientes potenciales');
      setLista([]);
      return;
    }
    setLista(r.data);
  };

  cp_uE(() => { cargar(); }, []);

  const columnas = cp_uM(() => cpColumnas(lista), [lista]);

  // Búsqueda libre sobre todos los campos (case-insensitive).
  const filtrados = cp_uM(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((row) =>
      columnas.some((c) => cpValor(row?.[c]).toLowerCase().includes(q))
    );
  }, [lista, columnas, busqueda]);

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h2 className="section-title">Clientes Potenciales</h2>
          <p className="section-subtitle">Prospectos captados. Consulta, busca y descarga la información.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={cargar} disabled={loading}>
            <Icon name="refresh" size={13} style={loading ? { animation: 'spin 1s linear infinite' } : undefined}/> Actualizar
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => cpDescargarCsv(filtrados, columnas)}
            disabled={loading || filtrados.length === 0}
            title={busqueda ? 'Descarga solo los resultados filtrados' : 'Descarga todos los registros'}
          >
            <Icon name="download" size={13}/> Descargar CSV
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="field" style={{ minWidth: 260, flex: '0 1 340px' }}>
            <input
              className="input"
              type="search"
              placeholder="Buscar en todos los campos…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          {busqueda && (
            <span className="td-muted" style={{ fontSize: 12 }}>
              {filtrados.length} de {lista.length} registros
            </span>
          )}
        </div>

        <div className="table-wrap" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>{columnas.map((c) => <th key={c}>{cpEtiqueta(c)}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columnas.length || 1} className="empty">Cargando clientes potenciales…</td></tr>
              ) : error ? (
                <tr><td colSpan={columnas.length || 1} className="empty" style={{ color: 'var(--danger)' }}>{error}</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={columnas.length || 1} className="empty">{busqueda ? `Sin resultados para "${busqueda}"` : 'Sin clientes potenciales registrados'}</td></tr>
              ) : filtrados.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columnas.map((c) => <td key={c} style={{ fontSize: 13 }}>{cpValor(row?.[c]) || '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && filtrados.length > 0 && (
          <div className="card-footer td-muted" style={{ fontSize: 12, padding: '10px 16px' }}>
            {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

window.PageClientesPotenciales = PageClientesPotenciales;
