import { useState } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAiThinking(true)
    setError('')
    setData(null)

    try {
      const response = await axios.post('http://localhost:3001/api/analyze', { url })
      setData(response.data.data)
    } catch (err) {
      setError('Błąd podczas analizy strony. Upewnij się, że serwer backendowy działa.')
      console.error(err)
    } finally {
      setLoading(false)
      setAiThinking(false)
    }
  }

  return (
    <div className="App">
      <header className="header">
        <h1>/learn - AI SEO Auditor</h1>
        <p>Narzędzie dla konsultanta AI mikro-przedsiębiorstw</p>
      </header>

      <main className="container">
        <form onSubmit={handleAnalyze} className="form">
          <input
            type="url"
            placeholder="Wpisz URL strony (np. https://fryzjer-gliwice.pl)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="input"
          />
          <button type="submit" disabled={loading} className="button">
            {loading ? 'Analizowanie...' : 'Uruchom Audyt'}
          </button>
        </form>

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Pobieranie danych technicznych i SEO...</p>
            {aiThinking && <p className="ai-status">Sztuczna Inteligencja (DeepSeek) analizuje dane Twojego klienta...</p>}
          </div>
        )}

        {error && <p className="error">{error}</p>}

        {data && (
          <div className="results">
            {/* Raport AI Consultant na samej górze */}
            <div className="card consultant-report">
              <h2>🏢 Raport Konsultanta AI</h2>
              <div className="markdown-content">
                <ReactMarkdown>{data.aiConsultantReport}</ReactMarkdown>
              </div>
            </div>

            <div className="summary-bar">
              <div className={`status-badge s${data.status}`}>Status: {data.status}</div>
              <div className="time-badge">Czas ładowania: {data.loadTimeMs}ms</div>
            </div>

            <div className="grid">
              <div className="card">
                <h3>Metadata & SEO Basic</h3>
                <p><strong>Title:</strong> {data?.metadata?.title || 'Brak'}</p>
                <p><strong>Description:</strong> {data?.metadata?.description || 'Brak!'}</p>
                <p><strong>Canonical:</strong> {data?.metadata?.canonical || 'Brak!'}</p>
                <p><strong>Robots:</strong> {data?.metadata?.robots || 'Brak!'}</p>
              </div>

              <div className="card">
                <h3>Social Media (Open Graph)</h3>
                <p><strong>OG Title:</strong> {data?.social?.ogTitle || 'Brak!'}</p>
                <p><strong>OG Image:</strong> {data?.social?.ogImage ? 'Jest (widoczne dla sociala)' : 'Brak!'}</p>
                <p><strong>Twitter Card:</strong> {data?.social?.twitterCard || 'Brak!'}</p>
              </div>

              <div className="card">
                <h3>Hierarchia Nagłówków</h3>
                <p><strong>H1:</strong> {data?.headings?.h1?.join(', ') || <span className="warning">BRAK H1!</span>}</p>
                <p><strong>H2:</strong> {data?.headings?.h2?.length || 0} sztuk</p>
                <p><strong>H3:</strong> {data?.headings?.h3?.length || 0} sztuk</p>
              </div>

              <div className="card">
                <h3>Analiza Obrazów</h3>
                <p>Wszystkich: {data?.images?.total || 0}</p>
                <p className={data?.images?.missingAlt > 0 ? 'warning' : ''}>
                  Brakujące ALT: {data?.images?.missingAlt || 0}
                </p>
              </div>

              <div className="card">
                <h3>Struktura Linków</h3>
                <p>Wszystkich: {data?.links?.total || 0}</p>
                <p>Wewnętrzne: {data?.links?.internal || 0}</p>
                <p>Zewnętrzne: {data?.links?.external || 0}</p>
              </div>

              <div className="card">
                <h3>Zasoby strony</h3>
                <p>Skrypty (JS): {data?.scripts || 0}</p>
                <p>Style (CSS): {data?.styles || 0}</p>
              </div>

              <div className="card ai-card">
                <h3>AI Readiness: Structured Data</h3>
                {data?.structuredData?.total > 0 ? (
                  <>
                    <p className="success">✅ Wykryto dane strukturalne</p>
                    <ul className="schema-list">
                      {data?.structuredData?.found?.map((item, i) => (
                        <li key={i}>{item.type}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="warning">❌ Brak danych Schema.org. Strona nieczytelna dla AI.</p>
                )}
                <small>To jest "język", którym audytuj strony pod chatboty.</small>
              </div>

              <div className="card psi-card">
                <h3>Core Web Vitals & Performance</h3>
                {data?.psi ? (
                  <>
                    <div className="score-main">
                      <span className={`score-value ${data.psi.score >= 90 ? 'high' : data.psi.score >= 50 ? 'med' : 'low'}`}>
                        {Math.round(data.psi.score)}
                      </span>
                      <p>Performance Score (Mobile)</p>
                    </div>
                    <div className="metrics-grid">
                      <p><strong>LCP:</strong> {data.psi.metrics.lcp}</p>
                      <p><strong>CLS:</strong> {data.psi.metrics.cls}</p>
                      <p><strong>INP:</strong> {data.psi.metrics.inp}</p>
                      <p><strong>FCP:</strong> {data.psi.metrics.fcp}</p>
                    </div>
                  </>
                ) : (
                  <p className="warning">Brak danych PageSpeed Insights. Sprawdź klucz API.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
