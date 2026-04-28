// ===== Zeutica — Remaining Pages (compact) =====
const { useState: rp_uS, useEffect: rp_uE, useMemo: rp_uM } = React;

async function generarPDFCotizacion({ codigo, clienteObj, clienteNombre, items, descuentoPct, descuentoMonto, subtotalOriginal, subtotalDesc, costoEnvio, iva, totalFinal, formaPago, comentario }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = 210, M = 10;
  const fmt = v => `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // -- Logo --
  try {
    const resp = await fetch('logo.png');
    if (resp.ok) {
      const blob = await resp.blob();
      const b64 = await new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(blob); });
      doc.addImage(b64, 'PNG', M, 8, 40, 15);
    }
  } catch(_) {}

  // -- Company info --
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text([
    'Domicilio: Reporteros 44, Col. Los Periodistas, CP: 45078, Zapopan, Jalisco.',
    'www.zeutica.com',
    'Teléfono: 33-1299-5688',
    'E-mail: ventas1@zeutica.com',
    'Asesor: Cecilia Parra',
  ], M, 28, { lineHeightFactor: 1.6 });

  // -- Cotizacion title + date boxes --
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`COTIZACION ${codigo}`, PW - M, 15, { align: 'right' });

  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  doc.setFontSize(9);
  [['Fecha:', fecha], ['Válido Hasta:', '7 Días']].forEach(([label, val], idx) => {
    const yy = 24 + idx * 6;
    doc.rect(140, yy, 30, 6);
    doc.rect(170, yy, 30, 6);
    doc.setFont('helvetica', 'bold'); doc.text(label, 142, yy + 4.5);
    doc.setFont('helvetica', 'normal'); doc.text(val, 199, yy + 4.5, { align: 'right' });
  });

  // -- Client section --
  let y = 55;
  doc.setFillColor(0, 74, 153);
  doc.rect(M, y, PW - 2 * M, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('   CLIENTE', M, y + 5.5);
  doc.setTextColor(0, 0, 0);
  y += 12;

  const filaCliente = (label, valor) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text(label, M, y);
    doc.setFont('helvetica', 'normal'); doc.text(String(valor || 'N/A'), M + 26, y);
    y += 6;
  };
  filaCliente('NOMBRE:', clienteNombre);
  filaCliente('EMPRESA:', clienteObj.empresa || clienteNombre);
  filaCliente('EMAIL:', clienteObj.email || '');
  filaCliente('DOMICILIO:', clienteObj.direccion || clienteObj.domicilio || '');
  filaCliente('TELÉFONO:', clienteObj.telefono || '');
  y += 5;

  // -- Products table header --
  const colW = [30, 80, 20, 30, 30];
  const heads = ['CÓDIGO / SKU', 'DESCRIPCIÓN', 'CANT', 'PRECIO', 'TOTAL'];
  doc.setFillColor(240, 240, 240);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  let x = M;
  heads.forEach((h, i) => {
    doc.rect(x, y, colW[i], 8, 'FD');
    doc.text(h, x + colW[i] / 2, y + 5.5, { align: 'center' });
    x += colW[i];
  });
  y += 8;

  // -- Rows --
  const disc = 1 - descuentoPct / 100;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  items.forEach(item => {
    const rowH = 8;
    x = M;
    const pUnit = item.precio * disc;
    const pTot  = item.cantidad * pUnit;
    const cells = [
      { v: item.sku,                    align: 'center', w: colW[0] },
      { v: item.nombre.slice(0, 50),    align: 'left',   w: colW[1], offsetX: 2 },
      { v: String(item.cantidad),       align: 'center', w: colW[2] },
      { v: fmt(pUnit),                  align: 'right',  w: colW[3], offsetX: -2 },
      { v: fmt(pTot),                   align: 'right',  w: colW[4], offsetX: -2 },
    ];
    cells.forEach(c => {
      doc.rect(x, y, c.w, rowH, 'S');
      const tx = c.align === 'center' ? x + c.w / 2 : c.align === 'right' ? x + c.w + (c.offsetX || 0) : x + (c.offsetX || 0);
      doc.text(c.v, tx, y + 5, { align: c.align });
      x += c.w;
    });
    y += rowH;
  });
  y += 4;

  // -- Totals --
  const xT = 140;
  const filaTotal = (label, valor, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    if (bold) doc.setFillColor(220, 220, 220);
    doc.rect(xT, y, 30, 6, bold ? 'FD' : 'S');
    doc.rect(xT + 30, y, 30, 6, bold ? 'FD' : 'S');
    doc.text(label, xT + 28, y + 4.5, { align: 'right' });
    doc.text(valor, xT + 59, y + 4.5, { align: 'right' });
    y += 6;
  };
  filaTotal('Sub-Total:', fmt(subtotalOriginal));
  if (descuentoPct > 0) filaTotal(`Descuento (${descuentoPct}%):`, `-${fmt(descuentoMonto)}`);
  filaTotal('Costo del Envío:', fmt(costoEnvio));
  filaTotal('IVA (16%):', fmt(iva));
  filaTotal('TOTAL:', fmt(totalFinal), true);
  y += 8;

  // -- Terms --
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('TÉRMINOS Y CONDICIONES', M, y); y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  const terms = [
    `1. FORMA DE PAGO: ${formaPago.toUpperCase()}`,
    '2. COTIZACIÓN EN: PESO MEXICANO (MXN)',
    '3. PRECIOS SUJETOS A CAMBIO SIN PREVIO AVISO.',
  ];
  terms.forEach(t => { doc.text(t, M, y); y += 5; });
  const coment4 = doc.splitTextToSize(`4. COMENTARIOS: ${comentario}`, PW - 2 * M);
  doc.text(coment4, M, y);

  // -- Footer (all pages) --
  const total_pages = doc.getNumberOfPages();
  for (let p = 1; p <= total_pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('Si tienes alguna pregunta por favor contáctanos', PW / 2, 272, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Tel: 33-1299-5688 / E-mail: ventas1@zeutica.com', PW / 2, 277, { align: 'center' });
    doc.text(`Página ${p}`, PW - M, 282, { align: 'right' });
  }

  return doc.output('arraybuffer');
}

// ---------- Cotizaciones ----------
const COT_COMENTARIOS = [
  'ENVIO GRATIS EN COMPRAS MAYORES A $7000.00 MAS IVA, TIEMPO DE ENTREGA DE 4-7 DIAS HABILES.',
  'EL ENVIO SE REALIZARA POR PAQUETERIA PAQUETE EXPRESS EN CASO DE REQUERIR UNA PAQUETERIA EN PARTICULAR ESTA SE COTIZARA DE MANERA ADICIONAL.',
  'ENTREGA EN BODEGA, HORARIO DE 10AM A 2PM',
  'OTROS...',
];

function PageCotizaciones({ user }) {
  const toast = window.useToast();
  const [cots, setCots] = rp_uS([]);
  const [q, setQ] = rp_uS('');
  const [estado, setEstado] = rp_uS('todos');

  // form state
  const [showForm, setShowForm] = rp_uS(false);
  const [clientes, setClientes] = rp_uS([]);
  const [productos, setProductos] = rp_uS([]);
  const [nuevoCodigo, setNuevoCodigo] = rp_uS('');
  const [selectedCliente, setSelectedCliente] = rp_uS('');
  const [selectedSku, setSelectedSku] = rp_uS('');
  const [listaPrecio, setListaPrecio] = rp_uS('precio');
  const [cantidad, setCantidad] = rp_uS(1);
  const [precioManual, setPrecioManual] = rp_uS(0);
  const [items, setItems] = rp_uS([]);
  const [descuento, setDescuento] = rp_uS(0);
  const [incluirEnvio, setIncluirEnvio] = rp_uS(true);
  const [formaPago, setFormaPago] = rp_uS('CONTADO');
  const [comentario, setComentario] = rp_uS(COT_COMENTARIOS[0]);
  const [comentarioCustom, setComentarioCustom] = rp_uS('');
  const [submitting, setSubmitting] = rp_uS(false);
  const [verLoading, setVerLoading] = rp_uS(null);

  rp_uE(() => { (async () => setCots(await window.api.cotizaciones()))(); }, []);

  rp_uE(() => {
    if (!showForm) return;
    (async () => {
      const [cls, prods, codigo] = await Promise.all([
        window.api.clientes(),
        window.api.productos(),
        window.api.nuevoCodigo(),
      ]);
      setClientes(cls);
      setProductos(prods);
      setNuevoCodigo(codigo);
      if (prods.length > 0) {
        setSelectedSku(prods[0].sku);
        setPrecioManual(Number(prods[0].precio) || 0);
      }
    })();
  }, [showForm]);

  const prodObj = rp_uM(() => productos.find(p => p.sku === selectedSku), [productos, selectedSku]);

  rp_uE(() => {
    if (!prodObj) return;
    const map = { precio: prodObj.precio, precio_2: prodObj.precio_2, precio_3: prodObj.precio_3 };
    setPrecioManual(Number(map[listaPrecio]) || 0);
  }, [selectedSku, listaPrecio]);

  // totals
  const subtotalOriginal = rp_uM(() => items.reduce((s, i) => s + i.total, 0), [items]);
  const descuentoMonto   = subtotalOriginal * (descuento / 100);
  const subtotalDesc     = subtotalOriginal - descuentoMonto;
  const envioBase        = (subtotalDesc * 1.16) > (7000 * 1.16) ? 0 : 350;
  const costoEnvio       = incluirEnvio ? envioBase : 0;
  const baseIva          = subtotalDesc + costoEnvio;
  const iva              = baseIva * 0.16;
  const totalFinal       = baseIva + iva;

  const agregarItem = () => {
    if (!selectedSku || cantidad < 1 || precioManual <= 0) return;
    setItems(prev => [...prev, {
      sku: selectedSku,
      nombre: prodObj?.nombre || selectedSku,
      cantidad,
      precio: precioManual,
      total: cantidad * precioManual,
    }]);
  };

  const removerItem = idx => setItems(prev => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setShowForm(false); setItems([]); setDescuento(0);
    setSelectedCliente(''); setFormaPago('CONTADO');
    setComentario(COT_COMENTARIOS[0]); setComentarioCustom('');
    setIncluirEnvio(true);
  };

  const guardar = async () => {
    if (!selectedCliente || items.length === 0) {
      toast.error('Formulario incompleto', 'Selecciona cliente y agrega al menos un producto');
      return;
    }
    setSubmitting(true);
    const clienteObj = clientes.find(c => c.nombre === selectedCliente) || {};
    const comentarioFinal = comentario === 'OTROS...' ? comentarioCustom : comentario;
    const disc = descuento / 100;

    // Generate PDF
    let pdfBase64 = '';
    try {
      const buf = await generarPDFCotizacion({
        codigo: nuevoCodigo,
        clienteObj,
        clienteNombre: selectedCliente,
        items,
        descuentoPct: descuento,
        descuentoMonto,
        subtotalOriginal,
        subtotalDesc,
        costoEnvio,
        iva,
        totalFinal,
        formaPago,
        comentario: comentarioFinal,
      });
      const bytes = new Uint8Array(buf);
      let bin = '';
      bytes.forEach(b => bin += String.fromCharCode(b));
      pdfBase64 = btoa(bin);
    } catch(e) {
      toast.warn('PDF no generado', 'Se guardará sin archivo adjunto');
    }

    const payload = {
      codigo_cotizacion: nuevoCodigo,
      empresa: selectedCliente,
      atencion: clienteObj.atencion || '',
      email: clienteObj.email || '',
      domicilio: clienteObj.direccion || clienteObj.domicilio || '',
      telefono: clienteObj.telefono || '',
      subtotal: Math.round(subtotalDesc * 100) / 100,
      iva: Math.round(iva * 100) / 100,
      total: Math.round(totalFinal * 100) / 100,
      costo_envio: Math.round(costoEnvio * 100) / 100,
      forma_pago: formaPago,
      comentarios: comentarioFinal,
      usuario: user || '',
      pdf: pdfBase64,
      items: items.map(i => ({
        sku: i.sku,
        nombre_producto: i.nombre,
        cantidad: i.cantidad,
        precio_unitario: Math.round(i.precio * (1 - disc) * 100) / 100,
        total_linea: Math.round(i.cantidad * i.precio * (1 - disc) * 100) / 100,
      })),
    };

    const r = await window.api.guardarCotizacion(payload);
    setSubmitting(false);
    if (r.ok) {
      toast.success('Cotización guardada', `${nuevoCodigo} · ${selectedCliente}`);
      // Auto-download PDF
      if (pdfBase64) {
        const a = document.createElement('a');
        a.href = `data:application/pdf;base64,${pdfBase64}`;
        a.download = `Cotizacion_${nuevoCodigo}_${selectedCliente}.pdf`;
        a.click();
      }
      setCots(await window.api.cotizaciones());
      resetForm();
    } else {
      toast.error('Error al guardar', 'Verifica conexión con el servidor');
    }
  };

  const verCotizacion = async (codigo) => {
    setVerLoading(codigo);
    try {
      const data = await window.api.cotizacionDetalle(codigo);
      if (data?.pdf) {
        const byteChars = atob(data.pdf);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArr], { type: 'application/pdf' });
        window.open(URL.createObjectURL(blob), '_blank');
      } else {
        toast.warn('Sin PDF', 'Esta cotización no tiene PDF adjunto');
      }
    } catch(_) {
      toast.error('Error', 'No se pudo cargar la cotización');
    } finally {
      setVerLoading(null);
    }
  };

  const filtered = cots.filter(c => {
    if (estado === 'abiertas' && c.vendido) return false;
    if (estado === 'vendidas' && !c.vendido) return false;
    if (q && !`${c.codigo_cotizacion} ${c.empresa}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const abiertas = cots.filter(c => !c.vendido).length;
  const totalAbiertas = cots.filter(c => !c.vendido).reduce((s, c) => s + c.subtotal, 0);

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h2 className="section-title">Cotizaciones</h2>
          <p className="section-subtitle">Genera y da seguimiento a cotizaciones de clientes.</p>
        </div>
        <button className={`btn btn-sm ${showForm ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setShowForm(v => !v)}>
          <Icon name="plus" size={13}/> {showForm ? 'Cerrar' : 'Nueva cotización'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Generador de cotizaciones</h3>
              <p className="card-subtitle mono" style={{ fontSize: 11 }}>{nuevoCodigo || '...'}</p>
            </div>
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 20 }}>

            {/* 1. Cliente */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-2)', marginBottom: 10 }}>1. Datos del cliente</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label className="field-label">Cliente / Empresa</label>
                  <select className="select" value={selectedCliente} onChange={e => setSelectedCliente(e.target.value)}>
                    <option value="">Selecciona cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
                {selectedCliente && (() => {
                  const c = clientes.find(x => x.nombre === selectedCliente);
                  return c ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div className="field"><label className="field-label">Email</label><input className="input" value={c.email || ''} disabled/></div>
                      <div className="field"><label className="field-label">Teléfono</label><input className="input" value={c.telefono || ''} disabled/></div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            {/* 2. Productos */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-2)', marginBottom: 10 }}>2. Productos y precios</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="field">
                    <label className="field-label">Producto</label>
                    <select className="select" value={selectedSku} onChange={e => setSelectedSku(e.target.value)}>
                      {productos.map(p => <option key={p.sku} value={p.sku}>{p.sku} — {p.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Lista de precios</label>
                    <div className="tabs" style={{ marginTop: 4 }}>
                      {[['precio','Precio A'],['precio_2','Precio B'],['precio_3','Precio C']].map(([k,v]) => (
                        <button key={k} className={`tab ${listaPrecio === k ? 'active' : ''}`} onClick={() => setListaPrecio(k)}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="field">
                      <label className="field-label">Cantidad</label>
                      <input className="input" type="number" min="1" value={cantidad} onChange={e => setCantidad(Math.max(1, Number(e.target.value) || 1))}/>
                    </div>
                    <div className="field">
                      <label className="field-label">Precio unitario</label>
                      <input className="input mono" type="number" step="0.01" value={precioManual} onChange={e => setPrecioManual(Number(e.target.value) || 0)}/>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={agregarItem}>
                    <Icon name="plus" size={13}/> Agregar producto
                  </button>
                </div>

                <div>
                  {items.length === 0 ? (
                    <div className="empty" style={{ padding: 24 }}>
                      <div className="empty-icon"><Icon name="doc"/></div>
                      <div>Sin productos agregados</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {items.map((i, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', background: 'var(--bg-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{i.sku}</div>
                            <div style={{ fontSize: 12, fontWeight: 500 }} className="truncate">{i.nombre}</div>
                            <div className="mono" style={{ fontSize: 11 }}>{i.cantidad} × {window.fmt.mxn(i.precio)}</div>
                          </div>
                          <div className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{window.fmt.mxn(i.total)}</div>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removerItem(idx)}><Icon name="x" size={12}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Descuento + Totales */}
            {items.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'start' }}>
                <div className="field">
                  <label className="field-label">Descuento (%)</label>
                  <input className="input mono" type="number" min="0" max="100" value={descuento} onChange={e => setDescuento(Number(e.target.value) || 0)}/>
                </div>
                <div style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--line)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--fg-2)' }}>Subtotal</span>
                    <span className="mono">{window.fmt.mxn(subtotalOriginal)}</span>
                  </div>
                  {descuento > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                      <span>Descuento ({descuento}%)</span>
                      <span className="mono">-{window.fmt.mxn(descuentoMonto)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--fg-2)', userSelect: 'none' }}>
                      <input type="checkbox" checked={incluirEnvio} onChange={e => setIncluirEnvio(e.target.checked)}/>
                      Envío{envioBase === 0 ? ' (gratis)' : ''}
                    </label>
                    <span className="mono">{window.fmt.mxn(costoEnvio)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--fg-2)' }}>IVA (16%)</span>
                    <span className="mono">{window.fmt.mxn(iva)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, borderTop: '1px solid var(--line)', paddingTop: 6 }}>
                    <span>Total</span>
                    <span className="mono">{window.fmt.mxn(totalFinal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Condiciones */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-2)', marginBottom: 10 }}>3. Condiciones finales</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label className="field-label">Forma de pago</label>
                  <input className="input" value={formaPago} onChange={e => setFormaPago(e.target.value)}/>
                </div>
                <div className="field">
                  <label className="field-label">Comentarios / Envío</label>
                  <select className="select" value={comentario} onChange={e => setComentario(e.target.value)}>
                    {COT_COMENTARIOS.map(c => <option key={c} value={c}>{c.length > 55 ? c.slice(0, 55) + '…' : c}</option>)}
                  </select>
                </div>
              </div>
              {comentario === 'OTROS...' && (
                <div className="field" style={{ marginTop: 10 }}>
                  <label className="field-label">Comentario personalizado</label>
                  <textarea className="input" rows={2} value={comentarioCustom} onChange={e => setComentarioCustom(e.target.value)} style={{ height: 'auto', resize: 'vertical' }}/>
                </div>
              )}
            </div>
          </div>

          <div className="card-footer">
            <button className="btn btn-secondary btn-sm" onClick={resetForm}>Cancelar</button>
            <button className="btn btn-primary btn-sm" disabled={!selectedCliente || items.length === 0 || submitting} onClick={guardar}>
              {submitting
                ? <><span className="spinner"/> Guardando...</>
                : <><Icon name="check" size={13}/> Guardar cotización{nuevoCodigo ? ` · ${nuevoCodigo}` : ''}</>}
            </button>
          </div>
        </div>
      )}

      <div className="dash-kpis">
        <window.MiniStat label="Total cotizaciones" value={cots.length} icon="doc"/>
        <window.MiniStat label="Abiertas" value={abiertas} icon="clock" tone="warn"/>
        <window.MiniStat label="Vendidas" value={cots.filter(c => c.vendido).length} icon="check" tone="success"/>
        <window.MiniStat label="Valor en pipeline" value={window.fmt.mxn(totalAbiertas)} icon="cash"/>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            <div className="input-group" style={{ maxWidth: 320, flex: 1 }}>
              <span className="input-group-icon"><Icon name="search" size={14}/></span>
              <input className="input" placeholder="Buscar cotización o cliente..." value={q} onChange={e => setQ(e.target.value)}/>
            </div>
            <div className="tabs">
              <button className={`tab ${estado === 'todos' ? 'active' : ''}`} onClick={() => setEstado('todos')}>Todas</button>
              <button className={`tab ${estado === 'abiertas' ? 'active' : ''}`} onClick={() => setEstado('abiertas')}>Abiertas</button>
              <button className={`tab ${estado === 'vendidas' ? 'active' : ''}`} onClick={() => setEstado('vendidas')}>Vendidas</button>
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Código</th><th>Cliente</th><th>Fecha</th><th className="td-right">Items</th><th className="td-right">Subtotal</th><th className="td-right">Total</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.codigo_cotizacion}>
                  <td className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{c.codigo_cotizacion}</td>
                  <td>{c.empresa}</td>
                  <td className="td-muted">{window.fmt.date(c.fecha)}</td>
                  <td className="td-right mono">{c.items_count}</td>
                  <td className="td-right mono">{window.fmt.mxn(c.subtotal)}</td>
                  <td className="td-right mono" style={{ fontWeight: 500 }}>{window.fmt.mxn(c.total)}</td>
                  <td>
                    <span className={`badge badge-${c.vendido ? 'success' : c.estado === 'Seguimiento' ? 'warn' : 'info'}`}>
                      <span className="badge-dot"/>{c.estado}
                    </span>
                  </td>
                  <td className="td-right">
                    <button className="btn btn-ghost btn-sm" disabled={verLoading === c.codigo_cotizacion} onClick={() => verCotizacion(c.codigo_cotizacion)}>
                      {verLoading === c.codigo_cotizacion ? <span className="spinner"/> : <>Ver <Icon name="chevRight" size={12}/></>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Clientes ----------
const CLIENTE_BLANK = { nombre: '', empresa: '', atencion: '', email: '', telefono: '', ciudad: '', domicilio: '', credito: false };

function PageClientes() {
  const toast = window.useToast();
  const [cli, setCli] = rp_uS([]);
  const [q, setQ] = rp_uS('');
  const [showForm, setShowForm] = rp_uS(false);
  const [form, setForm] = rp_uS(CLIENTE_BLANK);
  const [saving, setSaving] = rp_uS(false);

  rp_uE(() => { (async () => setCli(await window.api.clientes()))(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error('Campo requerido', 'El nombre del cliente es obligatorio'); return; }
    setSaving(true);
    const r = await window.api.crearCliente(form);
    setSaving(false);
    if (r.ok) {
      toast.success('Cliente creado', form.nombre);
      setCli(await window.api.clientes());
      setForm(CLIENTE_BLANK);
      setShowForm(false);
    } else {
      toast.error('Error al guardar', 'Verifica conexión con el servidor');
    }
  };

  const filtered = cli.filter(c => !q || `${c.nombre} ${c.email} ${c.ciudad}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="page">
      <div className="section-header">
        <div><h2 className="section-title">Clientes</h2><p className="section-subtitle">Directorio completo con línea de crédito y saldos.</p></div>
        <button className={`btn btn-sm ${showForm ? 'btn-secondary' : 'btn-primary'}`} onClick={() => { setShowForm(v => !v); setForm(CLIENTE_BLANK); }}>
          <Icon name="plus" size={13}/> {showForm ? 'Cerrar' : 'Nuevo cliente'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3 className="card-title">Nuevo cliente</h3></div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field"><label className="field-label">Nombre *</label>
              <input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre completo o razón social"/></div>
            <div className="field"><label className="field-label">Empresa</label>
              <input className="input" value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Empresa (si aplica)"/></div>
            <div className="field"><label className="field-label">Atención / Contacto</label>
              <input className="input" value={form.atencion} onChange={e => set('atencion', e.target.value)} placeholder="Nombre del contacto"/></div>
            <div className="field"><label className="field-label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="correo@empresa.mx"/></div>
            <div className="field"><label className="field-label">Teléfono</label>
              <input className="input" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="33-0000-0000"/></div>
            <div className="field"><label className="field-label">Ciudad</label>
              <input className="input" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="Guadalajara"/></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label className="field-label">Domicilio</label>
              <input className="input" value={form.domicilio} onChange={e => set('domicilio', e.target.value)} placeholder="Calle, número, colonia, CP"/></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontSize: 13 }}>
                <input type="checkbox" checked={form.credito} onChange={e => set('credito', e.target.checked)}/>
                Habilitar línea de crédito
              </label>
            </div>
          </div>
          <div className="card-footer">
            <button className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); setForm(CLIENTE_BLANK); }}>Cancelar</button>
            <button className="btn btn-primary btn-sm" disabled={!form.nombre.trim() || saving} onClick={guardar}>
              {saving ? <><span className="spinner"/> Guardando...</> : <><Icon name="check" size={13}/> Guardar cliente</>}
            </button>
          </div>
        </div>
      )}

      <div className="dash-kpis">
        <window.MiniStat label="Clientes activos" value={cli.length} icon="users"/>
        <window.MiniStat label="Con crédito" value={cli.filter(c => c.credito).length} icon="check" tone="success"/>
        <window.MiniStat label="Saldo total" value={window.fmt.mxn(cli.reduce((s,c) => s + c.saldo, 0))} icon="wallet"/>
        <window.MiniStat label="Ciudades" value={new Set(cli.map(c => c.ciudad)).size} icon="globe"/>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="input-group" style={{ maxWidth: 320, flex: 1 }}>
            <span className="input-group-icon"><Icon name="search" size={14}/></span>
            <input className="input" placeholder="Buscar cliente..." value={q} onChange={e => setQ(e.target.value)}/>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Cliente</th><th>Email</th><th>Teléfono</th><th>Ciudad</th><th>Crédito</th><th className="td-right">Saldo</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="mono td-muted">#{c.id}</td>
                  <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                  <td className="td-muted">{c.email}</td>
                  <td className="mono td-muted" style={{ fontSize: 12 }}>{c.telefono}</td>
                  <td className="td-muted">{c.ciudad}</td>
                  <td>{c.credito ? <span className="badge badge-success"><span className="badge-dot"/>Activo</span> : <span className="badge">No</span>}</td>
                  <td className="td-right mono" style={{ fontWeight: c.saldo > 0 ? 500 : 400, color: c.saldo > 0 ? 'var(--warn)' : 'var(--fg-2)' }}>{window.fmt.mxn(c.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Reportes ----------
function PageReportes() {
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const defaultTo   = today.toISOString().slice(0, 10);

  const [ventas, setVentas]     = rp_uS([]);
  const [loading, setLoading]   = rp_uS(true);
  const [dateFrom, setDateFrom] = rp_uS(defaultFrom);
  const [dateTo, setDateTo]     = rp_uS(defaultTo);
  const [q, setQ]               = rp_uS('');

  rp_uE(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await window.api.ventasMes(dateFrom, dateTo);
      if (!cancelled) { setVentas(Array.isArray(data) ? data : []); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [dateFrom, dateTo]);

  const filtered = rp_uM(() => {
    if (!q.trim()) return ventas;
    const lq = q.toLowerCase();
    return ventas.filter(v =>
      (v.producto       || '').toLowerCase().includes(lq) ||
      (v.nombreComprador|| '').toLowerCase().includes(lq) ||
      (v.plataforma     || '').toLowerCase().includes(lq) ||
      (v.condicion_pago || '').toLowerCase().includes(lq) ||
      (v.usuario        || '').toLowerCase().includes(lq) ||
      String(v.id_venta || '').includes(lq)
    );
  }, [ventas, q]);

  const byUser = rp_uM(() => {
    const m = {};
    filtered.forEach(v => { m[v.usuario] = (m[v.usuario] || 0) + (v.cantidad * v.precio); });
    return Object.entries(m).map(([label, value]) => ({ label, value, color: 'var(--c1)' }));
  }, [filtered]);

  const totalMonto   = rp_uM(() => filtered.reduce((s, v) => s + v.cantidad * v.precio, 0), [filtered]);
  const plataformas  = rp_uM(() => new Set(filtered.map(v => v.plataforma)).size, [filtered]);

  const descargarCSV = () => {
    const header = ['ID','Fecha','Producto','Cliente','Plataforma','Pago','Vendedor','Cantidad','Precio','Total'];
    const rows = filtered.map(v => [
      v.id_venta, v.fecha, v.producto, v.nombreComprador,
      v.plataforma, v.condicion_pago, v.usuario,
      v.cantidad, v.precio, v.cantidad * v.precio,
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `ventas_${dateFrom}_${dateTo}.csv`;
    a.click();
  };

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h2 className="section-title">Reportes de ventas</h2>
          <p className="section-subtitle">Filtra y exporta ventas por fecha, producto, cliente o vendedor.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={descargarCSV} disabled={filtered.length === 0}>
          <Icon name="download" size={13}/> Descargar CSV
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: '0 0 auto' }}>
            <label className="field-label">Fecha inicio</label>
            <input className="input" type="date" value={dateFrom} max={dateTo}
              onChange={e => setDateFrom(e.target.value)} style={{ width: 150 }}/>
          </div>
          <div className="field" style={{ flex: '0 0 auto' }}>
            <label className="field-label">Fecha fin</label>
            <input className="input" type="date" value={dateTo} min={dateFrom} max={defaultTo}
              onChange={e => setDateTo(e.target.value)} style={{ width: 150 }}/>
          </div>
          <div className="field" style={{ flex: '1 1 200px', minWidth: 180 }}>
            <label className="field-label">Buscar</label>
            <div className="input-group">
              <span className="input-group-icon"><Icon name="search" size={14}/></span>
              <input className="input" placeholder="Producto, cliente, plataforma, vendedor…"
                value={q} onChange={e => setQ(e.target.value)}/>
            </div>
          </div>
          {(q || dateFrom !== defaultFrom || dateTo !== defaultTo) && (
            <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end', marginBottom: 1 }}
              onClick={() => { setQ(''); setDateFrom(defaultFrom); setDateTo(defaultTo); }}>
              <Icon name="x" size={12}/> Limpiar
            </button>
          )}
          {loading && <div className="spinner" style={{ alignSelf: 'flex-end', marginBottom: 6 }}/>}
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Ventas por vendedor</h3></div>
          <div className="card-body">
            {byUser.length === 0
              ? <div className="empty" style={{ padding: 24 }}><div>Sin datos para el rango seleccionado</div></div>
              : <window.Charts.HBarChart data={byUser}/>
            }
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Resumen del período</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total del período</div>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>{window.fmt.mxn(totalMonto)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transacciones</div>
              <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{filtered.length}{ventas.length !== filtered.length && <span style={{ fontSize: 12, color: 'var(--fg-2)', fontWeight: 400, marginLeft: 6 }}>de {ventas.length}</span>}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plataformas</div>
              <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{plataformas}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h3 className="card-title">Detalle de ventas</h3>
          <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Fecha</th><th>Producto</th><th>Cliente</th>
                <th>Plataforma</th><th>Pago</th><th>Vendedor</th>
                <th className="td-right">Cant.</th><th className="td-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9}>
                  <div className="empty" style={{ padding: 32 }}>
                    <div className="empty-icon"><Icon name="search"/></div>
                    <div>{loading ? 'Cargando…' : 'Sin resultados para los filtros aplicados'}</div>
                  </div>
                </td></tr>
              ) : filtered.map(v => (
                <tr key={v.id_venta}>
                  <td className="mono td-muted" style={{ fontSize: 11 }}>#{String(v.id_venta).slice(-6)}</td>
                  <td className="td-muted">{window.fmt.datetime(v.fecha)}</td>
                  <td>{v.producto}</td>
                  <td className="td-muted">{v.nombreComprador}</td>
                  <td><span className="badge">{v.plataforma}</span></td>
                  <td><span className={`badge badge-${v.condicion_pago === 'CREDITO' ? 'warn' : 'success'}`}>{v.condicion_pago}</span></td>
                  <td className="td-muted">{v.usuario}</td>
                  <td className="td-right mono">{v.cantidad}</td>
                  <td className="td-right mono" style={{ fontWeight: 500 }}>{window.fmt.mxn(v.cantidad * v.precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Traspaso FULL ----------
function PageFull() {
  const toast = window.useToast();
  const [productos, setProductos] = rp_uS([]);
  const [traspasos, setTraspasos] = rp_uS([]);
  const [submitting, setSubmitting] = rp_uS(false);

  const [destino, setDestino]     = rp_uS('Cleanest Choice');
  const [selectedSku, setSelectedSku] = rp_uS('');
  const [cantidad, setCantidad]   = rp_uS(50);
  const [fecha, setFecha]         = rp_uS(new Date().toISOString().slice(0, 10));

  const cargarDatos = async () => {
    const [prods, tras] = await Promise.all([
      window.api.productos(),
      window.api.traspasos(),
    ]);
    setProductos(prods);
    if (prods.length > 0 && !selectedSku) setSelectedSku(prods[0].sku);
    setTraspasos(tras);
  };

  rp_uE(() => { cargarDatos(); }, []);

  const registrar = async () => {
    if (!selectedSku || cantidad < 1) {
      toast.error('Datos incompletos', 'Selecciona SKU y cantidad válida');
      return;
    }
    setSubmitting(true);
    const payload = {
      usuario: window.api.usuario || '',
      movimientos: [{ sku: selectedSku, stock_bodega:cantidad }],
      almacen: destino,
    };
    const r = await window.api.registrarTraspaso(payload);
    setSubmitting(false);
    if (r.ok) {
      toast.success('Traspaso registrado', `${selectedSku} → ${destino}`);
      setCantidad(50);
      await cargarDatos();
    } else {
      toast.error('Error al registrar', 'Verifica conexión con el servidor');
    }
  };

  return (
    <div className="page">
      <div className="section-header">
        <div><h2 className="section-title">Traspaso FULL</h2><p className="section-subtitle">Transferencias a bodegas de Amazon FBA y Mercado Libre FULL.</p></div>
      </div>
      <div className="dash-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Nuevo traspaso</h3></div>
          <div className="card-body" style={{ display: 'grid', gap: 12 }}>
            <div className="field">
              <label className="field-label">Destino</label>
              <select className="select" value={destino} onChange={e => setDestino(e.target.value)}>
                <option>Cleanest Choice</option>
                <option>Mercado Libre FULL</option>
                <option>Amazon FBA</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">SKU</label>
              <select className="select" value={selectedSku} onChange={e => setSelectedSku(e.target.value)}>
                {productos.length === 0
                  ? <option value="">— Sin productos disponibles —</option>
                  : productos.map(p => <option key={p.sku} value={p.sku}>{p.sku} — {p.nombre}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label className="field-label">Cantidad</label>
                <input className="input" type="number" min="1" value={cantidad}
                  onChange={e => setCantidad(Math.max(1, Number(e.target.value) || 1))}/>
              </div>
              <div className="field">
                <label className="field-label">Fecha envío</label>
                <input className="input" type="date" value={fecha} onChange={e => setFecha(e.target.value)}/>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }}
              disabled={submitting || !selectedSku}
              onClick={registrar}>
              {submitting
                ? <><span className="spinner"/> Registrando...</>
                : <><Icon name="send" size={13}/> Registrar traspaso</>}
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Últimos traspasos</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            {traspasos.length === 0 ? (
              <div className="empty" style={{ padding: 32 }}>
                <div className="empty-icon"><Icon name="transfer"/></div>
                <div>Sin traspasos registrados</div>
              </div>
            ) : traspasos.map((t, i) => (
              <div key={t.id || i} className="activity-item" style={{ padding: '12px 20px' }}>
                <div className="activity-dot" style={{ background: t.estado === 'Entregado' ? 'var(--success)' : 'var(--warn)' }}/>
                <div className="activity-body">
                  <div className="activity-title">
                    {t.dest || t.destino} · <span className="mono">{t.sku}</span>
                  </div>
                  <div className="activity-meta">
                    {window.fmt.date(t.fecha_registro || t.date || t.fecha)} · {t.estado}
                    {t.almacen && <> · {t.almacen}</>}
                  </div>
                </div>
                <div className="activity-amt">{t.qty || t.cantidad} uds</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Gastos ----------
function PageGastos({ user }) {
  const toast = window.useToast();

  // KPI / chart data
  const [gastos, setGastos] = rp_uS([]);

  // Form 1: gasto operativo
  const [gastoForm, setGastoFormS] = rp_uS({ descripcion: '', costo: '', cantidad: '' });
  const [gastoPendiente, setGastoPendiente] = rp_uS(null);
  const [submittingGasto, setSubmittingGasto] = rp_uS(false);

  // Form 2: SKU como gasto
  const [productos, setProductos] = rp_uS([]);
  const [selectedSku, setSelectedSku] = rp_uS('');
  const [cantidadSku, setCantidadSku] = rp_uS(1);
  const [skuPendiente, setSkuPendiente] = rp_uS(null);
  const [submittingSku, setSubmittingSku] = rp_uS(false);

  // Consulta de gastos
  const [consultaData, setConsultaData] = rp_uS([]);
  const [loadingConsulta, setLoadingConsulta] = rp_uS(false);
  const [consultaRealizada, setConsultaRealizada] = rp_uS(false);

  rp_uE(() => {
    (async () => {
      const [g, prods] = await Promise.all([window.api.gastos(), window.api.productos()]);
      setGastos(g);
      setProductos(prods);
      if (prods.length > 0) setSelectedSku(prods[0].sku);
    })();
  }, []);

  const setGasto = (k, v) => setGastoFormS(f => ({ ...f, [k]: v }));

  const submitGasto = () => {
    const { descripcion, costo, cantidad } = gastoForm;
    if (!descripcion.trim() || !costo || !cantidad) {
      toast.warn('Campos incompletos', 'Rellena descripción, monto y cantidad');
      return;
    }
    setGastoPendiente({ descripcion, costo, cantidad });
  };

  const confirmarGasto = async () => {
    setSubmittingGasto(true);
    const p = gastoPendiente;
    const r = await window.api.registrarGasto({
      usuario_registro: user || 'usuario',
      descripcion: p.descripcion,
      costo: parseFloat(p.costo),
      cantidad: parseInt(p.cantidad, 10),
    });
    setSubmittingGasto(false);
    setGastoPendiente(null);
    if (r.ok) {
      toast.success('Gasto registrado', p.descripcion);
      setGastoFormS({ descripcion: '', costo: '', cantidad: '' });
      setGastos(await window.api.gastos());
    } else {
      toast.error('Error al registrar', 'Verifica conexión con el servidor');
    }
  };

  const submitSku = () => {
    const prod = productos.find(p => p.sku === selectedSku);
    if (!prod) { toast.warn('Sin selección', 'Selecciona un producto válido'); return; }
    setSkuPendiente({ sku: prod.sku, nombre: prod.nombre, cantidad: cantidadSku });
  };

  const confirmarSku = async () => {
    setSubmittingSku(true);
    const p = skuPendiente;
    const r = await window.api.registrarVenta({
      id_venta: 0,
      sku: p.sku,
      producto: p.nombre,
      stock_bodega: p.cantidad,
      precio: 0.00,      
      fecha: new Date().toISOString().slice(0, 19).replace('T', ' '),
      nombreComprador: 'USO DE BODEGA',
      otros: 'ESTE ARTICULO FUE USADO EN ALMACEN',
      plataforma: 'BODEGA',
      usuario: user || 'usuario',
      condicion_pago: 'USO BODEGA'    
    });
    setSubmittingSku(false);
    setSkuPendiente(null);
    if (r.ok) {
      toast.success('SKU descontado', `${p.cantidad} × ${p.nombre}`);
      setCantidadSku(1);
    } else {
      toast.error('Error al registrar', 'Verifica conexión con el servidor');
    }
  };

  const consultarGastos = async () => {
    setLoadingConsulta(true);
    const r = await window.api.consultarGastos(user);
    setLoadingConsulta(false);
    setConsultaRealizada(true);
    if (r.ok) {
      const data = Array.isArray(r.data) ? r.data : [];
      setConsultaData(data);
      toast.success('Consulta realizada', `${data.length} registros`);
    } else {
      toast.error('Error en consulta', 'Verifica conexión con el servidor');
    }
  };

  const total = gastos.reduce((s, g) => s + g.monto, 0);
  const byCat = {};
  gastos.forEach(g => { byCat[g.categoria] = (byCat[g.categoria] || 0) + g.monto; });
  const colors = ['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)'];
  const catData = Object.entries(byCat).map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }));

  return (
    <div className="page">
      <div className="section-header">
        <div><h2 className="section-title">Gastos operativos</h2><p className="section-subtitle">Registro y control de egresos operativos.</p></div>
      </div>

      {/* KPIs */}
      <div className="dash-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Distribución por categoría</h3></div>
          <div className="card-body"><window.Charts.HBarChart data={catData}/></div>
        </div>
        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total del mes</div>
            <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em' }}>{window.fmt.mxn(total)}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>{gastos.length} gastos registrados</div>
          </div>
        </div>
      </div>

      {/* Form 1: Gasto operativo */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Registrar gasto operativo</h3>
            <p className="card-subtitle">Ingresa los gastos realizados para la operación</p>
          </div>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="field-label">Descripción del gasto</label>
            <input className="input" value={gastoForm.descripcion} onChange={e => setGasto('descripcion', e.target.value)} placeholder="Ej: Combustible, renta, nómina..."/>
          </div>
          <div className="field">
            <label className="field-label">Monto ($)</label>
            <input className="input mono" type="number" step="0.01" min="0" value={gastoForm.costo} onChange={e => setGasto('costo', e.target.value)} placeholder="0.00"/>
          </div>
          <div className="field">
            <label className="field-label">Cantidad de piezas</label>
            <input className="input mono" type="number" min="1" value={gastoForm.cantidad} onChange={e => setGasto('cantidad', e.target.value)} placeholder="1"/>
          </div>
        </div>
        <div className="card-footer">
          <div/>
          <button className="btn btn-primary btn-sm" onClick={submitGasto}>
            <Icon name="plus" size={13}/> Registrar gasto
          </button>
        </div>
      </div>

      {gastoPendiente && (
        <div className="card" style={{ marginTop: 8, border: '1px solid var(--warn)', background: 'var(--warn-bg)' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--warn)', fontSize: 13 }}>
              ¿Confirmas registrar el gasto <strong>{gastoPendiente.descripcion}</strong> por <strong>{window.fmt.mxn(Number(gastoPendiente.costo))}</strong>?
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setGastoPendiente(null)} disabled={submittingGasto}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={confirmarGasto} disabled={submittingGasto}>
                {submittingGasto ? <><span className="spinner"/> Registrando...</> : <><Icon name="check" size={13}/> Sí, registrar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form 2: SKU como gasto */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Ingresa SKU como gasto operativo</h3>
            <p className="card-subtitle">Descuenta unidades de bodega como gasto de operación</p>
          </div>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label className="field-label">Producto / SKU</label>
            <select className="select" value={selectedSku} onChange={e => setSelectedSku(e.target.value)}>
              {productos.length === 0
                ? <option value="">— Sin productos disponibles —</option>
                : productos.map(p => <option key={p.sku} value={p.sku}>{p.sku} — {p.nombre}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Cantidad a descontar</label>
            <input className="input mono" type="number" min="1" value={cantidadSku} onChange={e => setCantidadSku(Math.max(1, Number(e.target.value) || 1))}/>
          </div>
        </div>
        <div className="card-footer">
          <div/>
          <button className="btn btn-primary btn-sm" onClick={submitSku} disabled={productos.length === 0}>
            <Icon name="send" size={13}/> Ingresar gasto de bodega
          </button>
        </div>
      </div>

      {skuPendiente && (
        <div className="card" style={{ marginTop: 8, border: '1px solid var(--warn)', background: 'var(--warn-bg)' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--warn)', fontSize: 13 }}>
              ¿Confirmas registrar <strong>{skuPendiente.cantidad} uds.</strong> de <strong>{skuPendiente.nombre}</strong> como gasto operativo de bodega?
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSkuPendiente(null)} disabled={submittingSku}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={confirmarSku} disabled={submittingSku}>
                {submittingSku ? <><span className="spinner"/> Registrando...</> : <><Icon name="check" size={13}/> Sí, registrar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consulta de gastos registrados */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h3 className="card-title">Consulta de gastos registrados</h3>
          <button className="btn btn-secondary btn-sm" onClick={consultarGastos} disabled={loadingConsulta}>
            {loadingConsulta ? <><span className="spinner"/> Consultando...</> : <><Icon name="search" size={13}/> Consultar gastos</>}
          </button>
        </div>
        {consultaRealizada && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {consultaData.length > 0
                    ? Object.keys(consultaData[0]).map(k => <th key={k}>{k}</th>)
                    : <th>Sin resultados</th>}
                </tr>
              </thead>
              <tbody>
                {consultaData.length === 0 ? (
                  <tr><td colSpan={99}><div className="empty" style={{ padding: 32 }}>Sin gastos registrados</div></td></tr>
                ) : consultaData.map((row, i) => (
                  <tr key={i}>
                    {Object.entries(row).map(([k, v], j) => (
                      <td key={j} className={typeof v === 'number' ? 'mono td-right' : ''}>
                        {typeof v === 'number' ? window.fmt.mxn(v) : String(v ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Últimos gastos */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header"><h3 className="card-title">Últimos gastos</h3></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Método</th><th className="td-right">Monto</th></tr></thead>
            <tbody>
              {gastos.map(g => (
                <tr key={g.id}>
                  <td className="td-muted">{window.fmt.date(g.fecha)}</td>
                  <td style={{ fontWeight: 500 }}>{g.concepto}</td>
                  <td><span className="badge">{g.categoria}</span></td>
                  <td className="td-muted">{g.metodo}</td>
                  <td className="td-right mono" style={{ fontWeight: 500 }}>{window.fmt.mxn(g.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Cuentas Pendientes ----------
function PagePendientes() {
  const [creditos, setCreditos] = rp_uS([]);
  rp_uE(() => { (async () => setCreditos(await window.api.creditos()))(); }, []);
  const total = creditos.reduce((s, c) => s + c.saldo_pendiente, 0);
  const vencidos = creditos.filter(c => c.dias_vencido > 15);

  return (
    <div className="page">
      <div className="section-header">
        <div><h2 className="section-title">Cuentas pendientes</h2><p className="section-subtitle">Por cobrar y por pagar — vista consolidada.</p></div>
      </div>
      <div className="dash-kpis">
        <window.MiniStat label="Saldo por cobrar" value={window.fmt.mxn(total)} icon="cash"/>
        <window.MiniStat label="Cuentas activas" value={creditos.length} icon="users"/>
        <window.MiniStat label="Vencidas (>15d)" value={vencidos.length} icon="alert" tone="danger"/>
        <window.MiniStat label="Promedio" value={window.fmt.mxn(total / (creditos.length || 1))} icon="trend"/>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header"><h3 className="card-title">Detalle</h3></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Cliente</th><th>Venta</th><th>Fecha</th><th className="td-right">Total</th><th className="td-right">Abonado</th><th className="td-right">Saldo</th><th>Vencimiento</th></tr></thead>
            <tbody>
              {creditos.map(c => (
                <tr key={c.id_ventas}>
                  <td style={{ fontWeight: 500 }}>{c.nombreComprador || c.nombre}</td>
                  <td className="mono td-muted" style={{ fontSize: 11 }}>#{String(c.id_ventas).slice(-8)}</td>
                  <td className="td-muted">{window.fmt.date(c.fecha)}</td>
                  <td className="td-right mono">{window.fmt.mxn(c.total)}</td>
                  <td className="td-right mono td-muted">{window.fmt.mxn(c.abonado)}</td>
                  <td className="td-right mono" style={{ fontWeight: 600 }}>{window.fmt.mxn(c.saldo_pendiente)}</td>
                  <td>{(() => { const dias = c.dias_vencido ?? Math.floor((Date.now() - new Date(c.fecha_vencimiento)) / 86400000); const label = c.fecha_vencimiento ? window.fmt.date(c.fecha_vencimiento) : `${dias}d`; const tone = dias > 15 ? 'danger' : dias > 7 ? 'warn' : 'info'; return <span className={`badge badge-${tone}`}><span className="badge-dot"/>{label}</span>; })()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- CleanestChoice ----------
const CLEANEST_SKUS = ["ESPFARBLA","CUBBCADLD","TAPCUABLA24","UNIAZLCH","UNIAZLXL","UNIAZLMED","UNIAZLGDE","UNIAZL2XL","UNIAZLXXL"];
const N8N_HOOK = "https://n8n-n8n.i4mjht.easypanel.host/webhook/5a5caa1a-3ad5-44ff-9f47-d791f937f2d0";

function calcularStatus(p) {
  const t = (+p.envio1||0) + (+p.envio2||0) + (+p.envio3||0);
  if (t >= +p.cantidad) return 'Entregado';
  if (t > 0) return 'En Tránsito';
  return p.status || 'Pendiente';
}

function CcProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct*100}%`, background: pct>=1 ? 'var(--success)' : 'var(--brand-hi)', borderRadius: 999, transition: 'width .3s' }}/>
      </div>
      <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 4 }}>Enviado: {value} / {max} pzs ({Math.round(pct*100)}%)</div>
    </div>
  );
}

function FirmaViewer({ ordenNum }) {
  const [open, setOpen] = rp_uS(false);
  const [firma, setFirma] = rp_uS(null);
  const [loading, setLoading] = rp_uS(false);
  const load = async () => { setLoading(true); const r = await window.api.obtenerFirma(ordenNum); setFirma(r.ok ? r.data : null); setLoading(false); };
  const toggle = () => { if (!open) load(); setOpen(v => !v); };
  return (
    <div style={{ marginTop: 10 }}>
      <button className="btn btn-ghost btn-sm" onClick={toggle}><Icon name="eye" size={13}/> {open ? 'Ocultar firma' : 'Ver firma registrada'}</button>
      {open && (loading
        ? <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>Cargando...</div>
        : firma?.firma_base64
          ? <div style={{ marginTop: 8 }}><img src={`data:image/png;base64,${firma.firma_base64}`} alt="Firma" style={{ maxWidth: 350, border: '1px solid var(--line)', borderRadius: 'var(--r-sm)' }}/>{firma.fecha_firma && <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 4 }}>{window.fmt.datetime(firma.fecha_firma)}</div>}</div>
          : <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>Sin firma registrada.</div>
      )}
    </div>
  );
}

function FirmaCanvas({ ordenNum, onSend }) {
  const toast = window.useToast();
  const canvasRef = React.useRef(null);
  const [drawing, setDrawing] = rp_uS(false);
  const [hasStroke, setHasStroke] = rp_uS(false);
  const [confirm, setConfirm] = rp_uS(false);
  const getPos = (e, c) => { const r = c.getBoundingClientRect(), sx = c.width/r.width, sy = c.height/r.height, s = e.touches?.[0]||e; return { x:(s.clientX-r.left)*sx, y:(s.clientY-r.top)*sy }; };
  const startDraw = e => { const c=canvasRef.current,ctx=c.getContext('2d'),p=getPos(e,c); ctx.beginPath(); ctx.moveTo(p.x,p.y); setDrawing(true); e.preventDefault(); };
  const draw = e => { if(!drawing) return; const c=canvasRef.current,ctx=c.getContext('2d'),p=getPos(e,c); ctx.lineTo(p.x,p.y); ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.stroke(); setHasStroke(true); e.preventDefault(); };
  const endDraw = () => setDrawing(false);
  const clear = () => { const c=canvasRef.current; c.getContext('2d').clearRect(0,0,c.width,c.height); setHasStroke(false); setConfirm(false); };
  const send = async () => {
    const b64 = canvasRef.current.toDataURL('image/png').replace('data:image/png;base64,','');
    const payload = { numero_orden: ordenNum, firma_base64: b64, usuario: window.api.usuario||'sistema', fecha_firma: new Date().toISOString(), firma_cleanest: 'Se firmo una orden de cleanest' };
    const r = await window.api.enviarFirma(payload);
    if (r.ok) { toast.success('Firma enviada', ordenNum); fetch(N8N_HOOK,{method:'POST',body:JSON.stringify(payload),headers:{'Content-Type':'application/json'}}).catch(()=>{}); clear(); onSend?.(); }
    else toast.error('Error', r.error||'No se pudo enviar');
  };
  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-1)', marginBottom: 6 }}>Firma digital — {ordenNum}</div>
      <canvas ref={canvasRef} width={500} height={150} style={{ width:'100%', maxWidth:500, border:'1px solid var(--line)', borderRadius:'var(--r-md)', background:'#fff', cursor:'crosshair', touchAction:'none' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <button className="btn btn-ghost btn-sm" onClick={clear}>Limpiar</button>
        {!confirm
          ? <button className="btn btn-primary btn-sm" onClick={()=>setConfirm(true)} disabled={!hasStroke}>Enviar firma</button>
          : <><span style={{ fontSize:12, color:'var(--warn)', alignSelf:'center' }}>¿Confirmas enviar?</span><button className="btn btn-primary btn-sm" onClick={send}>Sí, enviar</button><button className="btn btn-ghost btn-sm" onClick={()=>setConfirm(false)}>Cancelar</button></>
        }
      </div>
    </div>
  );
}

function OrdenCard({ pedido, onRefresh }) {
  const toast = window.useToast();
  const pid = pedido.id || pedido.numero_orden;
  const [e1,setE1] = rp_uS(+pedido.envio1||0);
  const [e2,setE2] = rp_uS(+pedido.envio2||0);
  const [e3,setE3] = rp_uS(+pedido.envio3||0);
  const [newStatus,setNewStatus] = rp_uS(calcularStatus(pedido));
  const [confirm,setConfirm] = rp_uS(false);
  const [saving,setSaving] = rp_uS(false);
  const total = e1+e2+e3;
  const live = calcularStatus({...pedido,envio1:e1,envio2:e2,envio3:e3});
  const toneMap = { Entregado:'success','En Tránsito':'warn',Pendiente:'danger' };
  const save = async () => {
    setSaving(true);
    const finalStatus = total >= +pedido.cantidad ? 'Entregado' : newStatus;
    const r = await window.api.actualizarOrden(pid, { envio1:e1, envio2:e2, envio3:e3, status:finalStatus });
    setSaving(false); setConfirm(false);
    if (r.ok) { toast.success('Orden actualizada', `${pedido.numero_orden} — ${finalStatus}`); onRefresh(); }
    else toast.error('Error', r.error||'No se pudo actualizar');
  };
  return (
    <div className="card" style={{ marginBottom:10 }}>
      <div className="card-header" style={{ flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span className={`badge badge-${toneMap[live]||'info'}`}><span className="badge-dot"/>{live}</span>
          <span style={{ fontWeight:600 }}>{pedido.numero_orden}</span>
          <span className="badge">{pedido.sku}</span>
        </div>
        <div style={{ fontSize:12, color:'var(--fg-2)' }}>Promesa: {window.fmt.date(pedido.fecha_promesa)}</div>
      </div>
      <div className="card-body">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
          <div><div style={{ fontSize:11, color:'var(--fg-2)', marginBottom:4 }}>Cantidad pedida</div><div style={{ fontSize:22, fontWeight:700 }}>{pedido.cantidad}</div></div>
          {[['Envío 1',e1,setE1],['Envío 2',e2,setE2],['Envío 3',e3,setE3]].map(([lbl,val,set])=>(
            <div key={lbl}><div style={{ fontSize:11, color:'var(--fg-2)', marginBottom:4 }}>{lbl}</div><input className="input" type="number" min="0" value={val} onChange={e=>set(+e.target.value||0)} style={{ width:'100%' }}/></div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:12, color:'var(--fg-1)' }}>Status:</span>
          <select className="select" value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={{ width:160 }}>
            <option>Pendiente</option><option>En Tránsito</option><option>Entregado</option>
          </select>
        </div>
        <CcProgressBar value={total} max={+pedido.cantidad}/>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          {!confirm
            ? <button className="btn btn-primary btn-sm" onClick={()=>setConfirm(true)} disabled={saving}>Guardar cambios</button>
            : <><span style={{ fontSize:12, color:'var(--warn)', alignSelf:'center' }}>¿Confirmas guardar?</span><button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving?'Guardando...':'Sí, guardar'}</button><button className="btn btn-ghost btn-sm" onClick={()=>setConfirm(false)}>Cancelar</button></>
          }
        </div>
        <FirmaViewer ordenNum={pedido.numero_orden}/>
        <FirmaCanvas ordenNum={pedido.numero_orden} onSend={onRefresh}/>
      </div>
    </div>
  );
}

function HistorialCard({ pedido, inv }) {
  const toast = window.useToast();
  const norden = pedido.numero_orden;
  const nordenShort = norden.slice(2);
  const e1=+pedido.envio1||0, e2=+pedido.envio2||0, e3=+pedido.envio3||0;
  rp_uE(() => {
    (async () => {
      const r = await window.api.verificarVenta(nordenShort);
      if (r.ok && !r.data?.registrada) {
        const item = inv.find(p=>p.sku===pedido.sku)||{};
        const payload = { id_venta:nordenShort, sku:pedido.sku, stock_bodega:+pedido.cantidad, precio:parseFloat(item.precio_clean||0), producto:item.nombre||pedido.sku, fecha:new Date().toISOString(), nombreComprador:'CLEANEST CHOICE', otros:'FARMACEUTICA', plataforma:'SISTEMA ZEUTICA', usuario:window.api.usuario||'sistema' };
        const rv = await window.api.registrarVenta(payload);
        if (rv.ok) toast.success('Venta registrada', `Orden ${nordenShort}`);
      }
    })();
  }, []);
  return (
    <div className="card" style={{ marginBottom:10 }}>
      <div className="card-header" style={{ flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span className="badge badge-success"><span className="badge-dot"/>Entregado</span>
          <span style={{ fontWeight:600 }}>{norden}</span>
          <span className="badge">{pedido.sku}</span>
        </div>
        <div style={{ fontSize:12, color:'var(--fg-2)' }}>Promesa: {window.fmt.date(pedido.fecha_promesa)}</div>
      </div>
      <div className="card-body">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[['Cantidad pedida',+pedido.cantidad],['Envío 1',e1],['Envío 2',e2],['Envío 3',e3]].map(([lbl,val])=>(
            <div key={lbl}><div style={{ fontSize:11, color:'var(--fg-2)', marginBottom:4 }}>{lbl}</div><div style={{ fontSize:22, fontWeight:700 }}>{val}</div></div>
          ))}
        </div>
        <CcProgressBar value={e1+e2+e3} max={+pedido.cantidad}/>
        <FirmaViewer ordenNum={norden}/>
      </div>
    </div>
  );
}

function PageCleanest() {
  const [tab, setTab] = rp_uS('nueva');
  const [productos, setProductos] = rp_uS([]);
  const [pedidos, setPedidos] = rp_uS([]);
  const [norden, setNorden] = rp_uS('OC');
  const [sku, setSku] = rp_uS('');
  const [cantidad, setCantidad] = rp_uS(1);
  const [fechaPromesa, setFechaPromesa] = rp_uS(new Date().toISOString().slice(0,10));
  const [pending, setPending] = rp_uS(null);
  const [loadingOrden, setLoadingOrden] = rp_uS(false);
  const toast = window.useToast();

  const loadData = async () => {
    const [prods, peds] = await Promise.all([window.api.productos(), window.api.cleanest()]);
    setProductos(Array.isArray(prods)?prods:[]);
    setPedidos(Array.isArray(peds)?peds:[]);
  };
  rp_uE(() => { loadData(); }, []);

  const inv = productos.filter(p=>CLEANEST_SKUS.includes(p.sku));
  const activos = pedidos.filter(p=>calcularStatus(p)!=='Entregado');
  const completados = pedidos.filter(p=>calcularStatus(p)==='Entregado');

  const submitOrden = e => {
    e.preventDefault();
    if (!norden||!sku) { toast.error('Campos incompletos','Completa todos los campos'); return; }
    setPending({ norden, sku, cantidad, fechaPromesa });
  };
  const confirmarOrden = async () => {
    setLoadingOrden(true);
    const payload = { numero_orden:pending.norden, sku:pending.sku, cantidad:+pending.cantidad, fecha_promesa:pending.fechaPromesa, status:'Pendiente', envio1:0, envio2:0, envio3:0 };
    const r = await window.api.crearOrden(payload);
    setLoadingOrden(false);
    if (r.ok) {
      toast.success('Orden registrada', pending.norden);
      fetch(N8N_HOOK,{method:'POST',body:JSON.stringify(payload),headers:{'Content-Type':'application/json'}}).catch(()=>{});
      setPending(null); setNorden('OC'); setSku(''); setCantidad(1); loadData();
    } else { toast.error('Error', r.error||'No se pudo registrar'); setPending(null); }
  };

  return (
    <div className="page">
      <div className="section-header">
        <div><h2 className="section-title">CleanestChoice</h2><p className="section-subtitle">Gestión de órdenes, tracking y firma digital.</p></div>
      </div>
      <div className="tabs" style={{ marginBottom:20 }}>
        <button className={`tab ${tab==='nueva'?'active':''}`} onClick={()=>setTab('nueva')}>Nueva Orden</button>
        <button className={`tab ${tab==='tracking'?'active':''}`} onClick={()=>setTab('tracking')}>Tracking ({activos.length})</button>
        <button className={`tab ${tab==='historial'?'active':''}`} onClick={()=>setTab('historial')}>Historial ({completados.length})</button>
      </div>

      {tab==='nueva' && (
        <div>
          <form className="card" style={{ padding:20 }} onSubmit={submitOrden}>
            <h3 className="card-title" style={{ marginBottom:16 }}>Ingresa los datos de la Orden de Pedido</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div className="field"><label className="field-label">Número de Orden</label><input className="input" value={norden} onChange={e=>setNorden(e.target.value)} placeholder="OC"/></div>
              <div className="field"><label className="field-label">Cantidad</label><input className="input" type="number" min="1" value={cantidad} onChange={e=>setCantidad(+e.target.value)}/></div>
              <div className="field"><label className="field-label">SKU / Producto</label>
                <select className="select" value={sku} onChange={e=>setSku(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {inv.map(p=><option key={p.sku} value={p.sku}>{p.sku} — {p.nombre}</option>)}
                </select>
              </div>
              <div className="field"><label className="field-label">Fecha Promesa</label><input className="input" type="date" value={fechaPromesa} onChange={e=>setFechaPromesa(e.target.value)}/></div>
            </div>
            <button className="btn btn-primary" style={{ marginTop:16, width:'100%' }} type="submit">Registrar Orden</button>
          </form>
          {pending && (
            <div style={{ marginTop:16, padding:16, background:'var(--warn-bg)', border:'1px solid var(--warn)', borderRadius:'var(--r-md)' }}>
              <div style={{ fontSize:13, marginBottom:12 }}>⚠️ ¿Confirmas registrar la orden <strong>{pending.norden}</strong> — SKU <strong>{pending.sku}</strong> × {pending.cantidad} uds.?</div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-primary btn-sm" onClick={confirmarOrden} disabled={loadingOrden}>{loadingOrden?'Registrando...':'Sí, registrar'}</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setPending(null)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='tracking' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 className="card-title">Seguimiento de Órdenes Activas</h3>
            <button className="btn btn-ghost btn-sm" onClick={loadData}>↺ Recargar</button>
          </div>
          {activos.length===0
            ? <div style={{ textAlign:'center', padding:40, color:'var(--fg-2)' }}>No hay órdenes activas en seguimiento.</div>
            : activos.map(p=><OrdenCard key={p.id||p.numero_orden} pedido={p} onRefresh={loadData}/>)
          }
        </div>
      )}

      {tab==='historial' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 className="card-title">Historial de Órdenes Completadas</h3>
            <button className="btn btn-ghost btn-sm" onClick={loadData}>↺ Recargar</button>
          </div>
          {completados.length===0
            ? <div style={{ textAlign:'center', padding:40, color:'var(--fg-2)' }}>Aún no hay órdenes completadas.</div>
            : completados.map(p=><HistorialCard key={p.id||p.numero_orden} pedido={p} inv={inv}/>)
          }
        </div>
      )}
    </div>
  );
}

// ---------- Compras ----------
function PageCompras() {
  const [compras, setCompras] = rp_uS([]);
  rp_uE(() => { (async () => setCompras(await window.api.compras()))(); }, []);
  return (
    <div className="page">
      <div className="section-header">
        <div><h2 className="section-title">Compras a proveedores</h2><p className="section-subtitle">Órdenes de compra y estatus de recepción.</p></div>
        <button className="btn btn-primary btn-sm"><Icon name="plus" size={13}/> Nueva orden</button>
      </div>
      <div className="dash-kpis">
        <window.MiniStat label="Total del mes" value={window.fmt.mxn(compras.reduce((s,c) => s + c.monto, 0))} icon="cash"/>
        <window.MiniStat label="Órdenes" value={compras.length} icon="doc"/>
        <window.MiniStat label="En tránsito" value={compras.filter(c => c.estado === 'En tránsito').length} icon="transfer" tone="warn"/>
        <window.MiniStat label="Por pagar" value={compras.filter(c => c.estado === 'Pendiente pago').length} icon="alert" tone="danger"/>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header"><h3 className="card-title">Historial</h3></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Proveedor</th><th>Factura</th><th className="td-right">Items</th><th className="td-right">Monto</th><th>Estado</th></tr></thead>
            <tbody>
              {compras.map(c => (
                <tr key={c.id}>
                  <td className="td-muted">{window.fmt.date(c.fecha)}</td>
                  <td style={{ fontWeight: 500 }}>{c.proveedor}</td>
                  <td className="mono td-muted">{c.factura}</td>
                  <td className="td-right mono">{c.items}</td>
                  <td className="td-right mono" style={{ fontWeight: 500 }}>{window.fmt.mxn(c.monto)}</td>
                  <td><span className={`badge badge-${c.estado === 'Recibida' ? 'success' : c.estado === 'En tránsito' ? 'warn' : 'danger'}`}><span className="badge-dot"/>{c.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Monitor Cobranza ----------
function PageCobranza() {
  const toast = window.useToast();
  const [creditos, setCreditos] = rp_uS([]);
  const [sel, setSel] = rp_uS(null);
  const [monto, setMonto] = rp_uS(0);
  rp_uE(() => { (async () => setCreditos(await window.api.creditos()))(); }, []);

  const total = creditos.reduce((s, c) => s + c.saldo_pendiente, 0);
  const clientes = new Set(creditos.map(c => c.nombre)).size;

  const abonar = () => {
    if (!sel || monto <= 0) { toast.error('Abono inválido', 'Selecciona una venta y un monto'); return; }
    toast.success('Abono registrado', `${window.fmt.mxn(monto)} para ${sel.nombre}`);
    setCreditos(creditos.map(c => c.id_ventas === sel.id_ventas ? { ...c, saldo_pendiente: Math.max(0, c.saldo_pendiente - monto), abonado: c.abonado + monto } : c));
    setSel(null); setMonto(0);
  };

  return (
    <div className="page">
      <div className="section-header">
        <div><h2 className="section-title">Monitor de cobranza</h2><p className="section-subtitle">Consulta cartera y registra abonos en tiempo real.</p></div>
      </div>
      <div className="dash-kpis">
        <window.MiniStat label="Clientes con crédito" value={clientes} icon="users"/>
        <window.MiniStat label="Saldo total" value={window.fmt.mxn(total)} icon="wallet"/>
        <window.MiniStat label="Promedio" value={window.fmt.mxn(total / (clientes || 1))} icon="trend"/>
        <window.MiniStat label="Recuperado mes" value={window.fmt.mxn(creditos.reduce((s,c) => s + c.abonado, 0))} icon="check" tone="success"/>
      </div>
      <div className="dash-grid" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Cartera activa</h3></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Cliente</th><th className="td-right">Saldo</th><th>Días</th><th></th></tr></thead>
              <tbody>
                {creditos.filter(c => c.saldo_pendiente > 0).map(c => (
                  <tr key={c.id_ventas} style={{ background: sel?.id_ventas === c.id_ventas ? 'var(--bg-2)' : undefined }}>
                    <td><div style={{ fontWeight: 500 }}>{c.nombreComprador || c.nombre}</div><div className="mono td-muted" style={{ fontSize: 11 }}>#{String(c.id_ventas).slice(-6)}</div></td>
                    <td className="td-right mono" style={{ fontWeight: 600 }}>{window.fmt.mxn(c.saldo_pendiente)}</td>
                    <td>{(() => { const dias = c.dias_vencido ?? Math.floor((Date.now() - new Date(c.fecha_vencimiento)) / 86400000); const label = c.fecha_vencimiento ? window.fmt.date(c.fecha_vencimiento) : `${dias}d`; return <span className={`badge badge-${dias > 15 ? 'danger' : 'warn'}`}><span className="badge-dot"/>{label}</span>; })()}</td>
                    <td className="td-right"><button className="btn btn-ghost btn-sm" onClick={() => { setSel(c); setMonto(c.saldo_pendiente); }}>Abonar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Registrar abono</h3></div>
          <div className="card-body">
            {!sel ? (
              <div className="empty"><div className="empty-icon"><Icon name="cash"/></div><div>Selecciona una venta para abonar</div></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
                  <div style={{ fontWeight: 500 }}>{sel.nombre}</div>
                  <div className="mono td-muted" style={{ fontSize: 11, marginTop: 2 }}>Venta #{String(sel.id_ventas).slice(-8)}</div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--fg-2)', fontSize: 12 }}>Saldo pendiente</span>
                    <span className="mono" style={{ fontWeight: 600 }}>{window.fmt.mxn(sel.saldo_pendiente)}</span>
                  </div>
                </div>
                <div className="field"><label className="field-label">Monto del abono</label>
                  <input className="input input-lg mono" type="number" value={monto} onChange={e => setMonto(Number(e.target.value) || 0)}/></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSel(null)}>Cancelar</button>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={abonar}><Icon name="check" size={13}/> Registrar {window.fmt.mxn(monto)}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.PageCotizaciones = PageCotizaciones;
window.PageClientes = PageClientes;
window.PageReportes = PageReportes;
window.PageFull = PageFull;
window.PageGastos = PageGastos;
window.PagePendientes = PagePendientes;
window.PageCleanest = PageCleanest;
window.PageCompras = PageCompras;
window.PageCobranza = PageCobranza;
