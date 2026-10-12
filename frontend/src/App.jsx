import { useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const navigation = [
  ["▦", "Overview"], ["⌘", "Static analysis", "02"], ["▷", "Dynamic runs"],
  ["⌕", "String explorer"], ["⌗", "Disassembly"], ["▤", "Recent samples"], ["◈", "Signatures"],
];
const samples = [
  { name: "router_firmware_v2.8.1.bin", format: "ELF · ARM", hash: "9f2a…c71e", status: "Analyzed", tone: "good" },
  { name: "update_service.exe", format: "PE · x64", hash: "b813…02ad", status: "Review", tone: "warn" },
  { name: "libcrypto_custom.so", format: "ELF · x64", hash: "51de…a990", status: "Analyzed", tone: "good" },
  { name: "boot_stage2.img", format: "RAW · ARM", hash: "0cc4…81f2", status: "Queued", tone: "" },
];

function CardTitle({ children, tag, action }) {
  return <div className="card-head"><h2>{children}</h2>{action || (tag && <span className="tag">{tag}</span>)}</div>;
}

export default function App() {
  const inputRef = useRef(null);
  const [active, setActive] = useState("Overview");
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState("");

  function notify(message) {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(""), 2800);
  }

  async function analyzeFile(selectedFile) {
    if (!selectedFile) return;
    setFile(selectedFile);
    setAnalysis(null);
    setBusy(true);
    const form = new FormData();
    form.append("file", selectedFile);
    try {
      const response = await fetch(`${API_URL}/api/analyze`, { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || `Request failed (${response.status})`);
      setAnalysis(body);
      notify("Static analysis complete.");
    } catch (error) {
      notify(`Could not analyze file: ${error.message}. Is the backend running?`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    analyzeFile(event.dataTransfer.files?.[0]);
  }

  const profile = analysis || {
    architecture: "ARM · 32-bit", endianness: "Little-endian", format: "ELF",
    entropy: 6.42, sha256: "9f2a…c71e", size_bytes: 8.4 * 1024 * 1024,
  };
  const displayedSamples = analysis
    ? [{ name: analysis.filename, format: `${analysis.format} · ${analysis.architecture}`, hash: `${analysis.sha256.slice(0, 4)}…${analysis.sha256.slice(-4)}`, status: "Analyzed", tone: "good" }, ...samples.slice(1)]
    : samples;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="mark">R</div><div className="brandtext">RE//LAB<small>ANALYSIS WORKSPACE</small></div></div>
        <div className="section-label">WORKSPACE</div>
        {navigation.slice(0, 5).map(([icon, label, badge]) => <button key={label} className={`nav ${active === label ? "active" : ""}`} onClick={() => { setActive(label); if (label !== "Overview") notify(`${label} view selected.`); }}><span className="ico">{icon}</span><span className="navtext">{label}</span>{badge && <span className="badge">{badge}</span>}</button>)}
        <div className="section-label">LIBRARY</div>
        {navigation.slice(5).map(([icon, label]) => <button key={label} className={`nav ${active === label ? "active" : ""}`} onClick={() => { setActive(label); notify(`${label} view selected.`); }}><span className="ico">{icon}</span><span className="navtext">{label}</span></button>)}
        <div className="section-label">CURRENT PROJECT</div>
        <div className="project"><strong>firmware-audit-07</strong><span>3 samples · updated 4m ago</span></div>
        <div className="online"><span className="dot" />LOCAL SANDBOX READY</div>
      </aside>

      <main className="main">
        <header className="top"><div className="crumb">workspace&nbsp; / &nbsp;<b>{active.toLowerCase()}</b></div><div className="topright"><span>⌘ K</span><span>DOCS</span><div className="avatar">A</div></div></header>
        <section className="content">
          <div className="heading"><div><div className="eyebrow">REVERSE ENGINEERING / PROJECT 07</div><h1>Analysis overview</h1><p>Inspect binaries, map behavior, and document what you find.</p></div><div className="actions"><button className="btn" onClick={() => notify("New project setup is ready to connect.")}>＋ New project</button><button className="btn primary" onClick={() => inputRef.current?.click()}>{busy ? "Analyzing…" : "↑  Analyze a file"}</button></div></div>

          <div className="stats"><div className="stat"><label>SAMPLES ANALYZED</label><strong>{analysis ? "25" : "24"}</strong><small>+3 this week</small></div><div className="stat"><label>FUNCTIONS IDENTIFIED</label><strong>1,386</strong><small>across 8 binaries</small></div><div className="stat"><label>OPEN FINDINGS</label><strong>07</strong><small className="orange">2 need review</small></div><div className="stat"><label>LAST ANALYSIS</label><strong className="last-analysis">{analysis ? "Just now" : "4 min ago"}</strong><small>{profile.format} · {profile.architecture}</small></div></div>

          <div className="workspace-grid">
            <section className="card"><CardTitle tag="STATIC TRIAGE">▶ &nbsp;NEW ANALYSIS</CardTitle>
              <div className={`upload ${dragging ? "drag" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} role="button" tabIndex="0" onKeyDown={e => e.key === "Enter" && inputRef.current?.click()}>
                <div className="upicon">⇧</div><strong>{busy ? "Analyzing file…" : "Drop a binary to start an analysis"}</strong><span>or <u>browse files</u> · ELF, PE, Mach-O, firmware images</span>
                <input ref={inputRef} type="file" onChange={e => analyzeFile(e.target.files?.[0])} />
              </div>
              {file && <div className="file-row"><div className="file-icon">{file.name.split(".").pop().slice(0, 4).toUpperCase()}</div><div className="file-info"><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB · {analysis ? `SHA256 ${analysis.sha256.slice(0, 4)}…${analysis.sha256.slice(-4)}` : "submitted for analysis"}</span></div><span className={`status ${busy ? "working" : ""}`}>{busy ? "RUNNING" : analysis ? "ANALYZED" : "READY"}</span></div>}
              {analysis && <div className="results"><div className="results-title">ANALYSIS RESULT <span className="tag">STATIC</span></div><p>{analysis.analysis_note}</p><div className="string-list"><strong>PRINTABLE STRINGS ({analysis.printable_strings.length})</strong>{analysis.printable_strings.slice(0, 8).map((text, index) => <code key={`${index}-${text}`}>{text}</code>)}</div></div>}
              <CardTitle action={<button className="btn compact" onClick={() => notify("Sample library view selected.")}>View all ↗</button>}>RECENT SAMPLES</CardTitle>
              <div className="table-wrap"><table className="sample-table"><thead><tr><th>FILE</th><th>FORMAT</th><th>SHA256</th><th>STATUS</th></tr></thead><tbody>{displayedSamples.map((sample, i) => <tr key={`${sample.name}-${i}`}><td>{sample.name}</td><td><span className="pill">{sample.format}</span></td><td className="hash">{sample.hash}</td><td><span className={`pill ${sample.tone}`}>{sample.status}</span></td></tr>)}</tbody></table></div>
            </section>

            <div className="rightcol">
              <section className="card"><CardTitle tag="3 / 4 COMPLETE">ANALYSIS PIPELINE</CardTitle><div className="pipeline"><PipelineStep done number="✓" title="File identification" detail="FORMAT · ARCH · ENDIANNESS" time="0.2s"/><PipelineStep done number="✓" title="Static analysis" detail="SECTIONS · IMPORTS · STRINGS" time="1.8s"/><PipelineStep current number="3" title="Function recovery" detail="CONTROL FLOW · SYMBOLS" time={busy ? "RUNNING" : "READY"}/><PipelineStep number="4" title="Behavior report" detail="SUMMARY · FINDINGS" time="WAITING"/></div></section>
              <section className="card"><CardTitle tag="SAMPLE">FILE PROFILE</CardTitle><div className="quick"><ProfileRow label="Format" value={profile.format}/><ProfileRow label="Architecture" value={profile.architecture}/><ProfileRow label="Endianness" value={profile.endianness}/><ProfileRow label="File size" value={`${(profile.size_bytes / 1024 / 1024).toFixed(2)} MB`}/><ProfileRow label="Entropy" value={`${profile.entropy} / 8.0`}/><ProfileRow label="SHA-256" value={profile.sha256.length > 22 ? `${profile.sha256.slice(0, 8)}…${profile.sha256.slice(-6)}` : profile.sha256}/></div></section>
            </div>
          </div>
          <footer className="footer"><span>RE//LAB · LOCAL ANALYSIS ENVIRONMENT</span><span>ENGINE V0.9.4 · <b>● ALL SYSTEMS OPERATIONAL</b></span></footer>
        </section>
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function PipelineStep({ done = false, current = false, number, title, detail, time }) {
  return <div className={`step ${done ? "done" : ""} ${current ? "current" : ""}`}><div className="stepnum">{number}</div><div className="steptext"><strong>{title}</strong><small>{detail}</small></div><time>{time}</time></div>;
}
function ProfileRow({ label, value }) {
  return <div className="quickrow"><span>{label}</span><code>{value}</code></div>;
}
