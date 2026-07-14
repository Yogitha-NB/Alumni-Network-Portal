import { useState, useEffect, useContext, createContext, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { io } from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// ─── Global Styles ────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("asq")) return;
  const s = document.createElement("style");
  s.id = "asq";
  s.textContent = `
    :root{--bg:#f0f4ff;--sur:#fff;--sur2:#f8fafc;--brd:#e2e8f0;--txt:#1e293b;--mut:#64748b;--pri:#1d4ed8;--pri2:#1e40af;--rad:14px;--rsm:10px;--shd:0 2px 16px rgba(30,64,175,.07)}
    [data-theme="dark"]{--bg:#0f172a;--sur:#1e293b;--sur2:#162032;--brd:#334155;--txt:#f1f5f9;--mut:#94a3b8;--shd:0 2px 16px rgba(0,0,0,.3)}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--txt);transition:background .3s,color .3s;min-height:100vh}
    .cg{background:var(--sur);border:1px solid var(--brd);border-radius:var(--rad);box-shadow:var(--shd);padding:20px 22px}
    .bp{background:var(--pri);color:#fff;border:none;border-radius:var(--rsm);padding:9px 20px;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit;transition:background .15s}
    .bp:hover{background:var(--pri2)}.bp:disabled{opacity:.6;cursor:not-allowed}
    .bo{background:transparent;color:var(--pri);border:1.5px solid var(--pri);border-radius:var(--rsm);padding:8px 18px;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit;transition:all .15s}
    .bo:hover{background:var(--pri);color:#fff}
    .ff{width:100%;padding:10px 14px;font-size:14px;border:1.5px solid var(--brd);border-radius:var(--rsm);background:var(--sur);color:var(--txt);outline:none;font-family:inherit;transition:border-color .15s}
    .ff:focus{border-color:var(--pri);box-shadow:0 0 0 3px rgba(29,78,216,.1)}
    .ff.err{border-color:#dc2626}
    textarea.ff{resize:vertical;min-height:80px}
    select.ff option{background:var(--sur);color:var(--txt)}
    .av{border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;flex-shrink:0}
    .sk{background:linear-gradient(90deg,var(--brd) 25%,var(--sur2) 50%,var(--brd) 75%);background-size:200% 100%;animation:sh 1.4s infinite;border-radius:8px}
    @keyframes sh{0%,100%{background-position:200% 0}50%{background-position:-200% 0}}
    .tc{position:fixed;top:80px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px}
    .ti{padding:12px 18px;border-radius:var(--rsm);font-weight:600;font-size:14px;display:flex;align-items:center;gap:10px;animation:si .3s ease;box-shadow:0 4px 20px rgba(0,0,0,.15);min-width:240px;max-width:340px}
    @keyframes si{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
    .sk-pill{display:inline-block;background:#eff6ff;color:#1d4ed8;border-radius:8px;padding:3px 10px;font-size:12px;font-weight:600;margin:2px}
    [data-theme="dark"] .sk-pill{background:#1e3a5f;color:#93c5fd}
    .ac{transition:transform .18s,box-shadow .18s}
    .ac:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(30,64,175,.14)!important}
    .pg{width:36px;height:36px;border-radius:8px;border:1.5px solid var(--brd);background:var(--sur);color:var(--txt);font-weight:600;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
    .pg.on{background:var(--pri);color:#fff;border-color:var(--pri)}
    .pg:disabled{opacity:.4;cursor:not-allowed}
    .sr{position:absolute;top:100%;left:0;right:0;background:var(--sur);border:1px solid var(--brd);border-radius:var(--rsm);box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:500;max-height:360px;overflow-y:auto}
    .si2:hover{background:var(--sur2)}.si2{padding:10px 14px;cursor:pointer;font-size:14px}
    .ud{width:8px;height:8px;background:#dc2626;border-radius:50%;display:inline-block}
    .fp{padding:6px 14px;border-radius:20px;border:1.5px solid var(--brd);background:var(--sur);color:var(--mut);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
    .fp.on{background:var(--pri);color:#fff;border-color:var(--pri)}
    .tb{padding:8px 18px;border-radius:10px;border:none;background:transparent;color:var(--mut);font-weight:600;font-size:14px;cursor:pointer;font-family:inherit}
    .tb.on{background:var(--pri);color:#fff}
    .hg{background:linear-gradient(135deg,#1d4ed8,#4f46e5);border-radius:20px;color:#fff}
    .em{color:#dc2626;font-size:12px;margin-top:4px}
    .social-btn{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600;transition:opacity .15s;margin:2px}
    .social-btn:hover{opacity:.8}
    .star{color:#f59e0b;font-size:20px;cursor:pointer}
    .ns{position:fixed;top:80px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;padding:12px 24px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.2);z-index:9999;font-weight:600;font-size:14px;animation:si .3s ease}
  `;
  document.head.appendChild(s);
};
injectStyles();

// ─── WebSocket ────────────────────────────────────────────────
let socket = null;
const getSocket = () => { if (!socket) socket = io("http://localhost:5000", { transports: ["websocket"] }); return socket; };

// ─── Theme Context ─────────────────────────────────────────────
const ThemeCtx = createContext(null);
function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  useEffect(() => { document.documentElement.setAttribute("data-theme", dark ? "dark" : "light"); localStorage.setItem("theme", dark ? "dark" : "light"); }, [dark]);
  return <ThemeCtx.Provider value={{ dark, setDark }}>{children}</ThemeCtx.Provider>;
}
const useTheme = () => useContext(ThemeCtx);

// ─── Auth Context ──────────────────────────────────────────────
const AuthCtx = createContext(null);
function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => { try { const s = localStorage.getItem("au"); return s ? JSON.parse(s) : null; } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("at") || null);
  const login  = (u, t) => { setUser(u); setToken(t); localStorage.setItem("au", JSON.stringify(u)); localStorage.setItem("at", t); getSocket().emit("join", { user_id: u.id }); };
  const logout = ()      => { setUser(null); setToken(null); localStorage.removeItem("au"); localStorage.removeItem("at"); if (socket) { socket.disconnect(); socket = null; } };
  const updateUser = upd => { const n = { ...user, ...upd }; setUser(n); localStorage.setItem("au", JSON.stringify(n)); };
  return <AuthCtx.Provider value={{ user, token, login, logout, updateUser }}>{children}</AuthCtx.Provider>;
}
const useAuth = () => useContext(AuthCtx);

// ─── Toast Context ─────────────────────────────────────────────
const ToastCtx = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  const cols = { success: "#16a34a", danger: "#dc2626", info: "#1d4ed8", warning: "#d97706" };
  return (
    <ToastCtx.Provider value={{ addToast }}>
      {children}
      <div className="tc">
        {toasts.map(t => (
          <div key={t.id} className="ti" style={{ background: cols[t.type] || cols.info, color: "#fff" }}>
            <span>{t.type === "success" ? "✓" : t.type === "danger" ? "✕" : "ℹ"}</span>
            <span style={{ flex: 1 }}>{t.msg}</span>
            <span style={{ cursor: "pointer", opacity: .7 }} onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}>✕</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);

// ─── API Helper ───────────────────────────────────────────────
const BASE = "http://localhost:5000/api";
async function api(path, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res  = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : null });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

// ─── Helpers ──────────────────────────────────────────────────
const CLRS = ["#1d4ed8","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#9333ea"];
const gc   = id => CLRS[(id || 0) % CLRS.length];
const gi   = (n = "") => n.split(" ").map(x => x[0]).join("").toUpperCase().slice(0, 2);
const PG   = 12;

function Avatar({ name, id, size = 48 }) {
  return <div className="av" style={{ width: size, height: size, background: gc(id || 0), fontSize: size * 0.3, borderRadius: size * 0.25 }}>{gi(name)}</div>;
}
function Skel({ h = 160 }) { return <div className="cg"><div className="sk" style={{ height: h, borderRadius: 10 }} /></div>; }
function FErr({ msg }) { return msg ? <div className="em">⚠ {msg}</div> : null; }
function Pager({ total, page, setPage }) {
  const n = Math.ceil(total / PG);
  if (n <= 1) return null;
  return <div style={{ display:"flex",justifyContent:"center",gap:6,marginTop:24,flexWrap:"wrap" }}><button className="pg" disabled={page===1} onClick={()=>setPage(p=>p-1)}>←</button>{Array.from({length:n},(_,i)=><button key={i+1} className={`pg${page===i+1?" on":""}`} onClick={()=>setPage(i+1)}>{i+1}</button>)}<button className="pg" disabled={page===n} onClick={()=>setPage(p=>p+1)}>→</button></div>;
}
function SocialLinks({ alumni }) {
  const socials = [
    { key:"linkedin",  label:"LinkedIn",  color:"#0a66c2", icon:"in" },
    { key:"twitter",   label:"Twitter",   color:"#1da1f2", icon:"𝕏" },
    { key:"facebook",  label:"Facebook",  color:"#1877f2", icon:"f" },
    { key:"instagram", label:"Instagram", color:"#e1306c", icon:"📸" },
  ];
  const links = socials.filter(s => alumni[s.key]);
  if (!links.length) return null;
  return (
    <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginTop:8 }}>
      {links.map(s => <a key={s.key} href={alumni[s.key]} target="_blank" rel="noreferrer" className="social-btn" style={{ background:s.color,color:"#fff" }}><span style={{ fontWeight:900 }}>{s.icon}</span>{s.label}</a>)}
    </div>
  );
}
function StarRating({ value, onChange, readonly = false }) {
  return <div style={{ display:"flex",gap:4 }}>{[1,2,3,4,5].map(n=><span key={n} className="star" onClick={()=>!readonly&&onChange&&onChange(n)} style={{ color:n<=value?"#f59e0b":"#cbd5e1",cursor:readonly?"default":"pointer" }}>★</span>)}</div>;
}

// ─── Navbar ───────────────────────────────────────────────────
function Navbar() {
  const { user, token, logout } = useAuth();
  const { dark, setDark }       = useTheme();
  const navigate                = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [unread,   setUnread]   = useState(0);
  const [wsNotif,  setWsNotif]  = useState(null);
  const [srch,     setSrch]     = useState("");
  const [srchRes,  setSrchRes]  = useState(null);
  const [srchOpen, setSrchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const srchRef = useRef(null);

  useEffect(()=>{ const fn=()=>setScrolled(window.scrollY>10); window.addEventListener("scroll",fn); return()=>window.removeEventListener("scroll",fn); },[]);
  useEffect(()=>{
    if(!user)return;
    const s=getSocket();
    s.emit("join",{user_id:user.id});
    s.on("new_message",()=>{setUnread(u=>u+1);setWsNotif("📩 New message received!");setTimeout(()=>setWsNotif(null),4000);});
    s.on("account_approved",()=>{setWsNotif("✅ Your account was approved!");setTimeout(()=>setWsNotif(null),4000);});
    return()=>{s.off("new_message");s.off("account_approved");};
  },[user]);
  useEffect(()=>{
    if(!user||!token)return;
    const fn=()=>api(`/messages/unread/${user.id}`,"GET",null,token).then(d=>setUnread(d.count)).catch(()=>{});
    fn(); const t=setInterval(fn,30000); return()=>clearInterval(t);
  },[user,token]);
  useEffect(()=>{
    const fn=e=>{if(srchRef.current&&!srchRef.current.contains(e.target))setSrchOpen(false);};
    document.addEventListener("mousedown",fn); return()=>document.removeEventListener("mousedown",fn);
  },[]);
  useEffect(()=>{
    if(!srch.trim()){setSrchRes(null);return;}
    const t=setTimeout(async()=>{try{const d=await api(`/search?q=${encodeURIComponent(srch)}`,"GET",null,token);setSrchRes(d);setSrchOpen(true);}catch{}},400);
    return()=>clearTimeout(t);
  },[srch,token]);

  const navLinks = user ? [
    {to:"/dashboard",l:"Dashboard"},{to:"/alumni",l:"Alumni"},{to:"/forum",l:"Forum"},
    {to:"/events",l:"Events"},{to:"/mentorship",l:"Mentorship"},{to:"/opportunities",l:"Opportunities"},
    {to:"/gallery",l:"Gallery"},{to:"/stories",l:"Stories"},
    {to:"/inbox",l:unread>0?`Inbox(${unread})`:"Inbox",badge:unread>0},
    ...(user.role==="admin"?[{to:"/admin",l:"⚙ Admin"}]:[]),
    ...(user.role==="alumni"?[{to:"/profile",l:"Profile"}]:[]),
  ] : [];

  return (
    <>
      {wsNotif&&<div className="ns">{wsNotif}</div>}
      <nav style={{position:"sticky",top:0,zIndex:1000,background:"linear-gradient(90deg,#1d4ed8,#4f46e5)",boxShadow:scrolled?"0 4px 24px rgba(29,78,216,.25)":"none",transition:"box-shadow .3s"}}>
        <div className="container">
          <div style={{display:"flex",alignItems:"center",height:64,gap:12}}>
            <Link to="/" style={{fontWeight:800,fontSize:17,color:"#fff",textDecoration:"none",flexShrink:0,whiteSpace:"nowrap"}}>🎓 AlumniNet</Link>
            <div className="d-none d-xl-flex" style={{gap:2,flex:1,flexWrap:"wrap"}}>
              {navLinks.map(l=>(
                <Link key={l.to} to={l.to} style={{color:"rgba(255,255,255,.85)",textDecoration:"none",fontSize:12,fontWeight:600,padding:"5px 8px",borderRadius:8,whiteSpace:"nowrap"}}
                  onMouseEnter={e=>e.target.style.background="rgba(255,255,255,.15)"} onMouseLeave={e=>e.target.style.background="transparent"}>
                  {l.l}{l.badge&&<span className="ud" style={{marginLeft:4}}/>}
                </Link>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
              {user&&(
                <div ref={srchRef} className="d-none d-md-block" style={{position:"relative",width:200}}>
                  <input className="ff" style={{paddingLeft:30,height:32,fontSize:12,background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",color:"#fff",borderRadius:8}} placeholder="Search..." value={srch} onChange={e=>setSrch(e.target.value)} onFocus={()=>srchRes&&setSrchOpen(true)}/>
                  <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"rgba(255,255,255,.7)"}}>🔍</span>
                  {srchOpen&&srchRes&&(
                    <div className="sr">
                      {srchRes.alumni?.length>0&&<><div style={{padding:"6px 14px 2px",fontSize:11,fontWeight:700,color:"var(--mut)",textTransform:"uppercase"}}>Alumni</div>{srchRes.alumni.map(a=><div key={a.id} className="si2" onClick={()=>{setSrch("");setSrchOpen(false);navigate("/alumni")}}><strong>{a.name}</strong><span style={{color:"var(--mut)",fontSize:12,marginLeft:8}}>{a.company}</span></div>)}</>}
                      {srchRes.events?.length>0&&<><div style={{padding:"6px 14px 2px",fontSize:11,fontWeight:700,color:"var(--mut)",textTransform:"uppercase"}}>Events</div>{srchRes.events.map(e=><div key={e.id} className="si2" onClick={()=>{setSrch("");setSrchOpen(false);navigate("/events")}}>{e.title}</div>)}</>}
                      {srchRes.jobs?.length>0&&<><div style={{padding:"6px 14px 2px",fontSize:11,fontWeight:700,color:"var(--mut)",textTransform:"uppercase"}}>Jobs</div>{srchRes.jobs.map(j=><div key={j.id} className="si2" onClick={()=>{setSrch("");setSrchOpen(false);navigate("/opportunities")}}>{j.title}</div>)}</>}
                    </div>
                  )}
                </div>
              )}
              <button onClick={()=>setDark(!dark)} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:14,color:"#fff"}}>{dark?"☀️":"🌙"}</button>
              {user?(
                <>
                  <div className="d-none d-md-flex" style={{alignItems:"center",gap:8}}>
                    <Avatar name={user.name} id={user.id} size={32}/>
                    <div style={{lineHeight:1.2}}><div style={{color:"#fff",fontSize:12,fontWeight:600}}>{user.name}</div><span style={{background:"rgba(255,255,255,.2)",color:"#fff",fontSize:10,padding:"1px 6px",borderRadius:6,fontWeight:600}}>{user.role}</span></div>
                  </div>
                  <button onClick={()=>{logout();navigate("/");}} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:8,color:"#fff",padding:"5px 12px",cursor:"pointer",fontWeight:600,fontSize:12}}>Logout</button>
                </>
              ):(
                <>
                  <Link to="/login" style={{color:"#fff",textDecoration:"none",fontWeight:600,fontSize:13,padding:"6px 14px",border:"1px solid rgba(255,255,255,.4)",borderRadius:8}}>Login</Link>
                  <Link to="/register" style={{background:"#fff",color:"#1d4ed8",textDecoration:"none",fontWeight:700,fontSize:13,padding:"6px 14px",borderRadius:8}}>Register</Link>
                </>
              )}
              {user&&<button className="d-xl-none" onClick={()=>setMenuOpen(!menuOpen)} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,color:"#fff",padding:"5px 10px",cursor:"pointer",fontSize:18}}>☰</button>}
            </div>
          </div>
          {menuOpen&&user&&(
            <div style={{background:"rgba(29,78,216,.95)",padding:"10px 0",borderTop:"1px solid rgba(255,255,255,.2)"}}>
              {navLinks.map(l=><Link key={l.to} to={l.to} onClick={()=>setMenuOpen(false)} style={{display:"block",color:"rgba(255,255,255,.9)",textDecoration:"none",fontSize:14,fontWeight:600,padding:"8px 16px"}}>{l.l}</Link>)}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

function Protected({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" />;
  return children;
}

// ─── HOME ─────────────────────────────────────────────────────
function Home() {
  const { user } = useAuth();
  return (
    <div style={{padding:"28px 0"}}>
      <div className="hg" style={{padding:"52px 44px",marginBottom:28}}>
        <div className="row align-items-center">
          <div className="col-md-7">
            <div style={{fontSize:12,background:"rgba(255,255,255,.2)",display:"inline-block",padding:"4px 14px",borderRadius:20,marginBottom:18,fontWeight:700}}>🎓 ALUMNI NETWORK PORTAL v4.0</div>
            <h1 style={{fontWeight:800,fontSize:40,lineHeight:1.15,marginBottom:18}}>Connect. Grow.<br/>Give Back.</h1>
            <p style={{opacity:.85,fontSize:16,marginBottom:30,lineHeight:1.6}}>Your complete alumni ecosystem — events, mentorship, forum, gallery, success stories, and more.</p>
            {user?<Link to="/dashboard" style={{background:"#fff",color:"#1d4ed8",textDecoration:"none",fontWeight:700,fontSize:15,padding:"12px 36px",borderRadius:12,display:"inline-block"}}>Go to Dashboard →</Link>
                 :<div style={{display:"flex",gap:12,flexWrap:"wrap"}}><Link to="/register" style={{background:"#fff",color:"#1d4ed8",textDecoration:"none",fontWeight:700,fontSize:15,padding:"12px 32px",borderRadius:12,display:"inline-block"}}>Get Started</Link><Link to="/login" style={{border:"2px solid rgba(255,255,255,.6)",color:"#fff",textDecoration:"none",fontWeight:700,fontSize:15,padding:"12px 32px",borderRadius:12,display:"inline-block"}}>Sign In</Link><Link to="/contact" style={{border:"2px solid rgba(255,255,255,.4)",color:"rgba(255,255,255,.85)",textDecoration:"none",fontWeight:600,fontSize:15,padding:"12px 32px",borderRadius:12,display:"inline-block"}}>Contact Us</Link></div>}
          </div>
          <div className="col-md-5 d-none d-md-block text-center" style={{fontSize:100}}>🎓</div>
        </div>
      </div>
      <div className="row g-3">
        {[["🔍","Alumni Directory","Search alumni, view social links"],["💬","Community Forum","Post, comment, like — discussions"],["📅","Events & Reunions","Browse events, RSVP instantly"],["🤝","Mentorship","Connect students with alumni mentors"],["🖼️","Media Gallery","Photos from alumni events"],["💰","Contributions","Donate to scholarships"],["🏆","Success Stories","Inspiring alumni journeys"],["📋","Opportunities","Jobs, internships, research"]].map(([i,t,d])=>(
          <div className="col-6 col-md-3" key={t}><div className="cg h-100 ac text-center" style={{padding:"20px 14px"}}><div style={{fontSize:28,marginBottom:8}}>{i}</div><div style={{fontWeight:700,marginBottom:5,fontSize:13}}>{t}</div><div style={{color:"var(--mut)",fontSize:12,lineHeight:1.5}}>{d}</div></div></div>
        ))}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────
function Login() {
  const {login}=useAuth();const {addToast}=useToast();const navigate=useNavigate();
  const [form,setForm]=useState({email:"",password:""});const [errs,setErrs]=useState({});const [showPw,setShowPw]=useState(false);const [ld,setLd]=useState(false);
  const submit=async e=>{
    e.preventDefault();const v={};
    if(!form.email.includes("@"))v.email="Valid email required";if(!form.password)v.password="Required";
    if(Object.keys(v).length){setErrs(v);return;}setLd(true);
    try{const d=await api("/auth/login","POST",form);login(d.user,d.token);addToast(`Welcome back, ${d.user.name}! 👋`,"success");navigate(d.user.role==="admin"?"/admin":"/dashboard");}
    catch(err){setErrs({global:err.message});}finally{setLd(false);}
  };
  return (
    <div style={{padding:"28px 0",display:"flex",justifyContent:"center",alignItems:"center",minHeight:"70vh"}}>
      <div style={{width:"100%",maxWidth:440}}><div className="cg">
        <div style={{textAlign:"center",marginBottom:28}}><div style={{fontSize:44}}>🔑</div><h4 style={{fontWeight:800,marginTop:10,marginBottom:4}}>Welcome back</h4><p style={{color:"var(--mut)",fontSize:14}}>Sign in to your account</p></div>
        {errs.global&&<div style={{background:"#fef2f2",color:"#dc2626",padding:"10px 14px",borderRadius:10,marginBottom:16,fontSize:13}}>⚠ {errs.global}</div>}
        <form onSubmit={submit}>
          <div style={{marginBottom:16}}><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:6}}>Email</label><input className={`ff${errs.email?" err":""}`} type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@email.com"/><FErr msg={errs.email}/></div>
          <div style={{marginBottom:24}}><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:6}}>Password</label><div style={{position:"relative"}}><input className={`ff${errs.password?" err":""}`} type={showPw?"text":"password"} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••"/><button type="button" onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16}}>{showPw?"🙈":"👁️"}</button></div><FErr msg={errs.password}/></div>
          <button type="submit" className="bp" style={{width:"100%",padding:11}} disabled={ld}>{ld?"Signing in...":"Sign In"}</button>
        </form>
        <p style={{textAlign:"center",color:"var(--mut)",fontSize:13,marginTop:16}}>No account? <Link to="/register" style={{color:"var(--pri)",fontWeight:700,textDecoration:"none"}}>Register</Link></p>
        <div style={{marginTop:16,background:"var(--sur2)",borderRadius:10,padding:"12px 14px",fontSize:12,color:"var(--mut)"}}><strong style={{color:"var(--txt)"}}> </strong>  </div>
      </div></div>
    </div>
  );
}

// ─── REGISTER ─────────────────────────────────────────────────
function Register() {
  const {addToast}=useToast();const navigate=useNavigate();
  const [form,setForm]=useState({name:"",email:"",password:"",role:"alumni",batch_year:"",company:"",designation:"",location:"",skills:"",department:"",current_year:"1",linkedin:"",twitter:"",facebook:"",instagram:""});
  const [errs,setErrs]=useState({});const [showPw,setShowPw]=useState(false);const [ld,setLd]=useState(false);
  const h=e=>setForm({...form,[e.target.name]:e.target.value});
  const submit=async e=>{
    e.preventDefault();const v={};
    if (!form.name?.trim()) {
      v.name = "Name is required";
    } else if (!/^[a-zA-Z\s]+$/.test(form.name.trim())) {
      v.name = "Use alphabets only — no numbers or special characters";
    }
    if(!form.email.includes("@"))v.email="Valid email required";if(form.password.length<6)v.password="Min 6 chars";
    if(form.role==="alumni"&&!form.batch_year)v.batch_year="Required";
    if(form.role==="alumni"&&form.batch_year) {
      const currentYear = new Date().getFullYear();
      const batchYear = parseInt(form.batch_year);
      if (isNaN(batchYear) || batchYear > currentYear) {
        v.batch_year = `Batch year cannot be in the future (max: ${currentYear})`;
      }
    }
    if(Object.keys(v).length){setErrs(v);return;}setLd(true);
    try{await api("/auth/register","POST",form);addToast("Registered! Awaiting approval 🎉","success");setTimeout(()=>navigate("/login"),1500);}
    catch(err){setErrs({global:err.message});}finally{setLd(false);}
  };
  const F=(label,name,type="text",ph="",req=false)=>(<div style={{marginBottom:12}}><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>{label}{req?" *":""}</label><input className={`ff${errs[name]?" err":""}`} type={type} name={name} placeholder={ph} value={form[name]} onChange={h}/><FErr msg={errs[name]}/></div>);
  return (
    <div style={{padding:"28px 0",display:"flex",justifyContent:"center"}}><div style={{width:"100%",maxWidth:580}}><div className="cg">
      <div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:44}}>✍️</div><h4 style={{fontWeight:800,marginTop:10,marginBottom:4}}>Create Account</h4></div>
      {errs.global&&<div style={{background:"#fef2f2",color:"#dc2626",padding:"10px 14px",borderRadius:10,marginBottom:16,fontSize:13}}>⚠ {errs.global}</div>}
      <form onSubmit={submit}>
        {F("Full Name","name","text","Rahul Sharma",true)}
        <div className="row g-2">
          <div className="col-md-6">{F("Email","email","email","rahul@email.com",true)}</div>
          <div className="col-md-6"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Password *</label><div style={{position:"relative"}}><input className={`ff${errs.password?" err":""}`} type={showPw?"text":"password"} name="password" placeholder="Min 6 chars" value={form.password} onChange={h}/><button type="button" onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer"}}>{showPw?"🙈":"👁️"}</button></div><FErr msg={errs.password}/></div>
        </div>
        <div style={{marginBottom:14}}><label style={{fontWeight:600,fontSize:13,display:"block",marginBottom:8}}>I am a...</label><div style={{display:"flex",gap:20}}>{["alumni","student"].map(r=><label key={r} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontWeight:600,textTransform:"capitalize"}}><input type="radio" name="role" value={r} checked={form.role===r} onChange={h}/>{r}</label>)}</div></div>
        {form.role==="alumni"&&<>
          <div className="row g-2"><div className="col-md-4">{F("Batch Year","batch_year","number","2021",true)}</div><div className="col-md-4">{F("Company","company","text","Infosys")}</div><div className="col-md-4">{F("Designation","designation","text","SDE")}</div><div className="col-md-6">{F("Location","location","text","Bengaluru")}</div><div className="col-md-6">{F("Skills","skills","text","React, Python")}</div></div>
          <div style={{marginTop:4,marginBottom:8,fontWeight:600,fontSize:13,color:"var(--mut)"}}>Social Media Links (optional)</div>
          <div className="row g-2">
            <div className="col-md-6"><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#0a66c2"}}>in LinkedIn</label><input className="ff" name="linkedin" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={h}/></div>
            <div className="col-md-6"><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#1da1f2"}}>𝕏 Twitter/X</label><input className="ff" name="twitter" placeholder="https://twitter.com/..." value={form.twitter} onChange={h}/></div>
            <div className="col-md-6"><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#1877f2"}}>f Facebook</label><input className="ff" name="facebook" placeholder="https://facebook.com/..." value={form.facebook} onChange={h}/></div>
            <div className="col-md-6"><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#e1306c"}}>📸 Instagram</label><input className="ff" name="instagram" placeholder="https://instagram.com/..." value={form.instagram} onChange={h}/></div>
          </div>
        </>}
        {form.role==="student"&&<div className="row g-2"><div className="col-md-6">{F("Department","department","text","Computer Science")}</div><div className="col-md-6"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Current Year</label><select className="ff" name="current_year" value={form.current_year} onChange={h}>{[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}</select></div></div>}
        <button type="submit" className="bp" style={{width:"100%",padding:11,marginTop:12}} disabled={ld}>{ld?"Creating...":"Create Account"}</button>
      </form>
      <p style={{textAlign:"center",color:"var(--mut)",fontSize:13,marginTop:14}}>Already registered? <Link to="/login" style={{color:"var(--pri)",fontWeight:700,textDecoration:"none"}}>Sign in</Link></p>
    </div></div></div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────
function Dashboard() {
  const {user,token}=useAuth();
  const [stats,setStats]=useState(null);const [acts,setActs]=useState([]);const [jobs,setJobs]=useState([]);const [ld,setLd]=useState(true);
  const actC={registration:"#1d4ed8",approval:"#16a34a",job:"#d97706",message:"#7c3aed",event:"#059669",story:"#dc2626",forum:"#0891b2",mentorship:"#9333ea",opportunity:"#d97706",contribution:"#16a34a"};
  useEffect(()=>{
    if(!token)return;
    Promise.all([user.role==="admin"?api("/admin/stats","GET",null,token):Promise.resolve(null),api("/activities","GET",null,token),api("/jobs","GET",null,token)])
      .then(([s,a,j])=>{if(s)setStats(s);setActs(a.activities);setJobs(j.jobs.slice(0,3));}).catch(console.error).finally(()=>setLd(false));
  },[token]);
  if(ld)return <div style={{padding:"28px 0"}}><div className="row g-3">{[1,2,3,4].map(i=><div className="col-md-3" key={i}><Skel/></div>)}</div></div>;
  return (
    <div style={{padding:"28px 0"}}>
      <div className="hg" style={{padding:"28px 32px",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <Avatar name={user.name} id={user.id} size={56}/>
          <div><h4 style={{fontWeight:800,marginBottom:2,color:"#fff"}}>Welcome, {user.name}! 👋</h4><p style={{opacity:.8,fontSize:14,color:"#fff",margin:0}}>{user.role==="alumni"?`Batch ${user.batch_year||""} · ${user.company||"Alumni"}`:user.role==="admin"?"Administrator":"Student"}</p></div>
        </div>
      </div>
      {stats&&<div className="row g-3 mb-4">{[["🎓","Alumni",stats.total_alumni,"#1d4ed8"],["📅","Events",stats.total_events,"#059669"],["💬","Forum",stats.total_forum_posts,"#7c3aed"],["🤝","Mentors",stats.total_mentors,"#d97706"],["🏆","Stories",stats.total_stories,"#dc2626"],["💰",`₹${stats.total_contributions}`,stats.total_contributions>=0?"Contributions":"Contributions","#16a34a"],["📋","Opps",stats.total_opportunities,"#0891b2"],["⏳","Pending",stats.pending,"#854F0B"]].map(([ic,l,v,c],idx)=>{const label=typeof v==="string"&&v.startsWith("₹")?v:l;const val=typeof v==="string"&&v.startsWith("₹")?v:stats[[["total_alumni","total_events","total_forum_posts","total_mentors","total_stories","total_contributions","total_opportunities","pending"][idx]]];return <div className="col-6 col-md-3" key={idx}><div className="cg" style={{borderLeft:`4px solid ${c}`}}><div style={{fontSize:22}}>{ic}</div><div style={{fontSize:22,fontWeight:800,color:c,margin:"4px 0"}}>{val}</div><div style={{color:"var(--mut)",fontSize:13}}>{["Alumni","Events","Forum Posts","Mentors","Stories","Contributions","Opportunities","Pending"][idx]}</div></div></div>;})}
      </div>}
      <div className="row g-4">
        {stats?.batch_years?.length>0&&<div className="col-md-7"><div className="cg"><div style={{fontWeight:700,marginBottom:14,fontSize:15}}>📊 Alumni by Batch Year</div><Bar data={{labels:stats.batch_years,datasets:[{label:"Alumni",data:stats.batch_counts,backgroundColor:"#1d4ed8",borderRadius:6}]}} options={{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}}/></div></div>}
        <div className="col-md-5"><div className="cg" style={{maxHeight:360,overflow:"hidden"}}><div style={{fontWeight:700,marginBottom:14,fontSize:15}}>⚡ Live Activity Feed</div><div style={{display:"flex",flexDirection:"column",gap:10,overflowY:"auto",maxHeight:290}}>{acts.length===0?<div style={{color:"var(--mut)",fontSize:13,textAlign:"center",padding:"20px 0"}}>No activity yet</div>:acts.map(a=><div key={a.id} style={{display:"flex",gap:10,alignItems:"flex-start"}}><div style={{width:8,height:8,borderRadius:"50%",background:actC[a.category]||"#888",flexShrink:0,marginTop:6}}/><div style={{flex:1}}><div style={{fontSize:13}}>{a.action}</div><div style={{fontSize:11,color:"var(--mut)"}}>{a.ago}</div></div></div>)}</div></div></div>
        <div className="col-12"><div className="row g-3">{[{to:"/alumni",i:"🔍",t:"Alumni Directory"},{to:"/forum",i:"💬",t:"Community Forum"},{to:"/events",i:"📅",t:"Events"},{to:"/mentorship",i:"🤝",t:"Mentorship"},{to:"/gallery",i:"🖼️",t:"Gallery"},{to:"/stories",i:"🏆",t:"Success Stories"},{to:"/opportunities",i:"📋",t:"Opportunities"},{to:"/contributions",i:"💰",t:"Contribute"}].map(l=><div className="col-6 col-md-3" key={l.to}><div className="cg h-100 ac" style={{padding:"16px"}}><div style={{fontSize:24,marginBottom:6}}>{l.i}</div><div style={{fontWeight:700,fontSize:13,marginBottom:8}}>{l.t}</div><Link to={l.to} className="bo" style={{fontSize:12,padding:"5px 12px",display:"inline-block",textDecoration:"none"}}>Open →</Link></div></div>)}</div></div>
        {jobs.length>0&&<div className="col-12"><div style={{fontWeight:700,marginBottom:12,fontSize:15}}>Recent Jobs</div><div className="row g-3">{jobs.map(j=><div className="col-md-4" key={j.id}><div className="cg" style={{borderLeft:"4px solid #1d4ed8"}}><div style={{fontWeight:700,fontSize:14}}>{j.title}</div><div style={{color:"var(--mut)",fontSize:13}}>{j.company} · {j.location||"Remote"}</div><span style={{background:"#eff6ff",color:"#1d4ed8",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,marginTop:8,display:"inline-block"}}>{j.job_type}</span></div></div>)}</div></div>}
      </div>
    </div>
  );
}

// ─── ALUMNI DIRECTORY ─────────────────────────────────────────
function AlumniDirectory() {
  const {user,token}=useAuth();
  const [alumni,setAlumni]=useState([]);const [bys,setBys]=useState([]);const [locs,setLocs]=useState([]);
  const [ld,setLd]=useState(true);const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");const [dSearch,setDS]=useState("");
  const [batch,setBatch]=useState("");const [loc,setLoc]=useState("");const [skill,setSkill]=useState("");
  useEffect(()=>{const t=setTimeout(()=>setDS(search),400);return()=>clearTimeout(t);},[search]);
  useEffect(()=>{
    setPage(1);setLd(true);
    const p=new URLSearchParams();
    if(dSearch)p.set("search",dSearch);if(batch)p.set("batch_year",batch);if(loc)p.set("location",loc);if(skill)p.set("skill",skill);
    api(`/alumni?${p}`,"GET",null,token).then(d=>{setAlumni(d.alumni);if(d.batch_years)setBys(d.batch_years);if(d.locations)setLocs(d.locations);}).catch(console.error).finally(()=>setLd(false));
  },[dSearch,batch,loc,skill,token]);
  const paged=alumni.slice((page-1)*PG,page*PG);
  const clear=()=>{setSearch("");setBatch("");setLoc("");setSkill("");};
  return (
    <div style={{padding:"28px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20}}>
        <div><h4 style={{fontSize:22,fontWeight:800,marginBottom:2}}>Alumni Directory</h4><p style={{color:"var(--mut)",fontSize:14,margin:0}}>{alumni.length} alumni</p></div>
      </div>
      <div className="cg mb-4"><div className="row g-2">
        <div className="col-md-4"><input className="ff" placeholder="🔍 Search by name..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="col-md-2"><select className="ff" value={batch} onChange={e=>setBatch(e.target.value)}><option value="">All Batches</option>{bys.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
        <div className="col-md-2"><select className="ff" value={loc} onChange={e=>setLoc(e.target.value)}><option value="">All Locations</option>{locs.map(l=><option key={l} value={l}>{l}</option>)}</select></div>
        <div className="col-md-3"><input className="ff" placeholder="Filter by skill..." value={skill} onChange={e=>setSkill(e.target.value)}/></div>
        <div className="col-md-1">{(search||batch||loc||skill)&&<button onClick={clear} style={{width:"100%",height:42,background:"var(--sur2)",border:"1.5px solid var(--brd)",borderRadius:10,cursor:"pointer",fontWeight:700}}>✕</button>}</div>
      </div></div>
      {ld?<div className="row g-3">{[1,2,3,4,5,6].map(i=><div className="col-md-4 col-lg-3" key={i}><Skel/></div>)}</div>
         :paged.length===0?<div style={{textAlign:"center",padding:"48px 0",color:"var(--mut)"}}><div style={{fontSize:52}}>🔍</div><p style={{marginTop:12}}>No alumni found</p></div>
         :<><div className="row g-3">{paged.map(a=>(
            <div className="col-md-4 col-lg-3" key={a.id}>
              <div className="cg ac h-100">
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><Avatar name={a.name} id={a.user_id} size={46}/><div><div style={{fontWeight:700,fontSize:14}}>{a.name}</div><div style={{color:"var(--mut)",fontSize:12}}>Batch {a.batch_year}</div></div></div>
                {a.designation&&<div style={{fontSize:12,color:"var(--mut)",marginBottom:2}}>💼 {a.designation}</div>}
                {a.company&&<div style={{fontSize:12,color:"var(--mut)",marginBottom:2}}>🏢 {a.company}</div>}
                {a.location&&<div style={{fontSize:12,color:"var(--mut)",marginBottom:8}}>📍 {a.location}</div>}
                <div style={{marginBottom:8}}>{(a.skills||[]).slice(0,3).map(s=><span key={s} className="sk-pill">{s}</span>)}</div>
                <SocialLinks alumni={a}/>
                <MsgBtn toId={a.user_id} toName={a.name}/>
              </div>
            </div>
          ))}</div><Pager total={alumni.length} page={page} setPage={setPage}/></>}
    </div>
  );
}

function MsgBtn({toId,toName}) {
  const {user,token}=useAuth();const {addToast}=useToast();
  const [open,setOpen]=useState(false);const [form,setForm]=useState({subject:"",body:""});const [ld,setLd]=useState(false);
  if(!user||user.id===toId)return null;
  const send=async e=>{e.preventDefault();if(!form.body.trim())return;setLd(true);try{await api("/messages","POST",{from_id:user.id,to_id:toId,...form},token);addToast(`Message sent! ✉️`,"success");setOpen(false);setForm({subject:"",body:""});}catch(err){addToast(err.message,"danger");}finally{setLd(false);}};
  return(<div style={{marginTop:10}}><button onClick={()=>setOpen(!open)} className="bo" style={{fontSize:12,padding:"6px 14px"}}>✉️ {open?"Cancel":"Message"}</button>{open&&<form onSubmit={send} style={{marginTop:8}}><input className="ff" placeholder="Subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} style={{marginBottom:6}}/><textarea className="ff" placeholder="Message..." value={form.body} onChange={e=>setForm({...form,body:e.target.value})} rows={3} style={{marginBottom:6}} required/><button type="submit" className="bp" style={{fontSize:12,padding:"7px 16px"}} disabled={ld}>{ld?"Sending...":"Send"}</button></form>}</div>);
}

// ─── EVENTS ───────────────────────────────────────────────────
function Events() {
  const {user,token}=useAuth();const {addToast}=useToast();
  const [events,setEvents]=useState([]);const [ld,setLd]=useState(true);const [filter,setFilter]=useState("");const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({title:"",description:"",date:"",time:"",location:"",event_type:"General",image_url:""});
  const fetchEvents=()=>{setLd(true);api("/events","GET",null,token).then(d=>setEvents(d.events)).catch(console.error).finally(()=>setLd(false));};
  useEffect(()=>{if(token)fetchEvents();},[token]);
  const filtered=filter?events.filter(e=>e.event_type===filter):events;
  const rsvp=async id=>{try{const d=await api(`/events/${id}/rsvp`,"POST",null,token);addToast(d.rsvped?"RSVP confirmed! 🎉":"RSVP cancelled","info");fetchEvents();}catch(err){addToast(err.message,"danger");}};
  const create=async e=>{e.preventDefault();try{await api("/events","POST",form,token);addToast("Event created!","success");setShowForm(false);setForm({title:"",description:"",date:"",time:"",location:"",event_type:"General",image_url:""});fetchEvents();}catch(err){addToast(err.message,"danger");}};
  const del=async id=>{if(!window.confirm("Delete?"))return;await api(`/events/${id}`,"DELETE",null,token);fetchEvents();addToast("Deleted","info");};
  const typeC={"General":["#eff6ff","#1d4ed8"],"Reunion":["#f0fdf4","#16a34a"],"Seminar":["#fef3c7","#d97706"],"Workshop":["#fdf4ff","#9333ea"]};
  return (
    <div style={{padding:"28px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h4 style={{fontSize:22,fontWeight:800,marginBottom:2}}>Events & Reunions</h4><p style={{color:"var(--mut)",fontSize:14,margin:0}}>{filtered.length} events</p></div>
        {user.role==="admin"&&<button className="bp" onClick={()=>setShowForm(!showForm)}>{showForm?"✕ Cancel":"+ New Event"}</button>}
      </div>
      {showForm&&<div className="cg mb-4" style={{borderLeft:"4px solid #059669"}}><div style={{fontWeight:700,marginBottom:16}}>Create New Event</div>
        <form onSubmit={create}><div className="row g-2">
          <div className="col-md-8"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Title *</label><input className="ff" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Type</label><select className="ff" value={form.event_type} onChange={e=>setForm({...form,event_type:e.target.value})}><option>General</option><option>Reunion</option><option>Seminar</option><option>Workshop</option></select></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Date *</label><input type="date" className="ff" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Time</label><input type="time" className="ff" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Location</label><input className="ff" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></div>
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Description</label><textarea className="ff" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Image URL (optional)</label><input className="ff" placeholder="https://..." value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})}/></div>
        </div><button type="submit" className="bp" style={{marginTop:12}}>Create Event</button></form>
      </div>}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>{["","General","Reunion","Seminar","Workshop"].map(t=><button key={t} className={`fp${filter===t?" on":""}`} onClick={()=>setFilter(t)}>{t||"All Types"}</button>)}</div>
      {ld?<div className="row g-3">{[1,2,3].map(i=><div className="col-md-4" key={i}><Skel/></div>)}</div>
         :filtered.length===0?<div style={{textAlign:"center",padding:"48px 0",color:"var(--mut)"}}><div style={{fontSize:52}}>📅</div><p style={{marginTop:12}}>No events yet</p></div>
         :<div className="row g-3">{filtered.map(ev=>{const [bg,tc]=typeC[ev.event_type]||typeC.General;return(
            <div className="col-md-4" key={ev.id}><div className="cg ac h-100">
              {ev.image_url&&<img src={ev.image_url} alt={ev.title} style={{width:"100%",height:140,objectFit:"cover",borderRadius:10,marginBottom:12}} onError={e=>e.target.style.display="none"}/>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <span style={{background:bg,color:tc,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:8}}>{ev.event_type}</span>
                {user.role==="admin"&&<button onClick={()=>del(ev.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:16}}>✕</button>}
              </div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{ev.title}</div>
              <div style={{color:"var(--mut)",fontSize:13,marginBottom:4}}>📅 {ev.date} {ev.time&&`at ${ev.time}`}</div>
              {ev.location&&<div style={{color:"var(--mut)",fontSize:13,marginBottom:8}}>📍 {ev.location}</div>}
              <p style={{color:"var(--mut)",fontSize:13,lineHeight:1.5,marginBottom:12}}>{ev.description?.slice(0,100)}{ev.description?.length>100?"...":""}</p>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,color:"var(--mut)"}}>👥 {ev.rsvp_count} RSVP'd</span>
                <button onClick={()=>rsvp(ev.id)} className={ev.is_rsvped?"bp":"bo"} style={{fontSize:12,padding:"6px 14px"}}>{ev.is_rsvped?"✓ RSVP'd":"RSVP"}</button>
              </div>
            </div></div>
          );})}</div>}
    </div>
  );
}

// ─── FORUM ────────────────────────────────────────────────────
function Forum() {
  const {user,token}=useAuth();const {addToast}=useToast();
  const [posts,setPosts]=useState([]);const [ld,setLd]=useState(true);const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({title:"",body:"",category:"General",tags:""});const [selPost,setSelPost]=useState(null);const [comments,setComments]=useState([]);const [commentText,setCommentText]=useState("");const [catFilter,setCatFilter]=useState("");
  const fetchPosts=()=>{setLd(true);const p=new URLSearchParams();if(catFilter)p.set("category",catFilter);api(`/forum?${p}`,"GET",null,token).then(d=>setPosts(d.posts)).catch(console.error).finally(()=>setLd(false));};
  useEffect(()=>{if(token)fetchPosts();},[token,catFilter]);
  const openPost=async post=>{setSelPost(post);const d=await api(`/forum/${post.id}/comments`,"GET",null,token);setComments(d.comments);};
  const createPost=async e=>{e.preventDefault();try{await api("/forum","POST",{...form,tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean)},token);addToast("Post created!","success");setShowForm(false);setForm({title:"",body:"",category:"General",tags:""});fetchPosts();}catch(err){addToast(err.message,"danger");}};
  const likePost=async id=>{try{await api(`/forum/${id}/like`,"POST",null,token);fetchPosts();}catch{}};
  const delPost=async id=>{await api(`/forum/${id}`,"DELETE",null,token);setPosts(posts.filter(p=>p.id!==id));if(selPost?.id===id)setSelPost(null);addToast("Post removed","info");};
  const addComment=async e=>{e.preventDefault();if(!commentText.trim())return;try{await api(`/forum/${selPost.id}/comments`,"POST",{body:commentText},token);setCommentText("");const d=await api(`/forum/${selPost.id}/comments`,"GET",null,token);setComments(d.comments);addToast("Comment added!","success");}catch(err){addToast(err.message,"danger");}};
  const cats=["General","Career","Technology","Events","Alumni Life","Q&A"];
  return (
    <div style={{padding:"28px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h4 style={{fontSize:22,fontWeight:800,marginBottom:2}}>Community Forum</h4><p style={{color:"var(--mut)",fontSize:14,margin:0}}>{posts.length} discussions</p></div>
        <button className="bp" onClick={()=>setShowForm(!showForm)}>{showForm?"✕ Cancel":"+ New Post"}</button>
      </div>
      {showForm&&<div className="cg mb-4" style={{borderLeft:"4px solid #7c3aed"}}><div style={{fontWeight:700,marginBottom:16}}>Start a Discussion</div>
        <form onSubmit={createPost}><div className="row g-2">
          <div className="col-md-8"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Title *</label><input className="ff" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Category</label><select className="ff" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Body *</label><textarea className="ff" rows={4} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} required/></div>
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Tags (comma separated)</label><input className="ff" placeholder="career, tips" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/></div>
        </div><button type="submit" className="bp" style={{marginTop:12}}>Post</button></form>
      </div>}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>{[""].concat(cats).map(c=><button key={c} className={`fp${catFilter===c?" on":""}`} onClick={()=>setCatFilter(c)}>{c||"All"}</button>)}</div>
      <div className="row g-3">
        <div className={selPost?"col-md-5":"col-12"}>
          {ld?<div>{[1,2,3].map(i=><div key={i} style={{marginBottom:10}}><Skel h={100}/></div>)}</div>
             :posts.length===0?<div style={{textAlign:"center",padding:"48px 0",color:"var(--mut)"}}><div style={{fontSize:52}}>💬</div><p style={{marginTop:12}}>No posts yet. Start a discussion!</p></div>
             :<div style={{display:"flex",flexDirection:"column",gap:8}}>{posts.map(p=>(
              <div key={p.id} onClick={()=>openPost(p)} className="cg ac" style={{cursor:"pointer",borderLeft:selPost?.id===p.id?"4px solid #1d4ed8":"4px solid transparent",transition:"all .15s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{flex:1}}>{p.is_pinned&&<span style={{background:"#fef3c7",color:"#d97706",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:4,marginRight:6}}>📌 PINNED</span>}<span style={{fontWeight:700,fontSize:14}}>{p.title}</span></div>
                  <span style={{background:"#eff6ff",color:"#1d4ed8",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,flexShrink:0,marginLeft:8}}>{p.category}</span>
                </div>
                <div style={{color:"var(--mut)",fontSize:12,marginBottom:8}}>By {p.author_name} ({p.author_role}) · {p.ago}</div>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <button onClick={e=>{e.stopPropagation();likePost(p.id);}} style={{background:"none",border:"none",cursor:"pointer",color:p.is_liked?"#dc2626":"var(--mut)",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>{p.is_liked?"❤️":"🤍"} {p.like_count}</button>
                  <span style={{color:"var(--mut)",fontSize:13}}>💬 {p.comment_count}</span>
                  {(p.user_id===user.id||user.role==="admin")&&<button onClick={e=>{e.stopPropagation();delPost(p.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:12,marginLeft:"auto"}}>✕ Remove</button>}
                </div>
                {p.tags?.length>0&&<div style={{marginTop:6}}>{p.tags.map(t=><span key={t} style={{background:"var(--sur2)",color:"var(--mut)",fontSize:11,padding:"2px 7px",borderRadius:6,margin:2,display:"inline-block"}}>#{t}</span>)}</div>}
              </div>
            ))}</div>}
        </div>
        {selPost&&<div className="col-md-7"><div className="cg" style={{position:"sticky",top:80}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div style={{fontWeight:700,fontSize:16}}>{selPost.title}</div><button onClick={()=>setSelPost(null)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"var(--mut)"}}>✕</button></div>
          <div style={{color:"var(--mut)",fontSize:13,marginBottom:12}}>By {selPost.author_name} · {selPost.ago}</div>
          <div style={{fontSize:14,lineHeight:1.7,color:"var(--txt)",marginBottom:16,padding:"12px",background:"var(--sur2)",borderRadius:10}}>{selPost.body}</div>
          <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>💬 Comments ({comments.length})</div>
          <div style={{maxHeight:220,overflowY:"auto",marginBottom:12,display:"flex",flexDirection:"column",gap:8}}>
            {comments.map(c=><div key={c.id} style={{background:"var(--sur2)",borderRadius:8,padding:"10px 12px"}}><div style={{fontWeight:600,fontSize:13}}>{c.author_name} <span style={{color:"var(--mut)",fontWeight:400,fontSize:12}}>· {c.ago}</span></div><div style={{fontSize:13,marginTop:4}}>{c.body}</div></div>)}
          </div>
          <form onSubmit={addComment} style={{display:"flex",gap:8}}><input className="ff" placeholder="Write a comment..." value={commentText} onChange={e=>setCommentText(e.target.value)} style={{flex:1}}/><button type="submit" className="bp" style={{padding:"8px 16px",fontSize:13}}>Post</button></form>
        </div></div>}
      </div>
    </div>
  );
}

// ─── MENTORSHIP ───────────────────────────────────────────────
function Mentorship() {
  const {user,token}=useAuth();const {addToast}=useToast();
  const [mentors,setMentors]=useState([]);const [ld,setLd]=useState(true);const [showReg,setShowReg]=useState(false);
  const [regForm,setRegForm]=useState({domains:"",bio:"",availability:""});const [reqMsg,setReqMsg]=useState({});const [openReq,setOpenReq]=useState(null);
  useEffect(()=>{if(token)api("/mentorship","GET",null,token).then(d=>setMentors(d.mentors)).catch(console.error).finally(()=>setLd(false));},[token]);
  const registerMentor=async e=>{e.preventDefault();try{await api("/mentorship/register","POST",{...regForm,domains:regForm.domains.split(",").map(d=>d.trim()).filter(Boolean)},token);addToast("Registered as mentor! 🤝","success");setShowReg(false);}catch(err){addToast(err.message,"danger");}};
  const sendReq=async mentorId=>{try{await api(`/mentorship/${mentorId}/request`,"POST",{message:reqMsg[mentorId]||"I would love to connect for mentorship guidance."},token);addToast("Mentorship request sent! 🎓","success");setOpenReq(null);}catch(err){addToast(err.message,"danger");}};
  return (
    <div style={{padding:"28px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h4 style={{fontSize:22,fontWeight:800,marginBottom:2}}>Mentorship Program</h4><p style={{color:"var(--mut)",fontSize:14,margin:0}}>{mentors.length} mentors available</p></div>
        {user.role==="alumni"&&<button className="bo" onClick={()=>setShowReg(!showReg)}>{showReg?"✕ Cancel":"🤝 Become a Mentor"}</button>}
      </div>
      {showReg&&<div className="cg mb-4" style={{borderLeft:"4px solid #9333ea"}}><div style={{fontWeight:700,marginBottom:16}}>Register as Mentor</div>
        <form onSubmit={registerMentor}><div className="row g-2">
          <div className="col-md-6"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Domains (comma separated)</label><input className="ff" placeholder="Web Dev, Data Science" value={regForm.domains} onChange={e=>setRegForm({...regForm,domains:e.target.value})}/></div>
          <div className="col-md-6"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Availability</label><input className="ff" placeholder="Weekends, 2hr/week" value={regForm.availability} onChange={e=>setRegForm({...regForm,availability:e.target.value})}/></div>
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Why you want to mentor</label><textarea className="ff" rows={3} value={regForm.bio} onChange={e=>setRegForm({...regForm,bio:e.target.value})}/></div>
        </div><button type="submit" className="bp" style={{marginTop:12}}>Register</button></form>
      </div>}
      {ld?<div className="row g-3">{[1,2,3].map(i=><div className="col-md-4" key={i}><Skel/></div>)}</div>
         :mentors.length===0?<div style={{textAlign:"center",padding:"48px 0",color:"var(--mut)"}}><div style={{fontSize:52}}>🤝</div><p style={{marginTop:12}}>No mentors yet. Alumni can register above.</p></div>
         :<div className="row g-3">{mentors.map(m=>(
          <div className="col-md-4" key={m.id}><div className="cg ac h-100">
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><Avatar name={m.mentor_name} id={m.mentor_id} size={46}/><div><div style={{fontWeight:700,fontSize:14}}>{m.mentor_name}</div><div style={{color:"var(--mut)",fontSize:12}}>{m.designation} at {m.company}</div></div></div>
            <div style={{marginBottom:8}}>{(m.domains||[]).map(d=><span key={d} className="sk-pill">{d}</span>)}</div>
            {m.bio&&<p style={{color:"var(--mut)",fontSize:13,lineHeight:1.5,marginBottom:10}}>{m.bio}</p>}
            {m.availability&&<div style={{color:"var(--mut)",fontSize:12,marginBottom:10}}>🕐 {m.availability}</div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"var(--mut)"}}>👋 {m.requests} requests</span>
              {user.role==="student"&&(openReq===m.id?
                <div style={{width:"100%",marginTop:8}}><textarea className="ff" rows={2} placeholder="Your message..." value={reqMsg[m.id]||""} onChange={e=>setReqMsg({...reqMsg,[m.id]:e.target.value})} style={{marginBottom:6}}/><div style={{display:"flex",gap:6}}><button onClick={()=>sendReq(m.id)} className="bp" style={{fontSize:12,padding:"6px 14px"}}>Send</button><button onClick={()=>setOpenReq(null)} className="bo" style={{fontSize:12,padding:"6px 14px"}}>Cancel</button></div></div>
                :<button onClick={()=>setOpenReq(m.id)} className="bp" style={{fontSize:12,padding:"6px 14px"}}>🎓 Request</button>)}
            </div>
          </div></div>
        ))}</div>}
    </div>
  );
}

// ─── GALLERY ──────────────────────────────────────────────────
function Gallery() {
  const {user,token}=useAuth();const {addToast}=useToast();
  const [items,setItems]=useState([]);const [ld,setLd]=useState(true);const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({title:"",description:"",url:"",media_type:"photo",event_name:""});
  const fetchGallery=()=>{setLd(true);api("/gallery","GET",null,token).then(d=>setItems(d.gallery)).catch(console.error).finally(()=>setLd(false));};
  useEffect(()=>{if(token)fetchGallery();},[token]);
  const add=async e=>{e.preventDefault();try{await api("/gallery","POST",form,token);addToast("Added to gallery!","success");setShowForm(false);setForm({title:"",description:"",url:"",media_type:"photo",event_name:""});fetchGallery();}catch(err){addToast(err.message,"danger");}};
  const del=async id=>{await api(`/gallery/${id}`,"DELETE",null,token);setItems(items.filter(i=>i.id!==id));addToast("Removed","info");};
  return (
    <div style={{padding:"28px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h4 style={{fontSize:22,fontWeight:800,marginBottom:2}}>Media Gallery</h4><p style={{color:"var(--mut)",fontSize:14,margin:0}}>Photos and videos from alumni events</p></div>
        {user.role==="admin"&&<button className="bp" onClick={()=>setShowForm(!showForm)}>{showForm?"✕ Cancel":"+ Add Media"}</button>}
      </div>
      {showForm&&<div className="cg mb-4"><div style={{fontWeight:700,marginBottom:16}}>Add to Gallery</div>
        <form onSubmit={add}><div className="row g-2">
          <div className="col-md-8"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Image/Video URL *</label><input className="ff" placeholder="https://..." value={form.url} onChange={e=>setForm({...form,url:e.target.value})} required/></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Type</label><select className="ff" value={form.media_type} onChange={e=>setForm({...form,media_type:e.target.value})}><option value="photo">Photo</option><option value="video">Video</option></select></div>
          <div className="col-md-6"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Title</label><input className="ff" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
          <div className="col-md-6"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Event Name</label><input className="ff" placeholder="Alumni Day 2024" value={form.event_name} onChange={e=>setForm({...form,event_name:e.target.value})}/></div>
        </div><button type="submit" className="bp" style={{marginTop:12}}>Add</button></form>
      </div>}
      {ld?<div className="row g-3">{[1,2,3,4,5,6].map(i=><div className="col-md-4 col-lg-3" key={i}><Skel h={200}/></div>)}</div>
         :items.length===0?<div style={{textAlign:"center",padding:"48px 0",color:"var(--mut)"}}><div style={{fontSize:52}}>🖼️</div><p style={{marginTop:12}}>Gallery is empty</p></div>
         :<div className="row g-3">{items.map(item=>(
          <div className="col-md-4 col-lg-3" key={item.id}><div className="cg ac" style={{padding:0,overflow:"hidden"}}>
            {item.media_type==="photo"?<img src={item.url} alt={item.title} style={{width:"100%",height:180,objectFit:"cover"}} onError={e=>{e.target.src="https://via.placeholder.com/300x180?text=Photo";}}/>
              :<div style={{height:180,background:"#1e293b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>🎥</div>}
            <div style={{padding:"12px 14px"}}>
              <div style={{fontWeight:600,fontSize:13}}>{item.title||"Untitled"}</div>
              {item.event_name&&<div style={{color:"var(--mut)",fontSize:12,marginTop:2}}>📅 {item.event_name}</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                <span style={{background:item.media_type==="video"?"#fef3c7":"#eff6ff",color:item.media_type==="video"?"#d97706":"#1d4ed8",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6}}>{item.media_type==="video"?"🎥 Video":"📸 Photo"}</span>
                {user.role==="admin"&&<button onClick={()=>del(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:12,fontWeight:600}}>✕ Remove</button>}
              </div>
            </div>
          </div></div>
        ))}</div>}
    </div>
  );
}

// ─── SUCCESS STORIES ──────────────────────────────────────────
function SuccessStories() {
  const {user,token}=useAuth();const {addToast}=useToast();
  const [stories,setStories]=useState([]);const [ld,setLd]=useState(true);const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({title:"",story:"",achievement:"",company:"",year:"",image_url:""});
  const fetchStories=()=>{setLd(true);api("/success-stories","GET",null,token).then(d=>setStories(d.stories)).catch(console.error).finally(()=>setLd(false));};
  useEffect(()=>{if(token)fetchStories();},[token]);
  const submit=async e=>{e.preventDefault();try{await api("/success-stories","POST",form,token);addToast("Story submitted! Awaiting approval 🏆","success");setShowForm(false);setForm({title:"",story:"",achievement:"",company:"",year:"",image_url:""});}catch(err){addToast(err.message,"danger");}};
  const like=async id=>{try{await api(`/success-stories/${id}/like`,"POST",null,token);fetchStories();}catch{}};
  const approve=async id=>{await api(`/success-stories/${id}/approve`,"PUT",null,token);fetchStories();addToast("Story approved!","success");};
  const del=async id=>{await api(`/success-stories/${id}`,"DELETE",null,token);fetchStories();addToast("Deleted","info");};
  return (
    <div style={{padding:"28px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h4 style={{fontSize:22,fontWeight:800,marginBottom:2}}>Success Stories</h4><p style={{color:"var(--mut)",fontSize:14,margin:0}}>{stories.length} inspiring journeys</p></div>
        {user.role==="alumni"&&<button className="bp" onClick={()=>setShowForm(!showForm)}>{showForm?"✕ Cancel":"🏆 Share Your Story"}</button>}
      </div>
      {showForm&&<div className="cg mb-4" style={{borderLeft:"4px solid #dc2626"}}><div style={{fontWeight:700,marginBottom:16}}>Share Your Success Story</div>
        <form onSubmit={submit}><div className="row g-2">
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Title *</label><input className="ff" placeholder="My journey from campus to Google" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Achievement</label><input className="ff" placeholder="Senior SDE at Google" value={form.achievement} onChange={e=>setForm({...form,achievement:e.target.value})}/></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Company</label><input className="ff" placeholder="Google" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Year</label><input className="ff" placeholder="2024" value={form.year} onChange={e=>setForm({...form,year:e.target.value})}/></div>
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Your Story *</label><textarea className="ff" rows={5} placeholder="Share your journey..." value={form.story} onChange={e=>setForm({...form,story:e.target.value})} required/></div>
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Photo URL (optional)</label><input className="ff" placeholder="https://..." value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})}/></div>
        </div><button type="submit" className="bp" style={{marginTop:12}}>Submit Story</button></form>
      </div>}
      {ld?<div className="row g-3">{[1,2,3].map(i=><div className="col-md-4" key={i}><Skel h={200}/></div>)}</div>
         :stories.length===0?<div style={{textAlign:"center",padding:"48px 0",color:"var(--mut)"}}><div style={{fontSize:52}}>🏆</div><p style={{marginTop:12}}>No stories yet</p></div>
         :<div className="row g-3">{stories.map(s=>(
          <div className="col-md-4" key={s.id}><div className="cg ac h-100">
            {s.image_url&&<img src={s.image_url} alt={s.title} style={{width:"100%",height:130,objectFit:"cover",borderRadius:10,marginBottom:12}} onError={e=>e.target.style.display="none"}/>}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><Avatar name={s.author_name} id={s.user_id} size={36}/><div><div style={{fontWeight:700,fontSize:14}}>{s.author_name}</div>{s.achievement&&<div style={{color:"var(--mut)",fontSize:12}}>{s.achievement}</div>}</div></div>
            <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{s.title}</div>
            {s.company&&<span style={{background:"#eff6ff",color:"#1d4ed8",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,display:"inline-block",marginBottom:8}}>🏢 {s.company} {s.year&&`· ${s.year}`}</span>}
            <p style={{color:"var(--mut)",fontSize:13,lineHeight:1.55,marginBottom:12}}>{s.story.slice(0,150)}{s.story.length>150?"...":""}</p>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={()=>like(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:s.is_liked?"#dc2626":"var(--mut)",fontSize:13,fontWeight:600}}>{s.is_liked?"❤️":"🤍"} {s.like_count}</button>
              <div style={{display:"flex",gap:6}}>
                {user.role==="admin"&&!s.is_approved&&<button onClick={()=>approve(s.id)} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>Approve</button>}
                {user.role==="admin"&&<button onClick={()=>del(s.id)} style={{background:"none",border:"1.5px solid #dc2626",color:"#dc2626",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>✕</button>}
              </div>
            </div>
          </div></div>
        ))}</div>}
    </div>
  );
}

// ─── OPPORTUNITIES ────────────────────────────────────────────
function Opportunities() {
  const {user,token}=useAuth();const {addToast}=useToast();
  const [opps,setOpps]=useState([]);const [ld,setLd]=useState(true);const [showForm,setShowForm]=useState(false);const [filter,setFilter]=useState("");
  const [form,setForm]=useState({title:"",description:"",company:"",location:"",opp_type:"Job",deadline:"",apply_link:""});
  const fetchOpps=()=>{setLd(true);const p=new URLSearchParams();if(filter)p.set("type",filter);api(`/opportunities?${p}`,"GET",null,token).then(d=>setOpps(d.opportunities)).catch(console.error).finally(()=>setLd(false));};
  useEffect(()=>{if(token)fetchOpps();},[token,filter]);
  const create=async e=>{e.preventDefault();try{await api("/opportunities","POST",form,token);addToast("Opportunity posted!","success");setShowForm(false);setForm({title:"",description:"",company:"",location:"",opp_type:"Job",deadline:"",apply_link:""});fetchOpps();}catch(err){addToast(err.message,"danger");}};
  const del=async id=>{await api(`/opportunities/${id}`,"DELETE",null,token);setOpps(opps.filter(o=>o.id!==id));addToast("Removed","info");};
  const typeC={"Job":["#eff6ff","#1d4ed8"],"Internship":["#f0fdf4","#16a34a"],"Research":["#fdf4ff","#9333ea"],"Scholarship":["#fffbeb","#d97706"]};
  return (
    <div style={{padding:"28px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h4 style={{fontSize:22,fontWeight:800,marginBottom:2}}>Opportunities Board</h4><p style={{color:"var(--mut)",fontSize:14,margin:0}}>{opps.length} openings</p></div>
        <button className="bp" onClick={()=>setShowForm(!showForm)}>{showForm?"✕ Cancel":"+ Post Opportunity"}</button>
      </div>
      {showForm&&<div className="cg mb-4"><div style={{fontWeight:700,marginBottom:16}}>Post an Opportunity</div>
        <form onSubmit={create}><div className="row g-2">
          <div className="col-md-8"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Title *</label><input className="ff" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Type</label><select className="ff" value={form.opp_type} onChange={e=>setForm({...form,opp_type:e.target.value})}><option>Job</option><option>Internship</option><option>Research</option><option>Scholarship</option></select></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Company</label><input className="ff" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Location</label><input className="ff" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Deadline</label><input type="date" className="ff" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/></div>
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Description</label><textarea className="ff" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Apply Link</label><input className="ff" placeholder="https://..." value={form.apply_link} onChange={e=>setForm({...form,apply_link:e.target.value})}/></div>
        </div><button type="submit" className="bp" style={{marginTop:12}}>Post</button></form>
      </div>}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>{["","Job","Internship","Research","Scholarship"].map(t=><button key={t} className={`fp${filter===t?" on":""}`} onClick={()=>setFilter(t)}>{t||"All"}</button>)}</div>
      {ld?<div className="row g-3">{[1,2,3].map(i=><div className="col-md-6" key={i}><Skel/></div>)}</div>
         :opps.length===0?<div style={{textAlign:"center",padding:"48px 0",color:"var(--mut)"}}><div style={{fontSize:52}}>📋</div><p style={{marginTop:12}}>No opportunities yet</p></div>
         :<div className="row g-3">{opps.map(o=>{const [bg,tc]=typeC[o.opp_type]||typeC.Job;return(
          <div className="col-md-6" key={o.id}><div className="cg ac h-100" style={{borderLeft:"4px solid #1d4ed8"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div><div style={{fontWeight:700,fontSize:15}}>{o.title}</div><div style={{color:"var(--mut)",fontSize:13}}>{o.company}{o.location&&` · ${o.location}`}</div></div>
              <span style={{background:bg,color:tc,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:8,flexShrink:0,marginLeft:8}}>{o.opp_type}</span>
            </div>
            {o.description&&<p style={{color:"var(--mut)",fontSize:13,lineHeight:1.5,marginBottom:10}}>{o.description.slice(0,120)}{o.description.length>120?"...":""}</p>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>{o.deadline&&<span style={{fontSize:12,color:"var(--mut)"}}>⏰ {o.deadline}</span>}<div style={{fontSize:12,color:"var(--mut)"}}>By {o.poster_name}</div></div>
              <div style={{display:"flex",gap:6}}>
                {o.apply_link&&<a href={o.apply_link} target="_blank" rel="noreferrer" className="bp" style={{fontSize:12,padding:"5px 12px",textDecoration:"none"}}>Apply</a>}
                {(o.posted_by===user.id||user.role==="admin")&&<button onClick={()=>del(o.id)} style={{background:"none",border:"1.5px solid #dc2626",color:"#dc2626",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>✕</button>}
              </div>
            </div>
          </div></div>
        );})}</div>}
    </div>
  );
}

// ─── CONTRIBUTIONS ────────────────────────────────────────────
function Contributions() {
  const {user,token}=useAuth();const {addToast}=useToast();
  const [data,setData]=useState(null);const [ld,setLd]=useState(true);const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({amount:"",cause:"General Scholarship",message:"",donor_name:"",is_anonymous:false});
  useEffect(()=>{if(token)api("/contributions","GET",null,token).then(setData).catch(console.error).finally(()=>setLd(false));},[token]);
  const contribute=async e=>{e.preventDefault();if(!form.amount||isNaN(form.amount))return;try{await api("/contributions","POST",{...form,donor_name:form.donor_name||user.name},token);addToast("Thank you for your contribution! 🙏","success");setShowForm(false);api("/contributions","GET",null,token).then(setData);}catch(err){addToast(err.message,"danger");}};
  return (
    <div style={{padding:"28px 0"}}>
      <div style={{marginBottom:20}}><h4 style={{fontSize:22,fontWeight:800,marginBottom:2}}>Giving & Contributions</h4><p style={{color:"var(--mut)",fontSize:14,margin:0}}>Support scholarships and alumni initiatives</p></div>
      {data&&<div className="cg mb-4 hg" style={{padding:"24px 28px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:13,opacity:.8,marginBottom:4}}>Total Contributions Received</div><div style={{fontSize:40,fontWeight:800}}>₹{data.total.toLocaleString()}</div><div style={{fontSize:13,opacity:.8,marginTop:4}}>{data.count} contributors</div></div><div style={{fontSize:64}}>💰</div></div></div>}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:20}}><button className="bp" onClick={()=>setShowForm(!showForm)} style={{fontSize:15,padding:"10px 24px"}}>{showForm?"✕ Cancel":"💝 Contribute Now"}</button></div>
      {showForm&&<div className="cg mb-4" style={{borderLeft:"4px solid #16a34a"}}><div style={{fontWeight:700,marginBottom:16}}>Make a Contribution</div>
        <form onSubmit={contribute}><div className="row g-2">
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Amount (₹) *</label><input type="number" className="ff" placeholder="500" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required min="1"/></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Cause</label><select className="ff" value={form.cause} onChange={e=>setForm({...form,cause:e.target.value})}><option>General Scholarship</option><option>Merit Scholarship</option><option>Sports Fund</option><option>Infrastructure</option><option>Alumni Events</option></select></div>
          <div className="col-md-4"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Name (optional)</label><input className="ff" placeholder="Your name" value={form.donor_name} onChange={e=>setForm({...form,donor_name:e.target.value})}/></div>
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Message (optional)</label><textarea className="ff" rows={2} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/></div>
          <div className="col-12"><label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontWeight:600,fontSize:13}}><input type="checkbox" checked={form.is_anonymous} onChange={e=>setForm({...form,is_anonymous:e.target.checked})}/> Donate anonymously</label></div>
        </div><button type="submit" className="bp" style={{marginTop:12}}>Contribute</button></form>
      </div>}
      {ld?<Skel/>:data?.contributions.length===0?<div style={{textAlign:"center",padding:"32px 0",color:"var(--mut)"}}>No contributions yet. Be the first!</div>
         :<div className="row g-3">{data.contributions.map(c=>(
          <div className="col-md-6" key={c.id}><div className="cg"><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontWeight:700,fontSize:15}}>₹{c.amount.toLocaleString()}</div><div style={{color:"var(--mut)",fontSize:13}}>{c.donor_name}</div></div><span style={{background:"#f0fdf4",color:"#16a34a",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:8}}>{c.cause}</span></div>{c.message&&<p style={{color:"var(--mut)",fontSize:13,marginTop:8,fontStyle:"italic"}}>"{c.message}"</p>}<div style={{fontSize:12,color:"var(--mut)",marginTop:8}}>{c.created_at}</div></div></div>
        ))}</div>}
    </div>
  );
}

// ─── CONTACT ──────────────────────────────────────────────────
function Contact() {
  const {addToast}=useToast();
  const [form,setForm]=useState({name:"",email:"",subject:"General Inquiry",message:""});
  const [errs,setErrs]=useState({});const [ld,setLd]=useState(false);const [done,setDone]=useState(false);
  const submit=async e=>{
    e.preventDefault();const v={};
    if(!form.name.trim())v.name="Required";if(!form.email.includes("@"))v.email="Valid email required";if(!form.message.trim())v.message="Required";
    if(Object.keys(v).length){setErrs(v);return;}setLd(true);
    try{await api("/contact","POST",form);addToast("Message sent! We'll get back to you 🙏","success");setDone(true);}catch(err){addToast(err.message,"danger");}finally{setLd(false);}
  };
  return (
    <div style={{padding:"28px 0",display:"flex",justifyContent:"center"}}><div style={{width:"100%",maxWidth:580}}>
      {done?<div className="cg" style={{textAlign:"center",padding:"48px 32px"}}><div style={{fontSize:60,marginBottom:16}}>🙏</div><h4 style={{fontWeight:800,marginBottom:8}}>Message Received!</h4><p style={{color:"var(--mut)"}}>Thank you for reaching out. We'll get back to you at {form.email} shortly.</p><button onClick={()=>setDone(false)} className="bp" style={{marginTop:16}}>Send Another</button></div>
      :<div className="cg">
        <div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:44}}>✉️</div><h4 style={{fontWeight:800,marginTop:10,marginBottom:4}}>Contact Us</h4><p style={{color:"var(--mut)",fontSize:14}}>Reach out to the Alumni Association</p></div>
        <form onSubmit={submit}><div className="row g-2">
          <div className="col-md-6"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Name *</label><input className={`ff${errs.name?" err":""}`} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><FErr msg={errs.name}/></div>
          <div className="col-md-6"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Email *</label><input type="email" className={`ff${errs.email?" err":""}`} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><FErr msg={errs.email}/></div>
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Subject</label><select className="ff" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}><option>General Inquiry</option><option>Event Information</option><option>Membership</option><option>Technical Support</option><option>Other</option></select></div>
          <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Message *</label><textarea className={`ff${errs.message?" err":""}`} rows={5} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/><FErr msg={errs.message}/></div>
        </div><button type="submit" className="bp" style={{width:"100%",padding:11,marginTop:12}} disabled={ld}>{ld?"Sending...":"Send Message"}</button></form>
      </div>}
    </div></div>
  );
}

// ─── FEEDBACK ─────────────────────────────────────────────────
function Feedback() {
  const {token}=useAuth();const {addToast}=useToast();
  const [form,setForm]=useState({category:"General",message:"",rating:0});const [ld,setLd]=useState(false);const [done,setDone]=useState(false);
  const submit=async e=>{e.preventDefault();if(!form.message.trim())return;setLd(true);try{await api("/feedback","POST",form,token);addToast("Feedback submitted! Thank you 🙏","success");setDone(true);}catch(err){addToast(err.message,"danger");}finally{setLd(false);}};
  return (
    <div style={{padding:"28px 0",display:"flex",justifyContent:"center"}}><div style={{width:"100%",maxWidth:520}}>
      {done?<div className="cg" style={{textAlign:"center",padding:"48px 32px"}}><div style={{fontSize:60}}>⭐</div><h4 style={{fontWeight:800,marginTop:16,marginBottom:8}}>Thank You!</h4><p style={{color:"var(--mut)"}}>Your feedback helps us improve AlumniNet.</p><button onClick={()=>{setDone(false);setForm({category:"General",message:"",rating:0});}} className="bp" style={{marginTop:16}}>Submit More</button></div>
      :<div className="cg">
        <div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:44}}>💬</div><h4 style={{fontWeight:800,marginTop:10,marginBottom:4}}>Share Feedback</h4><p style={{color:"var(--mut)",fontSize:14}}>Help us improve the portal</p></div>
        <form onSubmit={submit}>
          <div style={{marginBottom:16}}><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Category</label><select className="ff" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>General</option><option>Bug Report</option><option>Feature Request</option><option>Complaint</option></select></div>
          <div style={{marginBottom:16}}><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:8}}>Rating</label><StarRating value={form.rating} onChange={v=>setForm({...form,rating:v})}/></div>
          <div style={{marginBottom:20}}><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Message *</label><textarea className="ff" rows={5} placeholder="Tell us what you think..." value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required/></div>
          <button type="submit" className="bp" style={{width:"100%",padding:11}} disabled={ld}>{ld?"Submitting...":"Submit Feedback"}</button>
        </form>
      </div>}
    </div></div>
  );
}

// ─── INBOX ────────────────────────────────────────────────────
function Inbox() {
  const {user,token}=useAuth();
  const [tab,setTab]=useState("inbox");const [msgs,setMsgs]=useState([]);const [ld,setLd]=useState(true);const [sel,setSel]=useState(null);
  useEffect(()=>{setLd(true);setSel(null);api(tab==="inbox"?`/messages/inbox/${user.id}`:`/messages/sent/${user.id}`,"GET",null,token).then(d=>setMsgs(d.messages)).catch(console.error).finally(()=>setLd(false));},[tab,token]);
  const open=async m=>{setSel(m);if(tab==="inbox"&&!m.is_read){await api(`/messages/read/${m.id}`,"PUT",null,token);setMsgs(ms=>ms.map(x=>x.id===m.id?{...x,is_read:true}:x));}};
  return (
    <div style={{padding:"28px 0"}}>
      <h4 style={{fontSize:22,fontWeight:800,marginBottom:20}}>Messages</h4>
      <div style={{display:"flex",gap:8,marginBottom:20}}>{["inbox","sent"].map(t=><button key={t} className={`tb${tab===t?" on":""}`} onClick={()=>setTab(t)}>{t==="inbox"?"📥 Inbox":"📤 Sent"}</button>)}</div>
      <div className="row g-3">
        <div className={sel?"col-md-5":"col-12"}>
          {ld?<Skel/>:msgs.length===0?<div className="cg" style={{textAlign:"center",padding:32,color:"var(--mut)"}}><div style={{fontSize:40}}>{tab==="inbox"?"📭":"📤"}</div><p style={{marginTop:12}}>No messages</p></div>
             :<div style={{display:"flex",flexDirection:"column",gap:8}}>{msgs.map(m=><div key={m.id} onClick={()=>open(m)} className="cg" style={{cursor:"pointer",background:(!m.is_read&&tab==="inbox")?"var(--sur2)":"var(--sur)",borderLeft:sel?.id===m.id?"4px solid #1d4ed8":"4px solid transparent",transition:"all .15s"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}>{tab==="inbox"?m.sender_name:m.receiver_name}{!m.is_read&&tab==="inbox"&&<span className="ud"/>}</div><div style={{fontSize:13,color:"var(--mut)",marginTop:2}}>{m.subject||"(No subject)"}</div></div><div style={{fontSize:11,color:"var(--mut)",flexShrink:0}}>{m.created_at}</div></div></div>)}</div>}
        </div>
        {sel&&<div className="col-md-7"><div className="cg"><div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><div><div style={{fontWeight:800,fontSize:16}}>{sel.subject||"(No subject)"}</div><div style={{color:"var(--mut)",fontSize:13,marginTop:4}}>From <strong>{sel.sender_name}</strong> · {sel.created_at}</div></div><button onClick={()=>setSel(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"var(--mut)"}}>✕</button></div><div style={{padding:14,background:"var(--sur2)",borderRadius:10,fontSize:14,lineHeight:1.7}}>{sel.body}</div></div></div>}
      </div>
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────
function Profile() {
  const {user,token,updateUser}=useAuth();const {addToast}=useToast();
  const [form,setForm]=useState({company:"",designation:"",location:"",bio:"",skills:"",linkedin:"",twitter:"",facebook:"",instagram:""});const [edit,setEdit]=useState(false);const [ld,setLd]=useState(true);const [sv,setSv]=useState(false);
  useEffect(()=>{if(!user.alumni_id||!token){setLd(false);return;}api(`/alumni/${user.alumni_id}`,"GET",null,token).then(d=>setForm({company:d.company,designation:d.designation,location:d.location,bio:d.bio,skills:d.skills?.join(", ")||"",linkedin:d.linkedin||"",twitter:d.twitter||"",facebook:d.facebook||"",instagram:d.instagram||""})).catch(console.error).finally(()=>setLd(false));},[]);
  const save=async e=>{e.preventDefault();setSv(true);try{await api(`/alumni/${user.alumni_id}`,"PUT",form,token);addToast("Profile updated! ✅","success");setEdit(false);updateUser({company:form.company,designation:form.designation});}catch(err){addToast(err.message,"danger");}finally{setSv(false);}};
  if(ld)return <div style={{padding:"28px 0"}}><Skel/></div>;
  return (
    <div style={{padding:"28px 0"}}><div style={{maxWidth:640,margin:"0 auto"}}><div className="cg">
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
        <Avatar name={user.name} id={user.id} size={64}/>
        <div style={{flex:1}}><h4 style={{fontWeight:800,marginBottom:4}}>{user.name}</h4><div style={{color:"var(--mut)",fontSize:14}}>{form.designation}{form.company&&` at ${form.company}`}</div><span style={{background:"#eff6ff",color:"#1d4ed8",fontSize:12,fontWeight:600,padding:"2px 10px",borderRadius:8,marginTop:4,display:"inline-block"}}>Batch {user.batch_year}</span></div>
        {!edit&&<button className="bo" onClick={()=>setEdit(true)} style={{fontSize:13}}>✏️ Edit</button>}
      </div>
      {edit?(<form onSubmit={save}><div className="row g-2">
        {[["Company","company"],["Designation","designation"],["Location","location"]].map(([l,n])=><div className="col-md-4" key={n}><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>{l}</label><input className="ff" value={form[n]} onChange={e=>setForm({...form,[n]:e.target.value})}/></div>)}
        <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Skills</label><input className="ff" value={form.skills} onChange={e=>setForm({...form,skills:e.target.value})} placeholder="React, Python, SQL"/></div>
        <div className="col-12"><label style={{display:"block",fontWeight:600,fontSize:13,marginBottom:5}}>Bio</label><textarea className="ff" rows={3} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/></div>
        <div style={{width:"100%",padding:"4px 6px",fontWeight:600,fontSize:13,color:"var(--mut)"}}>Social Media Links</div>
        {[["in LinkedIn","linkedin","#0a66c2"],["𝕏 Twitter","twitter","#1da1f2"],["f Facebook","facebook","#1877f2"],["📸 Instagram","instagram","#e1306c"]].map(([l,n,c])=><div className="col-md-6" key={n}><label style={{display:"block",fontWeight:600,fontSize:12,marginBottom:5,color:c}}>{l}</label><input className="ff" placeholder={`https://...`} value={form[n]} onChange={e=>setForm({...form,[n]:e.target.value})}/></div>)}
      </div><div style={{display:"flex",gap:10,marginTop:16}}><button type="submit" className="bp" disabled={sv}>{sv?"Saving...":"Save Changes"}</button><button type="button" className="bo" onClick={()=>setEdit(false)}>Cancel</button></div></form>)
      :(<div>
        {form.bio&&<p style={{color:"var(--mut)",fontSize:14,lineHeight:1.6,marginBottom:16}}>{form.bio}</p>}
        {form.location&&<div style={{color:"var(--mut)",fontSize:14,marginBottom:12}}>📍 {form.location}</div>}
        <div style={{marginBottom:12}}>{form.skills.split(",").filter(Boolean).map(s=><span key={s} className="sk-pill">{s.trim()}</span>)}</div>
        <SocialLinks alumni={form}/>
      </div>)}
    </div></div></div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────
function AdminPanel() {
  const {token}=useAuth();const {addToast}=useToast();
  const [pending,setPending]=useState([]);const [stats,setStats]=useState(null);const [feedback,setFeedback]=useState([]);const [contacts,setContacts]=useState([]);const [stories,setStories]=useState([]);const [ld,setLd]=useState(true);const [tab,setTab]=useState("overview");
  const fetchAll=()=>{setLd(true);Promise.all([api("/admin/pending","GET",null,token),api("/admin/stats","GET",null,token),api("/feedback","GET",null,token),api("/contact","GET",null,token),api("/success-stories?approved=false","GET",null,token)]).then(([p,s,fb,ct,st])=>{setPending(p.users);setStats(s);setFeedback(fb.feedback.filter(f=>!f.is_resolved));setContacts(ct.contacts.filter(c=>!c.is_resolved));setStories(st.stories.filter(s=>!s.is_approved));}).catch(console.error).finally(()=>setLd(false));};
  useEffect(()=>{if(token)fetchAll();},[token]);
  const approve=async(id,name)=>{await api(`/admin/approve/${id}`,"PUT",null,token);setPending(p=>p.filter(u=>u.id!==id));setStats(s=>({...s,pending:s.pending-1}));addToast(`✅ ${name} approved!`,"success");};
  const reject=async(id,name)=>{if(!window.confirm(`Reject ${name}?`))return;await api(`/admin/reject/${id}`,"DELETE",null,token);setPending(p=>p.filter(u=>u.id!==id));addToast(`${name} rejected`,"warning");};
  const resolveFb=async id=>{await api(`/feedback/${id}/resolve`,"PUT",null,token);setFeedback(fb=>fb.filter(f=>f.id!==id));addToast("Feedback resolved","success");};
  const resolveCt=async id=>{await api(`/contact/${id}/resolve`,"PUT",null,token);setContacts(ct=>ct.filter(c=>c.id!==id));addToast("Contact resolved","success");};
  const approveSt=async id=>{await api(`/success-stories/${id}/approve`,"PUT",null,token);setStories(st=>st.filter(s=>s.id!==id));addToast("Story approved","success");};
  const dlCSV=async()=>{const r=await fetch("http://localhost:5000/api/admin/export-csv",{headers:{Authorization:`Bearer ${token}`}});const b=await r.blob();const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="alumni.csv";a.click();URL.revokeObjectURL(u);addToast("CSV downloaded!","success");};
  if(ld)return <div style={{padding:"28px 0"}}><Skel/></div>;
  const tabs=[{k:"overview",l:"Overview"},{k:"users",l:`Users${pending.length>0?` (${pending.length})`:""}`},{k:"feedback",l:`Feedback${feedback.length>0?` (${feedback.length})`:""}`},{k:"contacts",l:`Contacts${contacts.length>0?` (${contacts.length})`:""}`},{k:"stories",l:`Stories${stories.length>0?` (${stories.length})`:""}`}];
  return (
    <div style={{padding:"28px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h4 style={{fontSize:22,fontWeight:800,marginBottom:2}}>Admin Panel</h4><p style={{color:"var(--mut)",fontSize:14,margin:0}}>Manage AlumniNet v4.0</p></div>
        <button onClick={dlCSV} className="bo" style={{fontSize:13}}>📥 Export CSV</button>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>{tabs.map(t=><button key={t.k} className={`tb${tab===t.k?" on":""}`} onClick={()=>setTab(t.k)}>{t.l}</button>)}</div>
      {tab==="overview"&&<>
        {stats&&<div className="row g-3 mb-4">{[["🎓","Alumni",stats.total_alumni,"#1d4ed8"],["📚","Students",stats.total_students,"#7c3aed"],["⏳","Pending",stats.pending,"#d97706"],["📅","Events",stats.total_events,"#059669"],["💬","Forum",stats.total_forum_posts,"#0891b2"],["🏆","Stories",stats.total_stories,"#dc2626"],["💰",`₹${stats.total_contributions}`,"Contributions","#16a34a"],["📋","Opps",stats.total_opportunities,"#9333ea"],["🤝","Mentors",stats.total_mentors,"#d97706"],["📩","Unresolved",stats.unresolved_contacts,"#854F0B"]].map(([ic,l,v,c],i)=><div className="col-6 col-md-2" key={i}><div className="cg" style={{textAlign:"center",padding:"14px"}}><div style={{fontSize:20}}>{ic}</div><div style={{fontSize:20,fontWeight:800,color:c,margin:"4px 0"}}>{v}</div><div style={{color:"var(--mut)",fontSize:12}}>{["Alumni","Students","Pending","Events","Forum","Stories","Contributions","Opportunities","Mentors","Unresolved"][i]}</div></div></div>)}</div>}
        {stats&&<div className="row g-4">{stats.top_companies?.length>0&&<div className="col-md-6"><div className="cg"><div style={{fontWeight:700,marginBottom:14}}>Top Companies</div><Pie data={{labels:stats.top_companies.map(([k])=>k),datasets:[{data:stats.top_companies.map(([,v])=>v),backgroundColor:CLRS.slice(0,5)}]}} options={{responsive:true,plugins:{legend:{position:"bottom",labels:{font:{size:12},padding:10}}}}}/></div></div>}{stats.batch_years?.length>0&&<div className="col-md-6"><div className="cg"><div style={{fontWeight:700,marginBottom:14}}>Alumni by Batch</div><Bar data={{labels:stats.batch_years,datasets:[{label:"Alumni",data:stats.batch_counts,backgroundColor:"#1d4ed8",borderRadius:6}]}} options={{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}}/></div></div>}</div>}
      </>}
      {tab==="users"&&<div className="cg"><div style={{fontWeight:700,marginBottom:16,fontSize:15}}>Pending Registrations {pending.length>0&&<span style={{background:"#fef3c7",color:"#d97706",fontSize:12,fontWeight:700,padding:"2px 8px",borderRadius:8,marginLeft:8}}>{pending.length}</span>}</div>{pending.length===0?<div style={{textAlign:"center",padding:28,color:"var(--mut)"}}><div style={{fontSize:40}}>✅</div><p style={{marginTop:10}}>All caught up!</p></div>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><thead><tr style={{borderBottom:"1.5px solid var(--brd)"}}>{["Name","Email","Role","Date","Actions"].map(h=><th key={h} style={{textAlign:"left",padding:"10px 12px",fontWeight:700,fontSize:12,color:"var(--mut)",textTransform:"uppercase",letterSpacing:".5px"}}>{h}</th>)}</tr></thead><tbody>{pending.map(u=><tr key={u.id} style={{borderBottom:"0.5px solid var(--brd)"}}><td style={{padding:12}}><div style={{display:"flex",alignItems:"center",gap:10}}><Avatar name={u.name} id={u.id} size={32}/><span style={{fontWeight:600}}>{u.name}</span></div></td><td style={{padding:12,color:"var(--mut)"}}>{u.email}</td><td style={{padding:12}}><span style={{background:u.role==="alumni"?"#eff6ff":"#f5f3ff",color:u.role==="alumni"?"#1d4ed8":"#7c3aed",fontSize:12,fontWeight:700,padding:"3px 10px",borderRadius:8}}>{u.role}</span></td><td style={{padding:12,color:"var(--mut)",fontSize:13}}>{u.created_at}</td><td style={{padding:12}}><div style={{display:"flex",gap:8}}><button onClick={()=>approve(u.id,u.name)} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontWeight:600,fontSize:13}}>✓ Approve</button><button onClick={()=>reject(u.id,u.name)} style={{background:"none",border:"1.5px solid #dc2626",color:"#dc2626",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontWeight:600,fontSize:13}}>✕ Reject</button></div></td></tr>)}</tbody></table></div>}</div>}
      {tab==="feedback"&&<div className="cg"><div style={{fontWeight:700,marginBottom:16}}>Unresolved Feedback ({feedback.length})</div>{feedback.length===0?<div style={{textAlign:"center",padding:28,color:"var(--mut)"}}>No pending feedback! 🎉</div>:<div style={{display:"flex",flexDirection:"column",gap:10}}>{feedback.map(f=><div key={f.id} style={{background:"var(--sur2)",borderRadius:10,padding:"14px 16px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div><span style={{fontWeight:600,fontSize:14}}>{f.user_name}</span><span style={{background:"#eff6ff",color:"#1d4ed8",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,marginLeft:8}}>{f.category}</span></div><div style={{display:"flex",alignItems:"center",gap:8}}><StarRating value={f.rating} readonly/><span style={{fontSize:12,color:"var(--mut)"}}>{f.created_at}</span></div></div><p style={{fontSize:14,lineHeight:1.6,marginBottom:10}}>{f.message}</p><button onClick={()=>resolveFb(f.id)} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"5px 14px",cursor:"pointer",fontWeight:600,fontSize:12}}>Mark Resolved</button></div>)}</div>}</div>}
      {tab==="contacts"&&<div className="cg"><div style={{fontWeight:700,marginBottom:16}}>Unresolved Contacts ({contacts.length})</div>{contacts.length===0?<div style={{textAlign:"center",padding:28,color:"var(--mut)"}}>No pending contacts! 🎉</div>:<div style={{display:"flex",flexDirection:"column",gap:10}}>{contacts.map(c=><div key={c.id} style={{background:"var(--sur2)",borderRadius:10,padding:"14px 16px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><span style={{fontWeight:600,fontSize:14}}>{c.name}</span><span style={{color:"var(--mut)",fontSize:13,marginLeft:8}}>{c.email}</span></div><span style={{background:"#eff6ff",color:"#1d4ed8",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6}}>{c.subject}</span></div><p style={{fontSize:14,lineHeight:1.6,marginBottom:10}}>{c.message}</p><button onClick={()=>resolveCt(c.id)} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"5px 14px",cursor:"pointer",fontWeight:600,fontSize:12}}>Mark Resolved</button></div>)}</div>}</div>}
      {tab==="stories"&&<div className="cg"><div style={{fontWeight:700,marginBottom:16}}>Pending Story Approvals ({stories.length})</div>{stories.length===0?<div style={{textAlign:"center",padding:28,color:"var(--mut)"}}>No pending stories! 🎉</div>:<div className="row g-3">{stories.map(s=><div className="col-md-6" key={s.id}><div style={{background:"var(--sur2)",borderRadius:10,padding:"16px"}}><div style={{fontWeight:700,fontSize:15,marginBottom:6}}>{s.title}</div><p style={{color:"var(--mut)",fontSize:13,lineHeight:1.5,marginBottom:10}}>{s.story.slice(0,120)}...</p><div style={{display:"flex",gap:8}}><button onClick={()=>approveSt(s.id)} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"5px 14px",cursor:"pointer",fontWeight:600,fontSize:12}}>✓ Approve</button><button onClick={()=>{api(`/success-stories/${s.id}`,"DELETE",null,token).then(()=>{setStories(st=>st.filter(x=>x.id!==s.id));addToast("Deleted","info");});}} style={{background:"none",border:"1.5px solid #dc2626",color:"#dc2626",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontWeight:600,fontSize:12}}>✕ Reject</button></div></div></div>)}</div>}</div>}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Navbar/>
            <div className="container">
              <Routes>
                <Route path="/"              element={<Home/>}/>
                <Route path="/login"         element={<Login/>}/>
                <Route path="/register"      element={<Register/>}/>
                <Route path="/contact"       element={<Contact/>}/>
                <Route path="/dashboard"     element={<Protected><Dashboard/></Protected>}/>
                <Route path="/alumni"        element={<Protected><AlumniDirectory/></Protected>}/>
                <Route path="/forum"         element={<Protected><Forum/></Protected>}/>
                <Route path="/events"        element={<Protected><Events/></Protected>}/>
                <Route path="/mentorship"    element={<Protected><Mentorship/></Protected>}/>
                <Route path="/gallery"       element={<Protected><Gallery/></Protected>}/>
                <Route path="/stories"       element={<Protected><SuccessStories/></Protected>}/>
                <Route path="/opportunities" element={<Protected><Opportunities/></Protected>}/>
                <Route path="/contributions" element={<Protected><Contributions/></Protected>}/>
                <Route path="/feedback"      element={<Protected><Feedback/></Protected>}/>
                <Route path="/inbox"         element={<Protected><Inbox/></Protected>}/>
                <Route path="/profile"       element={<Protected><Profile/></Protected>}/>
                <Route path="/admin"         element={<Protected adminOnly><AdminPanel/></Protected>}/>
                <Route path="*"              element={<Navigate to="/"/>}/>
              </Routes>
            </div>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
