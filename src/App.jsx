import { useState, useEffect, useRef, useCallback } from "react";
 
const MUSCLE_GROUPS = [
  { id: "abs", label: "Abs" },
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "legs", label: "Legs" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "fullbody", label: "Full Body" },
  { id: "cardio", label: "Cardio / Running" },
];
 
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
 
const NAV_ITEMS = [
  { id: "builder", label: "Exercises", icon: "🏋️" },
  { id: "planner", label: "Weekly Plan", icon: "📅" },
  { id: "workout", label: "Workout", icon: "▶️" },
];
 
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch { return initial; }
  });
  const set = useCallback((v) => {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key]);
  return [val, set];
}
 
function uid() { return Math.random().toString(36).slice(2, 10); }
 
function beep(type = "work") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = type === "work" ? 880 : type === "rest" ? 440 : 660;
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.4);
  } catch {}
}
 
function Tag({ label, color = "#e94560" }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}55`, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>;
}
 
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1a1a2e", border: "1px solid #e9456033", borderRadius: 16, padding: 28, maxWidth: 480, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
 
function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", color: "#aaa", fontSize: 12, marginBottom: 5, fontWeight: 600, letterSpacing: 0.5 }}>{label}</label>}
      <input {...props} style={{ width: "100%", background: "#0f0f23", border: "1px solid #333", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", ...(props.style || {}) }} />
    </div>
  );
}
 
function Btn({ children, onClick, variant = "primary", small = false, style = {} }) {
  const base = { border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: small ? 12 : 14, padding: small ? "6px 14px" : "11px 22px", transition: "all .15s", letterSpacing: 0.5, ...style };
  if (variant === "primary") return <button onClick={onClick} style={{ ...base, background: "linear-gradient(135deg,#e94560,#c0392b)", color: "#fff" }}>{children}</button>;
  if (variant === "ghost") return <button onClick={onClick} style={{ ...base, background: "transparent", color: "#e94560", border: "1px solid #e9456044" }}>{children}</button>;
  if (variant === "danger") return <button onClick={onClick} style={{ ...base, background: "#2a0a0a", color: "#e94560", border: "1px solid #e9456033" }}>{children}</button>;
  return <button onClick={onClick} style={{ ...base, background: "#1e1e3a", color: "#ccc", border: "1px solid #333" }}>{children}</button>;
}
 
function ExerciseCard({ ex, onDelete, onEdit }) {
  return (
    <div style={{ background: "#12122a", border: "1px solid #2a2a4a", borderRadius: 14, padding: 16, display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ width: 64, height: 64, borderRadius: 10, background: "#1e1e3a", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
        {ex.mediaUrl ? <img src={ex.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏋️"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: "#fff", fontSize: 15, marginBottom: 6 }}>{ex.name}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Tag label={`Work ${ex.workTime}s`} color="#e94560" />
          <Tag label={`Rest ${ex.restTime}s`} color="#4ecca3" />
          <Tag label={MUSCLE_GROUPS.find(m => m.id === ex.muscleGroup)?.label || ex.muscleGroup} color="#7c6fcd" />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Btn small variant="ghost" onClick={() => onEdit(ex)}>Edit</Btn>
        <Btn small variant="danger" onClick={() => onDelete(ex.id)}>Del</Btn>
      </div>
    </div>
  );
}
 
function ExerciseForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: "", muscleGroup: "abs", workTime: 30, restTime: 15, mediaUrl: "" });
  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, mediaUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <Input label="Exercise Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Plank Hold" />
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", color: "#aaa", fontSize: 12, marginBottom: 5, fontWeight: 600 }}>MUSCLE GROUP</label>
        <select value={form.muscleGroup} onChange={e => setForm(f => ({ ...f, muscleGroup: e.target.value }))} style={{ width: "100%", background: "#0f0f23", border: "1px solid #333", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 14 }}>
          {MUSCLE_GROUPS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Work Time (s)" type="number" min={5} max={300} value={form.workTime} onChange={e => setForm(f => ({ ...f, workTime: +e.target.value }))} />
        <Input label="Rest Time (s)" type="number" min={0} max={120} value={form.restTime} onChange={e => setForm(f => ({ ...f, restTime: +e.target.value }))} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", color: "#aaa", fontSize: 12, marginBottom: 5, fontWeight: 600 }}>MEDIA (GIF / IMAGE / VIDEO)</label>
        <label style={{ display: "flex", alignItems: "center", gap: 10, background: "#0f0f23", border: "1px dashed #e9456055", borderRadius: 8, padding: "12px 14px", cursor: "pointer" }}>
          <span style={{ color: "#e94560", fontSize: 20 }}>📁</span>
          <span style={{ color: "#888", fontSize: 13 }}>{form.mediaUrl ? "Media loaded ✓" : "Upload GIF, image, or video"}</span>
          <input type="file" accept="image/*,video/*,.gif" onChange={handleFile} style={{ display: "none" }} />
        </label>
        <div style={{ marginTop: 8 }}>
          <Input label="Or paste URL" value={form.mediaUrl} onChange={e => setForm(f => ({ ...f, mediaUrl: e.target.value }))} placeholder="https://..." />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={() => form.name.trim() && onSave(form)}>Save Exercise</Btn>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}
 
function BuilderPage({ exercises, setExercises }) {
  const [filterGroup, setFilterGroup] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const filtered = filterGroup === "all" ? exercises : exercises.filter(e => e.muscleGroup === filterGroup);
  const saveEx = (form) => {
    if (editTarget) setExercises(exercises.map(e => e.id === editTarget.id ? { ...form, id: e.id } : e));
    else setExercises([...exercises, { ...form, id: uid() }]);
    setShowForm(false); setEditTarget(null);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: "#fff", fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2 }}>EXERCISE LIBRARY</h2>
          <p style={{ margin: 0, color: "#666", fontSize: 13 }}>{exercises.length} exercises saved</p>
        </div>
        <Btn onClick={() => { setEditTarget(null); setShowForm(true); }}>+ New</Btn>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {["all", ...MUSCLE_GROUPS.map(m => m.id)].map(id => (
          <button key={id} onClick={() => setFilterGroup(id)} style={{ background: filterGroup === id ? "#e94560" : "#1e1e3a", color: filterGroup === id ? "#fff" : "#888", border: "none", borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {id === "all" ? "ALL" : MUSCLE_GROUPS.find(m => m.id === id)?.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#444", border: "1px dashed #2a2a4a", borderRadius: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏋️</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No exercises yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Create your first exercise to get started</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(ex => <ExerciseCard key={ex.id} ex={ex} onDelete={id => setExercises(exercises.filter(e => e.id !== id))} onEdit={e => { setEditTarget(e); setShowForm(true); }} />)}
        </div>
      )}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditTarget(null); }} title={editTarget ? "Edit Exercise" : "Create Exercise"}>
        <ExerciseForm initial={editTarget} onSave={saveEx} onCancel={() => { setShowForm(false); setEditTarget(null); }} />
      </Modal>
    </div>
  );
}
 
function PlannerPage({ exercises, programs, setPrograms }) {
  const [activeProgram, setActiveProgram] = useState(programs[0]?.id || null);
  const [showNewProgram, setShowNewProgram] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDays, setNewDays] = useState(5);
  const [showAddEx, setShowAddEx] = useState(null);
  const [filterMuscle, setFilterMuscle] = useState("all");
  const program = programs.find(p => p.id === activeProgram);
 
  const createProgram = () => {
    if (!newName.trim()) return;
    const prog = { id: uid(), name: newName, days: Array.from({ length: newDays }, (_, i) => ({ label: DAYS[i], exercises: [], isRest: false })) };
    setPrograms([...programs, prog]); setActiveProgram(prog.id); setShowNewProgram(false); setNewName(""); setNewDays(5);
  };
 
  const updateProgram = (updater) => setPrograms(programs.map(p => p.id === activeProgram ? updater(p) : p));
 
  const toggleRest = (i) => updateProgram(p => ({ ...p, days: p.days.map((d, j) => j === i ? { ...d, isRest: !d.isRest, exercises: [] } : d) }));
 
  const addExToDay = (dayIdx, exId) => {
    const ex = exercises.find(e => e.id === exId); if (!ex) return;
    updateProgram(p => ({ ...p, days: p.days.map((d, i) => i === dayIdx ? { ...d, exercises: [...d.exercises, ex] } : d) }));
  };
 
  const removeExFromDay = (dayIdx, exIdx) => updateProgram(p => ({ ...p, days: p.days.map((d, i) => i === dayIdx ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) } : d) }));
 
  const available = filterMuscle === "all" ? exercises : exercises.filter(e => e.muscleGroup === filterMuscle);
 
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "#fff", fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2 }}>WEEKLY PLANNER</h2>
        <Btn onClick={() => setShowNewProgram(true)}>+ Program</Btn>
      </div>
      {programs.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {programs.map(p => (
            <button key={p.id} onClick={() => setActiveProgram(p.id)} style={{ background: p.id === activeProgram ? "#e94560" : "#1e1e3a", color: p.id === activeProgram ? "#fff" : "#888", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{p.name}</button>
          ))}
        </div>
      )}
      {!program ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#444", border: "1px dashed #2a2a4a", borderRadius: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No programs yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {program.days.map((day, dayIdx) => (
            <div key={dayIdx} style={{ background: "#12122a", border: day.isRest ? "1px solid #222" : "1px solid #2a2a4a", borderRadius: 14, padding: 16, opacity: day.isRest ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: day.isRest ? 0 : 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ background: day.isRest ? "#333" : "#e9456033", color: day.isRest ? "#666" : "#e94560", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>{day.label}</div>
                  {day.isRest && <span style={{ color: "#666", fontSize: 13 }}>REST DAY</span>}
                  {!day.isRest && <span style={{ color: "#666", fontSize: 13 }}>{day.exercises.length} exercises</span>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {!day.isRest && <Btn small variant="ghost" onClick={() => setShowAddEx(dayIdx)}>+ Add</Btn>}
                  <Btn small variant="secondary" onClick={() => toggleRest(dayIdx)}>{day.isRest ? "Activate" : "Rest"}</Btn>
                </div>
              </div>
              {!day.isRest && day.exercises.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {day.exercises.map((ex, exIdx) => (
                    <div key={exIdx} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0f0f23", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 6, background: "#1e1e3a", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {ex.mediaUrl ? <img src={ex.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏋️"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#ddd", fontSize: 13, fontWeight: 600 }}>{ex.name}</div>
                        <div style={{ color: "#666", fontSize: 11 }}>{ex.workTime}s work / {ex.restTime}s rest</div>
                      </div>
                      <button onClick={() => removeExFromDay(dayIdx, exIdx)} style={{ background: "none", border: "none", color: "#e9456088", cursor: "pointer", fontSize: 18 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Modal open={showNewProgram} onClose={() => setShowNewProgram(false)} title="New Program">
        <Input label="Program Name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Summer Cut" />
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", color: "#aaa", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>TRAINING DAYS PER WEEK</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[4, 5, 6, 7].map(n => (
              <button key={n} onClick={() => setNewDays(n)} style={{ flex: 1, background: newDays === n ? "#e94560" : "#1e1e3a", color: newDays === n ? "#fff" : "#888", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, cursor: "pointer" }}>{n}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={createProgram}>Create</Btn>
          <Btn variant="secondary" onClick={() => setShowNewProgram(false)}>Cancel</Btn>
        </div>
      </Modal>
      <Modal open={showAddEx !== null} onClose={() => setShowAddEx(null)} title={`Add to ${showAddEx !== null ? program?.days[showAddEx]?.label : ""}`}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {["all", ...MUSCLE_GROUPS.map(m => m.id)].map(id => (
            <button key={id} onClick={() => setFilterMuscle(id)} style={{ background: filterMuscle === id ? "#e94560" : "#1e1e3a", color: filterMuscle === id ? "#fff" : "#888", border: "none", borderRadius: 16, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {id === "all" ? "ALL" : MUSCLE_GROUPS.find(m => m.id === id)?.label}
            </button>
          ))}
        </div>
        {available.length === 0 ? (
          <div style={{ color: "#666", textAlign: "center", padding: "30px 0" }}>No exercises found. Create some first!</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {available.map(ex => (
              <div key={ex.id} onClick={() => addExToDay(showAddEx, ex.id)} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0f0f23", borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}>
                <div style={{ width: 34, height: 34, borderRadius: 6, background: "#1e1e3a", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {ex.mediaUrl ? <img src={ex.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏋️"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#ddd", fontSize: 13, fontWeight: 600 }}>{ex.name}</div>
                  <div style={{ color: "#666", fontSize: 11 }}>{ex.workTime}s / {ex.restTime}s rest · {MUSCLE_GROUPS.find(m => m.id === ex.muscleGroup)?.label}</div>
                </div>
                <span style={{ color: "#e94560", fontSize: 22 }}>+</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
 
function WorkoutPage({ programs }) {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("work");
  const [exIdx, setExIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const intervalRef = useRef(null);
 
  const program = programs.find(p => p.id === selectedProgram);
  const day = program?.days[selectedDay];
  const exercises = day?.exercises || [];
  const currentEx = exercises[exIdx];
 
  const startWorkout = () => {
    if (!exercises.length) return;
    setExIdx(0); setPhase("work"); setTimeLeft(exercises[0].workTime); setTotalTime(exercises[0].workTime); setRunning(true); beep("work");
  };
 
  useEffect(() => {
    if (!running) return;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (phase === "work") {
            const ex = exercises[exIdx];
            if (ex.restTime > 0) { setPhase("rest"); setTotalTime(ex.restTime); beep("rest"); return ex.restTime; }
            else {
              const next = exIdx + 1;
              if (next < exercises.length) { setExIdx(next); setPhase("work"); setTotalTime(exercises[next].workTime); beep("work"); return exercises[next].workTime; }
              else { setPhase("done"); setRunning(false); beep("end"); clearInterval(intervalRef.current); return 0; }
            }
          } else {
            const next = exIdx + 1;
            if (next < exercises.length) { setExIdx(next); setPhase("work"); setTotalTime(exercises[next].workTime); beep("work"); return exercises[next].workTime; }
            else { setPhase("done"); setRunning(false); beep("end"); clearInterval(intervalRef.current); return 0; }
          }
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phase, exIdx, exercises]);
 
  const progressPct = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const circumference = 2 * Math.PI * 80;
  const strokeDash = circumference - (progressPct / 100) * circumference;
 
  return (
    <div>
      <h2 style={{ margin: "0 0 20px", color: "#fff", fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2 }}>WORKOUT MODE</h2>
 
      {!running && phase !== "done" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#aaa", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>SELECT PROGRAM</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {programs.map(p => (
                <button key={p.id} onClick={() => { setSelectedProgram(p.id); setSelectedDay(null); }} style={{ background: selectedProgram === p.id ? "#e94560" : "#1e1e3a", color: selectedProgram === p.id ? "#fff" : "#888", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{p.name}</button>
              ))}
              {programs.length === 0 && <span style={{ color: "#555", fontSize: 13 }}>No programs yet — create one in Weekly Plan</span>}
            </div>
          </div>
          {program && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#aaa", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>SELECT DAY</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {program.days.map((d, i) => (
                  <button key={i} onClick={() => !d.isRest && setSelectedDay(i)} style={{ background: selectedDay === i ? "#e94560" : d.isRest ? "#111" : "#1e1e3a", color: selectedDay === i ? "#fff" : d.isRest ? "#444" : "#888", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: d.isRest ? "not-allowed" : "pointer" }}>
                    {d.label}{d.isRest ? " 😴" : ` (${d.exercises.length})`}
                  </button>
                ))}
              </div>
            </div>
          )}
          {day && exercises.length > 0 && (
            <div style={{ background: "#12122a", borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <div style={{ color: "#aaa", fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: 1 }}>EXERCISE QUEUE ({exercises.length})</div>
              {exercises.map((ex, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < exercises.length - 1 ? "1px solid #1e1e3a" : "none" }}>
                  <span style={{ color: "#e94560", fontSize: 12, fontWeight: 700, minWidth: 20 }}>{i + 1}</span>
                  <span style={{ color: "#ddd", fontSize: 13, flex: 1 }}>{ex.name}</span>
                  <Tag label={`${ex.workTime}s`} color="#e94560" />
                  <Tag label={`${ex.restTime}s rest`} color="#4ecca3" />
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <Btn onClick={startWorkout}>▶ Start Workout</Btn>
              </div>
            </div>
          )}
          {day && exercises.length === 0 && <div style={{ color: "#555", textAlign: "center", padding: "30px 0" }}>This day has no exercises. Add some in the Planner!</div>}
        </>
      )}
 
      {(running || phase === "done") && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
          {phase === "done" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 60, marginBottom: 12 }}>🏆</div>
              <h3 style={{ color: "#4ecca3", fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, margin: 0, letterSpacing: 2 }}>WORKOUT COMPLETE!</h3>
              <p style={{ color: "#888", marginTop: 8 }}>You crushed {exercises.length} exercises</p>
              <Btn onClick={() => { setPhase("work"); setRunning(false); }} style={{ marginTop: 16 }}>Back to Selection</Btn>
            </div>
          ) : (
            <>
              <div style={{ position: "relative", marginBottom: 24 }}>
                <svg width={200} height={200} viewBox="0 0 200 200">
                  <circle cx={100} cy={100} r={80} fill="none" stroke="#1e1e3a" strokeWidth={12} />
                  <circle cx={100} cy={100} r={80} fill="none" stroke={phase === "work" ? "#e94560" : "#4ecca3"} strokeWidth={12} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDash} transform="rotate(-90 100 100)" style={{ transition: "stroke-dashoffset 1s linear" }} />
                  <text x={100} y={95} textAnchor="middle" fill="#fff" fontSize={42} fontWeight={700} fontFamily="monospace">{timeLeft}</text>
                  <text x={100} y={120} textAnchor="middle" fill={phase === "work" ? "#e94560" : "#4ecca3"} fontSize={14} fontWeight={700} letterSpacing={2}>{phase === "work" ? "WORK" : "REST"}</text>
                </svg>
              </div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>EXERCISE {exIdx + 1} / {exercises.length}</div>
                <div style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>{currentEx?.name}</div>
                {currentEx?.mediaUrl && (
                  <div style={{ width: 120, height: 90, borderRadius: 12, overflow: "hidden", margin: "12px auto" }}>
                    <img src={currentEx.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {exercises.map((_, i) => (
                  <div key={i} style={{ width: i === exIdx ? 20 : 8, height: 8, borderRadius: 4, background: i < exIdx ? "#4ecca3" : i === exIdx ? "#e94560" : "#2a2a4a", transition: "all .3s" }} />
                ))}
              </div>
              {exIdx + 1 < exercises.length && <div style={{ color: "#666", fontSize: 12 }}>Next: <span style={{ color: "#aaa" }}>{exercises[exIdx + 1]?.name}</span></div>}
              <Btn variant="secondary" onClick={() => { setRunning(false); clearInterval(intervalRef.current); }} style={{ marginTop: 20 }}>⏹ Stop</Btn>
            </>
          )}
        </div>
      )}
    </div>
  );
}
 
export default function App() {
  const [exercises, setExercises] = useLocalStorage("mfb_exercises", []);
  const [programs, setPrograms] = useLocalStorage("mfb_programs", []);
  const [page, setPage] = useState("builder");
 
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a", fontFamily: "'Rajdhani', sans-serif", color: "#fff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap');`}</style>
      <div style={{ background: "linear-gradient(to right,#0d0d1a,#1a0a14)", borderBottom: "1px solid #e9456022", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: "linear-gradient(135deg,#e94560,#c0392b)", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>M</div>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, lineHeight: 1 }}>MYFITNESS BUILDER</div>
          <div style={{ fontSize: 10, color: "#e94560", letterSpacing: 2, fontWeight: 700 }}>TRAIN YOUR WAY</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <div style={{ background: "#e9456018", border: "1px solid #e9456033", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: "#e94560", fontWeight: 700 }}>{exercises.length} EX</div>
          <div style={{ background: "#4ecca318", border: "1px solid #4ecca333", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: "#4ecca3", fontWeight: 700 }}>{programs.length} PROG</div>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 100px" }}>
        {page === "builder" && <BuilderPage exercises={exercises} setExercises={setExercises} />}
        {page === "planner" && <PlannerPage exercises={exercises} programs={programs} setPrograms={setPrograms} />}
        {page === "workout" && <WorkoutPage programs={programs} />}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0d0d1a", borderTop: "1px solid #1e1e3a", display: "flex" }}>
        {NAV_ITEMS.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{ flex: 1, padding: "12px 8px", background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", borderTop: page === n.id ? "2px solid #e94560" : "2px solid transparent" }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: page === n.id ? "#e94560" : "#555" }}>{n.label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
