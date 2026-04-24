// ===== Zeutica — App Shell (Sidebar + Topbar + Routing) =====
const { useState: uS, useEffect: uE, useMemo: uM, useCallback: uC, useRef: uR } = React;

const NAV = [
  { key: 'dashboard',    label: 'Dashboard',        icon: 'dashboard', gerencia: true },
  { key: 'inventario',   label: 'Inventario',       icon: 'box' },
  { key: 'ventas',       label: 'Ventas',           icon: 'cash' },
  { key: 'cotizaciones', label: 'Cotizaciones',     icon: 'doc' },
  { key: 'clientes',     label: 'Clientes',         icon: 'users' },
  { key: 'reportes',     label: 'Reportes',         icon: 'chart' },
  { key: 'full',         label: 'Traspaso FULL',    icon: 'transfer' },
  { key: 'gastos',       label: 'Gastos Operativos',icon: 'wallet' },
  { key: 'pendientes',   label: 'Cuentas Pendientes',icon: 'clock', gerencia: true },
  { key: 'cleanest',     label: 'CleanestChoice',   icon: 'stars' },
  { key: 'compras',      label: 'Compras',          icon: 'cart', gerencia: true },
  { key: 'cobranza',     label: 'Monitor Cobranza', icon: 'eye' },
];

function canSee(item, user) {
  if (!item.gerencia) return true;
  return user === 'gerencia';
}

function Sidebar({ current, setCurrent, user, onLogout, live }) {
  const toast = window.useToast();
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-brand">
          <img src="logo.png" alt="Zeutica" className="sidebar-logo-img" />
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">General</div>
        {NAV.slice(0, 1).map((n) => (
          <NavItem key={n.key} item={n} active={current === n.key} onClick={() => setCurrent(n.key)} canSee={canSee(n, user)} onBlock={() => toast.warn('Acceso restringido', 'Solo gerencia puede ver esta sección')}/>
        ))}
        <div className="sidebar-section">Operación</div>
        {NAV.slice(1, 7).map((n) => (
          <NavItem key={n.key} item={n} active={current === n.key} onClick={() => setCurrent(n.key)} canSee={canSee(n, user)} onBlock={() => toast.warn('Acceso restringido', 'Solo gerencia puede ver esta sección')}/>
        ))}
        <div className="sidebar-section">Finanzas</div>
        {NAV.slice(7, 12).map((n) => (
          <NavItem key={n.key} item={n} active={current === n.key} onClick={() => setCurrent(n.key)} canSee={canSee(n, user)} onBlock={() => toast.warn('Acceso restringido', 'Solo gerencia puede ver esta sección')}/>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-status">
          <span className={`sidebar-status-dot ${live ? 'ok' : 'mock'}`}/>
          <span className="sidebar-status-text">{live ? 'Servidor activo' : 'Modo demo'}</span>
        </div>
        <div className="sidebar-user" onClick={onLogout}>
          <div className="sidebar-avatar">{(user || '?').slice(0,2).toUpperCase()}</div>
          <div className="sidebar-user-body">
            <div className="sidebar-user-name">{user}</div>
            <div className="sidebar-user-role">{user === 'gerencia' ? 'Administrador' : 'Operaciones'}</div>
          </div>
          <Icon name="logout" size={14}/>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ item, active, onClick, canSee, onBlock }) {
  if (!canSee) {
    return (
      <button className="nav-item nav-item-locked" onClick={onBlock} title="Solo gerencia">
        <Icon name={item.icon} size={15}/>
        <span>{item.label}</span>
        <Icon name="lock" size={12} className="nav-lock"/>
      </button>
    );
  }
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <Icon name={item.icon} size={15}/>
      <span>{item.label}</span>
    </button>
  );
}

function Topbar({ current, user, onOpenNotifs, notifCount, onCmd }) {
  const pageLabel = NAV.find(n => n.key === current)?.label || '';
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{pageLabel}</h1>
        <span className="topbar-crumb">
          <Icon name="chevRight" size={12}/>
          <span>{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </span>
      </div>
      <div className="topbar-right">
        <button className="topbar-search" onClick={onCmd}>
          <Icon name="search" size={14}/>
          <span>Buscar productos, clientes, ventas…</span>
          <kbd className="kbd">⌘K</kbd>
        </button>
        <button className="btn btn-ghost btn-icon topbar-icon-btn" onClick={onOpenNotifs}>
          <Icon name="bell" size={16}/>
          {notifCount > 0 && <span className="topbar-badge">{notifCount}</span>}
        </button>
      </div>
    </header>
  );
}

window.AppShell = { NAV, Sidebar, Topbar, canSee };
