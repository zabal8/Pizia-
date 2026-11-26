import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const sizeNames = { pequena: 'Pequeña', porcion: 'Porción', mediana: 'Mediana', grande: 'Grande' };
const stateNames = { recibido: 'Recibido', preparando: 'En preparación', listo: 'Listo', entregado: 'Entregado', cancelado: 'Cancelado' };
const paymentNames = { efectivo: 'Efectivo al recibir', tarjeta: 'Tarjeta al recibir', transferencia: 'Transferencia' };
const photoNames = { margarita: 'margarita', pepperoni: 'pepperoni', capricciosa: 'capricciosa', mushroom: 'mushroom', marinara: 'marinara', seafood: 'seafood', hawaiana: 'hawaiana', vegetariana: 'vegetariana', mexicana: 'mexicana', carnes: 'carnes' };

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : data.monto?.monto || data.detail?.[0] || 'No se pudo completar la solicitud.');
  return data;
}

function App() {
  const [user, setUser] = useState(undefined);
  const [notice, setNotice] = useState('');
  const location = useLocation();
  useEffect(() => { api('/auth/me').then((data) => setUser(data.user)).catch(() => setUser(null)); }, []);
  const notify = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 4500);
  }, []);

  const logout = async () => { await api('/auth/logout', { method: 'POST' }); setUser(null); notify('Sesión cerrada.'); };
  if (user === undefined) return <div className="loading-screen"><span className="spinner-border text-primary" aria-label="Cargando" /></div>;
  const isStaffPath = ['/staff', '/clientes', '/ingredientes', '/pizzas', '/pedidos', '/pagos'].some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

  return <>
    {isStaffPath ? <StaffNav user={user} /> : <PublicNav user={user} onLogout={logout} />}
    {notice && <div className="toast-message" role="status">{notice}</div>}
    <Routes>
      <Route path="/" element={<Home user={user} notify={notify} />} />
      <Route path="/pedido/confirmado" element={<Confirmation />} />
      <Route path="/rastrear" element={<Tracking />} />
      <Route path="/cuenta/crear" element={<AccountForm kind="register" setUser={setUser} notify={notify} />} />
      <Route path="/cuenta/ingresar" element={<AccountForm kind="login" setUser={setUser} notify={notify} />} />
      <Route path="/cuenta/pedidos" element={user?.is_staff ? <Navigate to="/staff" replace /> : user ? <CustomerOrders /> : <Navigate to="/cuenta/ingresar" replace />} />
      <Route path="/admin" element={<Navigate to={user?.is_staff ? '/staff' : '/cuenta/ingresar'} replace />} />
      <Route path="/staff/*" element={user?.is_staff ? <StaffDashboard /> : <Navigate to={`/cuenta/ingresar?next=${encodeURIComponent('/staff')}`} replace />} />
      <Route path="/clientes/*" element={user?.is_staff ? <StaffDashboard resource="clientes" /> : <Navigate to="/cuenta/ingresar" replace />} />
      <Route path="/ingredientes/*" element={user?.is_staff ? <StaffDashboard resource="ingredientes" /> : <Navigate to="/cuenta/ingresar" replace />} />
      <Route path="/pizzas/*" element={user?.is_staff ? <StaffDashboard resource="pizzas" /> : <Navigate to="/cuenta/ingresar" replace />} />
      <Route path="/pedidos/*" element={user?.is_staff ? <StaffDashboard resource="pedidos" /> : <Navigate to="/cuenta/ingresar" replace />} />
      <Route path="/pagos/*" element={user?.is_staff ? <StaffDashboard resource="pagos" /> : <Navigate to="/cuenta/ingresar" replace />} />
      <Route path="*" element={<main className="container py-5"><div className="alert alert-warning">No encontramos esa página. <Link to="/">Volver al inicio</Link></div></main>} />
    </Routes>
    {isStaffPath ? <footer className="admin-footer">PizIA · Gestión de pizzería</footer> : <footer className="site-footer py-4 mt-5"><div className="container d-flex flex-column flex-sm-row justify-content-between gap-2"><span><strong>PizIA</strong> · Pizza artesanal</span><span>Preparada con cariño, recién hecha para ti 🍕</span></div></footer>}
  </>;
}

function PublicNav({ user, onLogout }) {
  return <nav className="navbar navbar-light site-nav sticky-top" aria-label="Navegación principal"><div className="container site-nav-inner">
    <Link className="brand" to="/"><img className="brand-logo" src="/static/img/pizia-logo.png" alt="Logo PizIA" /><span>PizIA</span></Link>
    <div className="navbar-collapse"><div className="navbar-nav ms-auto align-items-lg-center gap-lg-3">
      <a className="nav-link" href="/#menu">Nuestro menú</a><a className="nav-link" href="/#pago">Pagos</a><Link className="nav-link" to="/rastrear">Rastrear pedido</Link><a className="btn btn-brand ms-lg-2" href="/#pedido">Pedir ahora</a>
      {user && !user.is_staff ? <><Link className="nav-link" to="/cuenta/pedidos">Hola, {user.first_name || user.email}</Link><button className="nav-link border-0 bg-transparent" onClick={onLogout}>Cerrar sesión</button></> : user?.is_staff ? <Link className="nav-link ms-lg-2" to="/staff">Administración</Link> : <><Link className="nav-link ms-lg-2" to="/cuenta/ingresar">Iniciar sesión</Link><Link className="btn btn-outline-primary rounded-pill" to="/cuenta/crear">Crear cuenta</Link></>}
    </div></div>
  </div></nav>;
}

function StaffNav({ user }) {
  return <nav className="navbar navbar-expand-lg navbar-dark admin-nav"><div className="container"><Link className="navbar-brand" to="/staff"><img className="brand-logo" src="/static/img/pizia-logo.png" alt="Logotipo de PizIA" /><span>PizIA</span></Link><div className="collapse navbar-collapse show"><ul className="navbar-nav ms-auto">{[['Clientes','clientes'],['Ingredientes','ingredientes'],['Pizzas','pizzas'],['Pedidos','pedidos'],['Pagos','pagos']].map(([label,path])=><li className="nav-item" key={path}><Link className="nav-link" to={`/${path}/`}>{label}</Link></li>)}<li className="nav-item"><Link className="nav-link" to="/">Ver tienda</Link></li><li className="nav-item"><span className="nav-link">{user.first_name || user.email}</span></li></ul></div></div></nav>;
}

function useMenu() {
  const [pizzas, setPizzas] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { api('/api/v1/pizzas/menu/').then(setPizzas).catch((e) => setError(e.message)); }, []);
  return { pizzas, error };
}

function Home({ user, notify }) {
  const { pizzas, error } = useMenu();
  const [selected, setSelected] = useState({});
  const [quantities, setQuantities] = useState({});
  const [payment, setPayment] = useState('efectivo');
  const [name, setName] = useState(user && !user.is_staff ? user.first_name : '');
  const [email, setEmail] = useState(user && !user.is_staff ? user.email : '');
  const [recommendations, setRecommendations] = useState([]);
  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  useEffect(() => {
    if (user && !user.is_staff) { setName(user.first_name || ''); setEmail(user.email || ''); }
  }, [user]);
  const groups = useMemo(() => pizzas.reduce((acc, pizza) => { (acc[pizza.nombre] ||= []).push(pizza); return acc; }, {}), [pizzas]);
  const selection = pizzas.filter((pizza) => selected[pizza.id]);
  const units = selection.reduce((sum, pizza) => sum + Number(quantities[pizza.id] || 1), 0);
  const total = selection.reduce((sum, pizza) => sum + Number(pizza.precio) * Number(quantities[pizza.id] || 1), 0);
  useEffect(() => {
    if (!selection.length) { setRecommendations([]); setSuggestionMessage(''); return undefined; }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams(); selection.forEach((pizza) => params.append('pizza', pizza.id));
        const data = await api(`/api/v1/recomendaciones-menu/?${params}`);
        if (active) { setRecommendations(data.recomendaciones || []); setSuggestionMessage(`Sugerencias calculadas con ${data.motor}.`); }
      } catch { if (active) setSuggestionMessage('No pudimos cargar sugerencias ahora. Puedes seguir con tu pedido.'); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [selection.map((item) => item.id).join(',')]);

  const toggle = (id) => setSelected((old) => ({ ...old, [id]: !old[id] }));
  const addSuggestion = (item) => {
    setSelected((old) => ({ ...old, [item.pizza]: true }));
    document.getElementById(`pizza-${item.pizza}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setFormError('');
    if (!selection.length) { setFormError('Selecciona al menos una pizza.'); setBusy(false); return; }
    if ((!user || user.is_staff) && (name.trim().length < 3 || !email.includes('@'))) { setFormError('Completa tu nombre y un correo válido.'); setBusy(false); return; }
    try {
      const order = await api('/api/v1/pedidos/publico/', { method: 'POST', body: JSON.stringify({ nombre: name, email, metodo_pago_preferido: payment, pizzas: selection.map((pizza) => ({ pizza_id: pizza.id, cantidad: Number(quantities[pizza.id] || 1) })) }) });
      sessionStorage.setItem('pizia-last-order', JSON.stringify(order)); window.location.assign('/pedido/confirmado');
    } catch (e) { setFormError(e.message); setBusy(false); }
  };

  return <>
    <section className="hero"><div className="container hero-inner"><div className="row align-items-center g-4"><div className="col-md-8 hero-copy"><div className="badge rounded-pill text-bg-light mb-3 px-3 py-2">🍕 Pizza artesanal</div><h1>Una pizza hecha para disfrutar.</h1><p className="lead mt-3 mb-4">Elige una receta, selecciona el tamaño y arma tu pedido. Hecha al momento con ingredientes deliciosos.</p><a className="btn btn-brand" href="#menu">Explorar el menú</a></div><div className="col-md-4 text-center d-none d-md-block"><img className="hero-logo" src="/static/img/pizia-logo.png" alt="PizIA, pizza artesanal" /></div></div></div></section>
    <section className="container py-5" id="menu"><div className="text-center mb-4"><div className="section-kicker">Recién salida del horno</div><h2 className="display-6 fw-bold mt-2">Nuestro menú</h2><p className="text-secondary mb-0">Selecciona una o varias pizzas. Cada sabor está disponible en distintos tamaños. Fotografías ilustrativas.</p></div>
      {error ? <div className="alert alert-warning">{error}</div> : !pizzas.length ? <div className="alert alert-info text-center">El menú se está preparando. Vuelve a visitarnos pronto.</div> : <form onSubmit={submit}>
        <div className="row g-3 g-lg-4">{Object.entries(groups).map(([nombre, variants]) => { const key = (photoNames[nombre.toLowerCase()] || 'margarita'); return <div className="col-md-6 col-xl-4" key={nombre}><article className="menu-card"><img className="menu-photo" src={`/static/img/pizzas/${key}.jpg`} alt={`Pizza ${nombre} artesanal`} loading="lazy" /><div className="menu-content"><h3 className="h4 mb-2">{nombre}</h3><p className="recipe mb-3">{variants[0].ingredientes.map((ingredient) => ingredient.nombre).join(', ') || 'Pizza artesanal'}</p><div className="d-grid gap-2">{variants.map((pizza) => <div className="size-option" key={pizza.id}><label className="size-choice" htmlFor={`pizza-${pizza.id}`}><input id={`pizza-${pizza.id}`} type="checkbox" checked={!!selected[pizza.id]} onChange={() => toggle(pizza.id)} /><span>{sizeNames[pizza.tamano] || pizza.tamano}</span><span className="size-price">{money.format(Number(pizza.precio))}</span></label><input type="number" className="form-control form-control-sm pizza-quantity" min="1" max="20" value={quantities[pizza.id] || 1} disabled={!selected[pizza.id]} aria-label={`Cantidad de ${pizza.nombre} ${sizeNames[pizza.tamano]}`} onChange={(event) => setQuantities((old) => ({ ...old, [pizza.id]: Math.max(1, Math.min(20, Number(event.target.value) || 1)) }))} /></div>)}</div></div></article></div>; })}</div>
        {selection.length > 0 && <section className="mt-5" aria-live="polite"><div className="section-kicker">Recomendación inteligente</div><h2 className="h3 fw-bold mt-1">También podría gustarte</h2><p className="text-secondary">{suggestionMessage || 'Analizando las recetas que elegiste…'}</p><div className="row g-3">{recommendations.map((item) => <div className="col-md-4" key={item.pizza}><article className="ai-card p-3 h-100"><span className="ai-tag">Similitud {item.similitud}%</span><h3 className="h5 fw-bold text-primary mt-3">{item.nombre}</h3><p className="small text-secondary mb-1">{sizeNames[item.tamano] || item.tamano} · {money.format(Number(item.precio))}</p><p className="small mb-3">{item.motivo}</p><button type="button" className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => addSuggestion(item)}>Agregar al pedido</button></article></div>)}</div></section>}
        <div className="row justify-content-center mt-5" id="pedido"><div className="col-lg-8 col-xl-7"><section className="order-panel p-4 p-md-5"><div className="section-kicker">Un último paso</div><h2 className="h3 fw-bold mt-1 mb-3">Completa tu pedido</h2><p className="text-secondary">Déjanos tus datos y elige cómo prefieres pagar. El pedido se confirma con el equipo.</p>
          {user && !user.is_staff ? <div className="alert alert-info">Este pedido quedará registrado a nombre de <strong>{user.first_name || user.email}</strong> ({user.email}).</div> : <div className="row g-3 mb-3"><div className="col-md-6"><label className="form-label" htmlFor="customer-name">Tu nombre</label><input id="customer-name" className="form-control" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></div><div className="col-md-6"><label className="form-label" htmlFor="customer-email">Correo electrónico</label><input id="customer-email" type="email" className="form-control" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div></div>}
          <fieldset className="mb-4" id="pago"><legend className="form-label mb-2">¿Cómo prefieres pagar?</legend><div className="row g-2">{Object.entries(paymentNames).map(([value,label]) => <div className="col-md-4" key={value}><label className="payment-option" htmlFor={`payment-${value}`}><input id={`payment-${value}`} type="radio" name="payment" checked={payment === value} onChange={() => setPayment(value)} /><strong>{label}</strong><small>{value === 'efectivo' ? 'Pagas al recibir en casa.' : value === 'tarjeta' ? 'Pagas con tarjeta al recibir.' : 'El equipo te comparte los datos para transferir.'}</small></label></div>)}</div><p className="small text-secondary mt-2 mb-0">Por seguridad, no pedimos datos de tarjeta en esta página.</p></fieldset>
          <div className="order-summary p-3 mb-4 d-flex justify-content-between align-items-center"><span><strong>{units}</strong> pizzas seleccionadas</span><span className="fw-bold text-primary">Total: {money.format(total)}</span></div>
          {formError && <div className="alert alert-danger" role="alert">{formError}</div>}<button className="btn btn-blue w-100" type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar pedido'}</button><p className="small text-secondary text-center mt-3 mb-0">Al enviar, podrás consultar el estado con tu número de pedido y correo.</p>
        </section></div></div>
      </form>}
    </section>
  </>;
}

function Confirmation() {
  const order = useMemo(() => { try { return JSON.parse(sessionStorage.getItem('pizia-last-order') || 'null'); } catch { return null; } }, []);
  if (!order) return <main className="container py-5"><section className="confirmation p-4 p-md-5 text-center"><h1 className="h2">No hay un pedido reciente</h1><p className="text-secondary">Puedes revisar el estado con el número y el correo de confirmación.</p><Link className="btn btn-blue" to="/rastrear">Rastrear pedido</Link></section></main>;
  return <main className="container px-3"><section className="confirmation p-4 p-md-5 text-center"><div className="checkmark" aria-hidden="true">✓</div><div className="section-kicker">Pedido registrado</div><h1 className="h2 fw-bold mt-2">¡Gracias, {order.cliente_nombre}!</h1><p className="text-secondary">Tu pedido <strong>#{order.id}</strong> quedó recibido.</p><div className="text-start border rounded-3 p-3 my-4">{order.pizzas.map((line) => <div className="d-flex justify-content-between gap-3 py-2 border-bottom" key={line.pizza}><span>{line.cantidad} × {line.nombre} ({sizeNames[line.tamano] || line.tamano})</span><strong>{money.format(Number(line.subtotal || Number(line.precio_unitario) * line.cantidad))}</strong></div>)}<div className="d-flex justify-content-between pt-3 mt-2 fw-bold"><span>Total</span><span>{money.format(Number(order.total))}</span></div></div><p className="mb-1">Método elegido: <strong>{paymentNames[order.metodo_pago_preferido]}</strong></p><p className="small text-secondary">No se realizó ningún cobro en línea. El equipo coordinará el pago según el método elegido.</p><Link className="btn btn-blue mt-2" to={`/rastrear?numero=${order.id}&email=${encodeURIComponent(order.email || '')}`}>Rastrear pedido</Link><Link className="btn btn-outline-primary rounded-pill mt-2 ms-2" to="/#menu">Volver al menú</Link></section></main>;
}

function Tracking() {
  const location = useLocation();
  const [number, setNumber] = useState(new URLSearchParams(location.search).get('numero') || '');
  const [email, setEmail] = useState(new URLSearchParams(location.search).get('email') || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lookup = async (event) => { event?.preventDefault(); setBusy(true); setError(''); setOrder(null); try { const params = new URLSearchParams({ numero: number, email }); setOrder(await api(`/api/v1/pedidos/seguimiento/?${params}`)); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  useEffect(() => { if (new URLSearchParams(location.search).get('numero') && new URLSearchParams(location.search).get('email')) lookup(); }, []);
  return <main className="container px-3 tracking-wrap"><section className="tracking-card p-4 p-md-5"><div className="section-kicker">Estamos contigo</div><h1 className="h2 fw-bold mt-2">Rastrea tu pedido</h1><p className="text-secondary">Ingresa el número de pedido y el mismo correo que usaste al comprar.</p><form onSubmit={lookup} className="row g-3 mt-2"><div className="col-md-6"><label className="form-label fw-bold" htmlFor="track-number">Número de pedido</label><input id="track-number" className="form-control" type="number" min="1" placeholder="Ej. 104" value={number} onChange={(event) => setNumber(event.target.value)} required /></div><div className="col-md-6"><label className="form-label fw-bold" htmlFor="track-email">Correo usado al pedir</label><input id="track-email" className="form-control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div><div className="col-12"><button className="btn btn-blue" disabled={busy}>{busy ? 'Consultando…' : 'Consultar estado'}</button></div></form>
    {error && <div className="alert alert-warning mt-4">{error}</div>}{order && <><hr className="my-4" /><div className="d-flex flex-wrap justify-content-between align-items-center gap-2"><h2 className="h4 fw-bold mb-0">Pedido #{order.id}</h2><span className="status-pill"><span className="status-dot" />{stateNames[order.estado] || order.estado}</span></div><p className="text-secondary small mt-2">Registrado el {new Date(order.fecha).toLocaleString('es-CO')} · Pago: {paymentNames[order.metodo_pago_preferido]}</p><div className="border rounded-3 p-3">{order.pizzas.map((line, index) => <div className={`d-flex justify-content-between gap-3 py-2 ${index < order.pizzas.length - 1 ? 'border-bottom' : ''}`} key={`${line.pizza}-${index}`}><span>{line.cantidad} × {line.nombre} · {sizeNames[line.tamano] || line.tamano}</span><strong>{money.format(Number(line.subtotal || Number(line.precio_unitario) * line.cantidad))}</strong></div>)}<div className="d-flex justify-content-between pt-3 mt-2 border-top fw-bold"><span>Total</span><span>{money.format(Number(order.total))}</span></div></div><p className="small text-secondary mt-3 mb-0">Para cambiar el pedido o coordinar la entrega, comunícate con la pizzería.</p></>}
  </section></main>;
}

function AccountForm({ kind, setUser, notify }) {
  const isRegister = kind === 'register';
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(''); try { const result = await api(isRegister ? '/auth/register' : '/auth/login', { method: 'POST', body: JSON.stringify(form) }); setUser(result.user); notify(isRegister ? 'Tu cuenta está lista.' : 'Sesión iniciada.'); navigate(new URLSearchParams(location.search).get('next') || '/'); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  return <main className="container px-3 py-5 auth-wrap"><section className="auth-card p-4 p-md-5"><div className="section-kicker">{isRegister ? 'Únete a PizIA' : 'Tu cuenta PizIA'}</div><h1 className="h2 fw-bold mt-2">{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h1><p className="text-secondary">{isRegister ? 'Registra tus datos para pedir con tu cuenta de cliente.' : 'Ingresa con el correo y la contraseña de tu cuenta.'}</p><form onSubmit={submit} className="mt-4">{isRegister && <div className="mb-3"><label className="form-label fw-bold" htmlFor="register-name">Tu nombre</label><input id="register-name" className="form-control" autoComplete="name" maxLength="100" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} required /></div>}<div className="mb-3"><label className="form-label fw-bold" htmlFor="account-email">Correo electrónico</label><input id="account-email" className="form-control" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div><div className="mb-3"><label className="form-label fw-bold" htmlFor="account-password">Contraseña</label><input id="account-password" className="form-control" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />{isRegister && <div className="form-text">Usa al menos 8 caracteres; no uses una contraseña solo numérica.</div>}</div>{error && <div className="alert alert-danger">{error}</div>}<button className="btn btn-blue w-100 mt-2" disabled={busy}>{busy ? 'Un momento…' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</button></form><p className="text-center mt-4 mb-0">{isRegister ? <>¿Ya tienes cuenta? <Link to="/cuenta/ingresar">Iniciar sesión</Link></> : <>¿Aún no tienes cuenta? <Link to="/cuenta/crear">Crear cuenta</Link></>}</p></section></main>;
}

function CustomerOrders() {
  const [orders, setOrders] = useState([]); const [error, setError] = useState('');
  useEffect(() => { api('/api/v1/cuenta/pedidos/').then(setOrders).catch((e) => setError(e.message)); }, []);
  return <main className="container py-5"><div className="section-kicker">Tu cuenta PizIA</div><h1 className="h2 fw-bold">Mis pedidos</h1>{error ? <div className="alert alert-warning mt-3">{error}</div> : !orders.length ? <p className="text-secondary mt-3">Aún no tienes pedidos.</p> : <div className="row g-3 mt-1">{orders.map((order) => <div className="col-lg-6" key={order.id}><article className="order-panel p-4"><div className="d-flex justify-content-between"><h2 className="h5">Pedido #{order.id}</h2><span className="status-pill">{stateNames[order.estado]}</span></div><p className="small text-secondary">{new Date(order.fecha).toLocaleString('es-CO')}</p><p>{order.pizzas.map((item) => `${item.cantidad} × ${item.nombre}`).join(' · ')}</p><strong>{money.format(Number(order.total))}</strong><div><Link to={`/rastrear?numero=${order.id}&email=${encodeURIComponent(order.cliente_email || '')}`} className="btn btn-sm btn-outline-primary rounded-pill mt-3">Rastrear</Link></div></article></div>)}</div>}</main>;
}

const resourceConfig = {
  clientes: { title: 'Clientes', fields: [['nombre','Nombre'],['email','Correo electrónico']], columns: [['nombre','Nombre'],['email','Correo']], endpoint: 'clientes' },
  ingredientes: { title: 'Ingredientes', fields: [['nombre','Nombre']], columns: [['nombre','Nombre']], endpoint: 'ingredientes' },
  pizzas: { title: 'Pizzas', fields: [['nombre','Nombre'],['tamano','Tamaño'],['precio','Precio'],['ingredientes','Ingredientes']], columns: [['nombre','Pizza'],['tamano','Tamaño'],['precio','Precio']], endpoint: 'pizzas' },
  pedidos: { title: 'Pedidos', fields: [['cliente','Cliente'],['pizza_ids','Pizzas'],['estado','Estado'],['metodo_pago_preferido','Método de pago']], columns: [['id','Pedido'],['cliente_nombre','Cliente'],['estado','Estado'],['total','Total'],['fecha','Fecha']], endpoint: 'pedidos' },
  pagos: { title: 'Pagos', fields: [['pedido','Pedido'],['monto','Monto'],['metodo','Método']], columns: [['id','Pago'],['pedido','Pedido'],['monto','Monto'],['metodo','Método'],['fecha_pago','Fecha']], endpoint: 'pagos' },
};

function StaffDashboard({ resource }) {
  const location = useLocation(); const navigate = useNavigate();
  const active = resource || location.pathname.split('/')[1] || 'clientes';
  const config = resourceConfig[active];
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [page, setPage] = useState(1); const [totalCount, setTotalCount] = useState(0);
  const [editing, setEditing] = useState(null); const [ingredients, setIngredients] = useState([]); const [clients, setClients] = useState([]); const [pizzas, setPizzas] = useState([]); const [orders, setOrders] = useState([]);
  const base = `/api/v1/${config?.endpoint}/`;
  const load = useCallback(async () => { if (!config) return; setLoading(true); setError(''); try { const [data, ing, cli, piz, ord] = await Promise.all([api(`${base}?page=${page}`), api('/api/v1/ingredientes/catalogo/').catch(() => []), api('/api/v1/clientes/catalogo/').catch(() => []), api('/api/v1/pizzas/menu/').catch(() => []), api('/api/v1/pedidos/catalogo/').catch(() => [])]); setRows(Array.isArray(data) ? data : data.results || []); setTotalCount(Array.isArray(data) ? data.length : data.count ?? data.results?.length ?? 0); setIngredients(ing); setClients(cli); setPizzas(piz); setOrders(ord); } catch (e) { setError(e.message); } finally { setLoading(false); } }, [base, config, page]);
  useEffect(() => { load(); }, [load]);
  const deleting = async (row) => { if (!window.confirm(`¿Eliminar ${config.title.toLowerCase()}${row.nombre ? ` «${row.nombre}»` : ` #${row.id}`}?`)) return; try { await api(`${base}${row.id}/`, { method: 'DELETE' }); await load(); } catch (e) { setError(e.message); } };
  const startEdit = (row = null) => { setEditing(row ? { ...row, ingredientes: row.ingredientes?.map((item) => typeof item === 'object' ? item.id : item) || [], pizza_ids: row.pizzas?.map((item) => item.pizza) || [] } : {}); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const save = async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const body = Object.fromEntries(form.entries());
    if (active === 'pizzas') body.ingredientes = form.getAll('ingredientes').map(Number);
    if (active === 'pedidos') body.pizza_ids = form.getAll('pizza_ids').map(Number);
    if (active === 'pedidos' && !body.pizza_ids.length && editing?.id) body.pizza_ids = editing.pizza_ids;
    if (active === 'pagos') body.monto = Number(body.monto);
    try { await api(editing?.id ? `${base}${editing.id}/` : base, { method: editing?.id ? 'PATCH' : 'POST', body: JSON.stringify(body) }); setEditing(null); await load(); } catch (e) { setError(e.message); }
  };
  if (!config) return <main className="container py-5"><section className="admin-card p-4"><div className="section-kicker">Panel interno</div><h1 className="h2 fw-bold">Gestión de PizIA</h1><p className="text-secondary">Administra los datos del menú, los clientes y la operación.</p><div className="row g-3 mt-2">{Object.entries(resourceConfig).map(([key,item]) => <div className="col-md-4" key={key}><Link className="admin-link-card" to={`/${key}/`}><h2 className="h5">{item.title}</h2><span>Abrir gestión →</span></Link></div>)}</div></section></main>;
  return <main className="container py-4"><div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div><div className="section-kicker">Panel interno</div><h1 className="h2 fw-bold mb-0">{config.title}</h1></div><button className="btn btn-blue" onClick={() => editing ? setEditing(null) : startEdit()}>{editing ? 'Cancelar' : `Agregar ${config.title.toLowerCase().slice(0,-1)}`}</button></div>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {editing && <form className="admin-card p-4 mb-4" onSubmit={save}><h2 className="h5 fw-bold">{editing.id ? 'Editar registro' : 'Nuevo registro'}</h2><div className="row g-3">{config.fields.map(([key,label]) => <div className="col-md-6" key={key}><label className="form-label fw-bold" htmlFor={`staff-${key}`}>{label}</label>
      {key === 'nombre' || key === 'email' ? <input className="form-control" id={`staff-${key}`} name={key} type={key === 'email' ? 'email' : 'text'} required defaultValue={editing[key] || ''} />
        : key === 'precio' || key === 'monto' ? <input className="form-control" id={`staff-${key}`} name={key} type="number" min="1" step="0.01" required defaultValue={editing[key] || ''} />
        : key === 'tamano' ? <select className="form-select" id={`staff-${key}`} name={key} defaultValue={editing[key] || 'mediana'}>{Object.entries(sizeNames).map(([value,text]) => <option key={value} value={value}>{text}</option>)}</select>
        : key === 'ingredientes' ? <select multiple className="form-select" id={`staff-${key}`} name={key} defaultValue={editing.ingredientes || []}>{ingredients.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select>
        : key === 'cliente' ? <select className="form-select" id={`staff-${key}`} name={key} defaultValue={editing[key] || ''} required><option value="">Selecciona un cliente</option>{clients.map((item) => <option key={item.id} value={item.id}>{item.nombre} · {item.email}</option>)}</select>
        : key === 'pedido' ? <select className="form-select" id={`staff-${key}`} name={key} defaultValue={editing[key] || ''} required><option value="">Selecciona un pedido</option>{orders.filter((item) => item.id === editing.pedido || !rows.some((paid) => Number(paid.pedido) === Number(item.id))).map((item) => <option key={item.id} value={item.id}>#{item.id} · {item.cliente_nombre} · {money.format(Number(item.total))}</option>)}</select>
        : key === 'pizza_ids' ? <select multiple className="form-select" id={`staff-${key}`} name={key} defaultValue={editing.pizza_ids || []}>{pizzas.map((item) => <option key={item.id} value={item.id}>{item.nombre} · {sizeNames[item.tamano]} · {money.format(Number(item.precio))}</option>)}</select>
        : key === 'estado' ? <select className="form-select" id={`staff-${key}`} name={key} defaultValue={editing[key] || 'recibido'}>{Object.entries(stateNames).map(([value,text]) => <option key={value} value={value}>{text}</option>)}</select>
        : key === 'metodo_pago_preferido' || key === 'metodo' ? <select className="form-select" id={`staff-${key}`} name={key} defaultValue={editing[key] || 'efectivo'}>{Object.entries(paymentNames).map(([value,text]) => <option key={value} value={value}>{text}</option>)}</select> : null}</div>)}</div><p className="form-text mt-2">En listas de selección múltiple, mantén Ctrl (Windows) o ⌘ (Mac) al elegir varias opciones.</p><button className="btn btn-blue mt-2">Guardar</button></form>}
    {loading ? <p className="text-secondary">Cargando…</p> : <><div className="admin-card table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr>{config.columns.map(([key,label]) => <th key={key}>{label}</th>)}<th className="text-end">Acciones</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{config.columns.map(([key]) => <td key={key}>{key === 'precio' || key === 'total' || key === 'monto' ? money.format(Number(row[key])) : key === 'tamano' ? sizeNames[row[key]] || row[key] : key === 'estado' ? stateNames[row[key]] || row[key] : key === 'fecha' || key === 'fecha_pago' ? new Date(row[key]).toLocaleString('es-CO') : key === 'metodo' ? paymentNames[row[key]] || row[key] : key === 'cliente_nombre' ? row[key] : key === 'pizza' ? row.pizzas?.map((item) => item.nombre).join(', ') || '—' : row[key] ?? '—'}</td>)}<td className="text-end text-nowrap">{active !== 'pagos' && <button className="btn btn-sm btn-outline-primary rounded-pill me-1" onClick={() => startEdit(row)}>Editar</button>}<button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => deleting(row)}>Eliminar</button></td></tr>)}{!rows.length && <tr><td colSpan={config.columns.length + 1} className="text-center text-secondary py-4">Todavía no hay registros.</td></tr>}</tbody></table></div>{['clientes','ingredientes'].includes(active) && totalCount > 20 && <div className="d-flex justify-content-between align-items-center mt-3"><span className="small text-secondary">Página {page} de {Math.ceil(totalCount / 20)} · {totalCount} registros</span><div className="btn-group"><button className="btn btn-outline-primary" disabled={page <= 1} onClick={() => setPage((old) => old - 1)}>Anterior</button><button className="btn btn-outline-primary" disabled={page >= Math.ceil(totalCount / 20)} onClick={() => setPage((old) => old + 1)}>Siguiente</button></div></div>}</>}
  </main>;
}

export default App;
