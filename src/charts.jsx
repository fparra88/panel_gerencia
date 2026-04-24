// ===== Zeutica — Mini Chart Primitives (SVG) =====
const Sparkline = ({ data, w = 100, h = 28, color = 'var(--brand)' }) => {
  if (!data || !data.length) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1 || 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sgrad${color.length}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sgrad${color.length})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

const BarChart = ({ data, h = 180 }) => {
  // data: [{ label, value, color? }]
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(d => d.value)) || 1;
  return (
    <div className="bar-chart" style={{ height: h }}>
      {data.map((d, i) => (
        <div key={i} className="bar-item" title={`${d.label}: ${d.value}`}>
          <div className="bar-track">
            <div className="bar-fill" style={{ height: `${(d.value / max) * 100}%`, background: d.color || 'var(--brand)' }}/>
          </div>
          <div className="bar-label">{d.label}</div>
          <div className="bar-value num">{window.fmt.int(d.value)}</div>
        </div>
      ))}
    </div>
  );
};

const HBarChart = ({ data }) => {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(d => d.value)) || 1;
  return (
    <div className="hbar-chart">
      {data.map((d, i) => (
        <div key={i} className="hbar-row">
          <div className="hbar-label truncate">{d.label}</div>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: `${(d.value / max) * 100}%`, background: d.color || 'var(--brand)' }}/>
          </div>
          <div className="hbar-value num mono">{window.fmt.int(d.value)}</div>
        </div>
      ))}
    </div>
  );
};

const Donut = ({ data, size = 160, thick = 22 }) => {
  // data: [{ label, value, color }]
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = size / 2 - thick / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth={thick}/>
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * circ;
          const el = (
            <circle
              key={i}
              cx={size/2} cy={size/2} r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={thick}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="donut-center">
        <div className="donut-center-num num">{window.fmt.int(total)}</div>
        <div className="donut-center-lbl">total</div>
      </div>
    </div>
  );
};

const LineChart = ({ data, h = 180, color = 'var(--brand)' }) => {
  if (!data?.length) return null;
  const w = 600;
  const max = Math.max(...data.map(d => d.v)), min = Math.min(...data.map(d => d.v));
  const range = max - min || 1;
  const step = w / (data.length - 1 || 1);
  const points = data.map((d, i) => ({ x: i * step, y: h - 24 - ((d.v - min) / range) * (h - 40) }));
  const pStr = points.map(p => `${p.x},${p.y}`).join(' ');
  const area = `0,${h - 24} ${pStr} ${w},${h - 24}`;
  // y grid
  const grid = [0, 0.25, 0.5, 0.75, 1].map(g => ({ y: 4 + g * (h - 40), val: max - g * range }));
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="linegrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {grid.map((g, i) => (
        <line key={i} x1="0" x2={w} y1={g.y} y2={g.y} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 3"/>
      ))}
      <polygon points={area} fill="url(#linegrad)"/>
      <polyline points={pStr} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} stroke="var(--bg-0)" strokeWidth="2"/>
      ))}
      {data.map((d, i) => (
        <text key={i} x={i * step} y={h - 6} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize="10" fill="var(--fg-3)" fontFamily="var(--f-mono)">{d.label}</text>
      ))}
    </svg>
  );
};

window.Charts = { Sparkline, BarChart, HBarChart, Donut, LineChart };
