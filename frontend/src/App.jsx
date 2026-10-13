import { useRef, useState } from 'react'
import './App.css'

const sample = `function buildReport(records) {\n  const valid = records.filter(validate);\n  const normalized = valid.map(normalize);\n  return aggregate(normalized);\n}\n\nfunction validate(record) { return Boolean(record.id); }\nfunction normalize(record) { return { ...record, name: record.name.trim() }; }\nfunction aggregate(records) { return records.length; }`

export default function App() {
  const input = useRef(null)
  const [file, setFile] = useState(null)
  const [source, setSource] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function choose(nextFile) {
    if (!nextFile) return
    setError(''); setResult(null)
    if (nextFile.size > 200_000) { setError('Choose a source file smaller than 200 KB.'); return }
    setFile(nextFile); setSource(await nextFile.text())
  }
  async function analyze() {
    if (!file) { setError('Choose a source file or load the sample first.'); return }
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ filename: file.name, source }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Analysis could not be completed.')
      setResult(data)
    } catch (err) { setError(`${err.message} Is the Python backend running on port 8000?`) }
    finally { setBusy(false) }
  }
  function loadSample() { setFile(new File([sample], 'report_builder.js', { type: 'text/javascript' })); setSource(sample); setResult(null); setError('') }
  function reset() { setFile(null); setSource(''); setResult(null); setError(''); if (input.current) input.current.value = '' }

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#top"><span className="brand-mark">r<span>↗</span></span><span>Reverse<span className="brand-light">Engineer</span><small>CODE EXPLORER</small></span></a><div className="side-label">WORKSPACE</div><div className="side-nav active">⌘ <span>New analysis</span></div><div className="sidebar-bottom"><div className="help-card"><b>Start with source code</b><p>Map functions, imports, and direct calls to explore how a program is structured.</p></div><div className="profile"><div className="avatar">R</div><div><b>ReverseEngineer</b><small>Code workspace</small></div></div></div></aside>
    <main id="top"><header className="topbar"><span>Workspace <i>/</i> <b>New analysis</b></span><span className="online"><i /> API analysis</span></header>
      <section className="intro"><div className="eyebrow">SOURCE CODE REVERSE ENGINEERING</div><h1>Understand how the code<br/><em>fits together.</em></h1><p>Inspect a source file to map functions, classes, imports, and direct call relationships. Your code is analyzed locally by the backend.</p></section>
      <div className="layout"><section className="content"><div className="drop-zone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); choose(e.dataTransfer.files[0]) }}><input ref={input} type="file" hidden accept=".js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.php,.rb" onChange={e => choose(e.target.files[0])}/><div className="upload-icon">↑</div><div className="drop-copy"><h2>Drop source code to inspect</h2><p>JavaScript, TypeScript, Python, Java, Go, Rust, PHP, Ruby</p></div><button className="button secondary" onClick={() => input.current?.click()}>Browse files</button><small>Single file · up to 200 KB · processed locally</small></div>
        {file && <div className="selected-file"><span>▤</span><b>{file.name}</b><small>{(file.size / 1024).toFixed(1)} KB</small><button onClick={reset} aria-label="Remove file">×</button></div>}
        <div className="actions"><button className="button primary" onClick={analyze} disabled={busy}>{busy ? 'Scanning source…' : '✳  Analyze code  →'}</button><button className="sample" onClick={loadSample}>Try sample ↗</button></div>
        {error && <div className="error">{error}</div>}
        {result && <section className="results"><div className="result-title"><div><small>STATIC ANALYSIS COMPLETE</small><h2>Code structure and possible paths</h2></div><button className="button secondary" onClick={reset}>＋ New analysis</button></div><p className="summary">{result.summary} <span>{result.analysis_type}</span></p><div className="result-grid"><div className="panel"><div className="panel-heading"><b>Detected call path</b><small>{result.language}</small></div><div className="flow">{result.hypotheses[0].steps.map((step, i) => <span key={`${step}-${i}`}>{i > 0 && <i>→</i>}{step}</span>)}</div><div className="subhead">DECLARATIONS AND IMPORTS <span>{result.components.length}</span></div><div className="chips">{result.components.map((item, i) => <span key={`${item}-${i}`}>{item}</span>)}</div>{result.calls.length > 0 && <><div className="subhead">DIRECT CALL RELATIONSHIPS <span>{result.calls.length}</span></div><div className="call-list">{result.calls.map((call, i) => <div key={i}><code>{call.from}</code><i>→</i><code>{call.to}</code></div>)}</div></>}</div><div className="panel"><div className="panel-heading"><b>Possible execution paths</b><small>Ranked scan estimates</small></div>{result.hypotheses.map(item => <div className="hypothesis" key={item.name}><div><b>{item.name}</b><strong>{item.confidence}%</strong></div><div className="meter"><i style={{ width: `${item.confidence}%` }}/></div><p>{item.description}</p></div>)}<div className="note">Static scan only. These estimates are not runtime traces.</div></div></div></section>}
      </section><aside className="right"><div className="guide"><b>From source to structure</b><div><i>01</i><p><b>Inspect declarations</b><small>Find functions and classes in the file.</small></p></div><div><i>02</i><p><b>Map relationships</b><small>Detect imports and direct function calls.</small></p></div><div><i>03</i><p><b>Review likely paths</b><small>Explore possible flows and limitations.</small></p></div></div><div className="aside-note">The scan reads source patterns only. It does not execute your code.</div></aside></div>
      <footer>ReverseEngineer · Source code structure explorer</footer>
    </main>
  </div>
}
