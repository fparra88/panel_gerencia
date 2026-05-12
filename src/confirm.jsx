// ===== Zeutica — Confirm Dialog Hook =====
function useConfirm() {
  const [state, setState] = React.useState({ open: false, message: '', onConfirm: null });

  const ask = (message, onConfirm) => setState({ open: true, message, onConfirm });
  const close = () => setState({ open: false, message: '', onConfirm: null });

  const modal = state.open ? (
    <div className="modal-backdrop" onClick={close} style={{ zIndex: 10001 }}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="card-header">
          <h3 className="card-title">¿Estás seguro?</h3>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 14, color: 'var(--fg-1)', lineHeight: 1.6 }}>{state.message}</p>
        </div>
        <div className="card-footer">
          <button className="btn btn-secondary btn-sm" onClick={close}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => { const fn = state.onConfirm; close(); fn?.(); }}>
            <Icon name="check" size={13}/> Confirmar
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return [ask, modal];
}

window.useConfirm = useConfirm;
