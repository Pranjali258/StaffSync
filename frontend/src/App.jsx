import React , { useCallback, useEffect, useState } from "react";
import { Users, CalendarDays, Clock3, Megaphone, LogOut, BriefcaseBusiness, RefreshCw } from "lucide-react";
import { api } from "./api";

const fmt = (v) => v ? new Date(v).toLocaleString() : "—";
const dateOnly = (v) => v ? new Date(v).toLocaleDateString() : "—";

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"", department:"General", jobTitle:"Employee" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await api(`/auth/${mode}`, { method:"POST", body:JSON.stringify(form) });
      localStorage.setItem("staffsync_token", result.token); onAuth(result.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="auth-wrap"><div className="auth-card">
    <div className="brand-mark">S</div><p className="eyebrow">PEOPLE • PROCESS • PROGRESS</p>
    <h1>Welcome to StaffSync</h1><p className="muted">Your simple HR workspace.</p>
    <div className="switcher"><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Sign in</button><button className={mode==="register"?"active":""} onClick={()=>setMode("register")}>Create account</button></div>
    <form onSubmit={submit}>
      {mode==="register" && <><label>Full name<input name="name" value={form.name} onChange={change} required /></label><div className="two"><label>Department<input name="department" value={form.department} onChange={change} /></label><label>Job title<input name="jobTitle" value={form.jobTitle} onChange={change} /></label></div></>}
      <label>Email<input type="email" name="email" value={form.email} onChange={change} required /></label>
      <label>Password<input type="password" name="password" value={form.password} onChange={change} minLength="8" required /></label>
      {error && <p className="error">{error}</p>}
      <button className="primary full" disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in":"Create employee account"}</button>
    </form>
    <p className="tiny">New registrations receive the Employee role by default.</p>
  </div></div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState("");
  const [leaveForm, setLeaveForm] = useState({ startDate:"", endDate:"", reason:"" });
  const [announcementForm, setAnnouncementForm] = useState({ title:"", message:"" });

  const loadData = useCallback(async () => {
    if (!localStorage.getItem("staffsync_token")) { setLoading(false); return; }
    try {
      const [me, emp, lv, att, ann] = await Promise.all([
        api("/auth/me"), api("/employees"), api("/leaves"), api("/attendance"), api("/announcements")
      ]);
      setUser(me.user); setEmployees(emp); setLeaves(lv); setAttendance(att); setAnnouncements(ann); setError("");
    } catch (err) { setError(err.message); localStorage.removeItem("staffsync_token"); setUser(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  async function act(fn) {
    setError("");
    try { await fn(); await loadData(); }
    catch (err) { setError(err.message); }
  }
  async function submitLeave(e) {
    e.preventDefault();
    await act(async () => {
      await api("/leaves", { method:"POST", body:JSON.stringify(leaveForm) });
      setLeaveForm({ startDate:"", endDate:"", reason:"" });
    });
  }
  async function submitAnnouncement(e) {
    e.preventDefault();
    await act(async () => {
      await api("/announcements", { method:"POST", body:JSON.stringify(announcementForm) });
      setAnnouncementForm({ title:"", message:"" });
    });
  }
  async function attendanceAction(kind) {
    await act(() => api(`/attendance/${kind}`, { method: kind==="check-in"?"POST":"PATCH", body:JSON.stringify({}) }));
  }
  function logout() { localStorage.removeItem("staffsync_token"); setUser(null); setTab("overview"); }

  if (loading) return <div className="loading">Loading StaffSync…</div>;
  if (!user) return <><AuthScreen onAuth={(u)=>{setUser(u);loadData();}} />{error && <p className="floating-error">{error}</p>}</>;

  const admin = ["hr","manager"].includes(user.role);
  const today = new Date().toISOString().slice(0,10);
  const todayRecord = attendance.find(a => (a.employee?._id || a.employee) === user.id && a.dateKey === today)
    || attendance.find(a => a.dateKey === today && (!a.employee || a.employee.email === user.email));

  const nav = [
    ["overview","Overview",BriefcaseBusiness],
    ["employees","Employees",Users],
    ["leaves","Leave requests",CalendarDays],
    ["attendance","Attendance",Clock3],
    ["announcements","Announcements",Megaphone]
  ];
  return <div className="app-shell">
    <aside className="sidebar"><div className="logo"><span className="logo-icon">S</span><div><b>StaffSync</b><small>PEOPLE OPERATIONS</small></div></div>
      <div className="profile-mini"><div className="avatar">{user.name?.slice(0,1).toUpperCase()}</div><div><b>{user.name}</b><small>{user.role} · {user.department}</small></div></div>
      <nav>{nav.map(([id,label,Icon])=><button key={id} className={tab===id?"nav-item selected":"nav-item"} onClick={()=>setTab(id)}><Icon size={18}/>{label}</button>)}</nav>
      <button className="nav-item logout" onClick={logout}><LogOut size={18}/>Sign out</button>
    </aside>
    <main className="main">
      <header className="topbar"><div><p className="eyebrow">STAFFSYNC WORKSPACE</p><h1>{nav.find(n=>n[0]===tab)?.[1] || "Overview"}</h1></div><div className="top-actions"><span className="role-chip">{user.role}</span><button className="icon-button" onClick={loadData} title="Refresh"><RefreshCw size={17}/></button></div></header>
      {error && <div className="alert">{error}<button onClick={()=>setError("")}>×</button></div>}
      {tab==="overview" && <section>
        <div className="welcome"><div><p className="eyebrow">YOUR HR DASHBOARD</p><h2>Good to see you, {user.name.split(" ")[0]}.</h2><p>Keep your workday and people operations in sync.</p></div><div className="welcome-icon"><BriefcaseBusiness size={34}/></div></div>
        <div className="stats-grid"><Stat title="Team members" value={employees.length} icon={<Users/>}/><Stat title="Leave requests" value={leaves.length} icon={<CalendarDays/>}/><Stat title="Attendance records" value={attendance.length} icon={<Clock3/>}/><Stat title="Announcements" value={announcements.length} icon={<Megaphone/>}/></div>
        <div className="content-grid"><div className="panel"><div className="panel-heading"><h3>Recent leave requests</h3><button className="text-button" onClick={()=>setTab("leaves")}>View all</button></div>{leaves.slice(0,4).length?leaves.slice(0,4).map(l=><div className="list-row" key={l._id}><div><b>{l.employee?.name || user.name}</b><small>{dateOnly(l.startDate)} – {dateOnly(l.endDate)}</small></div><Status status={l.status}/></div>):<Empty text="No leave requests yet."/>}</div>
          <div className="panel"><div className="panel-heading"><h3>Latest announcements</h3><button className="text-button" onClick={()=>setTab("announcements")}>View all</button></div>{announcements.slice(0,3).map(a=><div className="announcement-mini" key={a._id}><b>{a.title}</b><p>{a.message}</p><small>{a.author?.name || "StaffSync"} · {dateOnly(a.createdAt)}</small></div>)}{!announcements.length&&<Empty text="No announcements posted."/>}</div></div>
      </section>}
      {tab==="employees" && <section className="panel"><div className="panel-heading"><div><h2>Employee directory</h2><p className="muted">Basic employee profile information.</p></div></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Job title</th><th>Role</th></tr></thead><tbody>{employees.map(e=><tr key={e._id}><td><b>{e.name}</b></td><td>{e.email}</td><td>{e.department}</td><td>{e.jobTitle}</td><td><span className="role-chip">{e.role}</span></td></tr>)}</tbody></table></div></section>}
      {tab==="leaves" && <section className="content-grid leaves-grid"><div className="panel"><div className="panel-heading"><div><h2>{admin?"Team leave requests":"My leave requests"}</h2><p className="muted">Track leave applications and decisions.</p></div></div>{leaves.length?leaves.map(l=><div className="leave-card" key={l._id}><div className="panel-heading"><div><b>{l.employee?.name || user.name}</b><small>{l.employee?.department || user.department}</small></div><Status status={l.status}/></div><p>{dateOnly(l.startDate)} – {dateOnly(l.endDate)}</p><p>{l.reason}</p>{admin&&l.status==="pending"&&<div className="button-row"><button className="primary small" onClick={()=>act(()=>api(`/leaves/${l._id}/status`,{method:"PATCH",body:JSON.stringify({status:"approved"})}))}>Approve</button><button className="danger small" onClick={()=>act(()=>api(`/leaves/${l._id}/status`,{method:"PATCH",body:JSON.stringify({status:"rejected"})}))}>Reject</button></div>}</div>):<Empty text="No leave requests yet."/>}</div>
        {!admin&&<div className="panel"><h3>Request leave</h3><form onSubmit={submitLeave}><label>Start date<input type="date" value={leaveForm.startDate} onChange={e=>setLeaveForm({...leaveForm,startDate:e.target.value})} required/></label><label>End date<input type="date" value={leaveForm.endDate} onChange={e=>setLeaveForm({...leaveForm,endDate:e.target.value})} min={leaveForm.startDate} required/></label><label>Reason<textarea value={leaveForm.reason} onChange={e=>setLeaveForm({...leaveForm,reason:e.target.value})} rows="4" required/></label><button className="primary full">Submit request</button></form></div>}</section>}
      {tab==="attendance" && <section><div className="welcome compact"><div><p className="eyebrow">TODAY · {new Date().toLocaleDateString()}</p><h2>Attendance</h2><p>Record your workday start and finish.</p></div><Clock3 size={34}/></div>{!admin&&<div className="panel attendance-actions"><p>Use the buttons to record your attendance for today.</p><div className="button-row"><button className="primary" onClick={()=>attendanceAction("check-in")}>Check in</button><button className="secondary" onClick={()=>attendanceAction("check-out")}>Check out</button></div></div>}<div className="panel"><div className="panel-heading"><h3>{admin?"Team attendance":"My attendance history"}</h3></div><div className="table-wrap"><table><thead><tr>{admin&&<th>Employee</th>}<th>Date</th><th>Check in</th><th>Check out</th></tr></thead><tbody>{attendance.map(a=><tr key={a._id}>{admin&&<td>{a.employee?.name || "Employee"}</td>}<td>{a.dateKey}</td><td>{fmt(a.checkIn)}</td><td>{fmt(a.checkOut)}</td></tr>)}</tbody></table></div>{!attendance.length&&<Empty text="No attendance records yet."/>}</div></section>}
      {tab==="announcements" && <section className="content-grid"><div className="panel"><div className="panel-heading"><div><h2>Company announcements</h2><p className="muted">Updates from your organization.</p></div></div>{announcements.map(a=><article className="announcement-card" key={a._id}><div className="announcement-symbol"><Megaphone/></div><div><h3>{a.title}</h3><p>{a.message}</p><small>Posted by {a.author?.name || "StaffSync"} · {dateOnly(a.createdAt)}</small></div></article>)}{!announcements.length&&<Empty text="No announcements posted yet."/>}</div>{admin&&<div className="panel"><h3>Post an announcement</h3><form onSubmit={submitAnnouncement}><label>Title<input value={announcementForm.title} onChange={e=>setAnnouncementForm({...announcementForm,title:e.target.value})} required/></label><label>Message<textarea rows="5" value={announcementForm.message} onChange={e=>setAnnouncementForm({...announcementForm,message:e.target.value})} required/></label><button className="primary full">Publish announcement</button></form></div>}</section>}
      <footer>StaffSync · HR management made clearer <span>Learning project MVP</span></footer>
    </main>
  </div>;
}

function Stat({title,value,icon}) { return <div className="stat-card"><div className="stat-icon">{icon}</div><p>{title}</p><strong>{value}</strong></div>; }
function Status({status}) { return <span className={`status ${status}`}>{status}</span>; }
function Empty({text}) { return <div className="empty">{text}</div>; }
