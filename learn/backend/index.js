const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const getPageSpeedData = async (url) => {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    if (!apiKey) return null;
    
    try {
        const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile`);
        const data = await response.json();
        
        const lh = data.lighthouseResult;
        return {
            score: lh.categories.performance.score * 100,
            metrics: {
                lcp: lh.audits['largest-contentful-paint'].displayValue,
                cls: lh.audits['cumulative-layout-shift'].displayValue,
                inp: lh.audits['interactive']?.displayValue || 'N/A',
                fcp: lh.audits['first-contentful-paint'].displayValue
            }
        };
    } catch (error) {
        console.error('PSI API Error:', error);
        return null;
    }
};

const getAIAnalysis = async (auditData) => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return "Brak klucza API dla AI. Skonfiguruj DEEPSEEK_API_KEY.";

    const client = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://api.deepseek.com"
    });

    try {
        const response = await client.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system", 
                    content: "Jesteś profesjonalnym AI Engineering Consultant dla mikrofirm. Twoim celem jest analiza technicznych danych audytu SEO i Schema.org oraz sformułowanie 3 konkretnych rekomendacji, które przyniosą klientowi zysk (ROI). Używaj języka korzyści, bądź profesjonalny i konkretny. Formatuj odpowiedź w Markdown."
                },
                {
                    role: "user", 
                    content: `Przeanalizuj poniższe dane audytu dla strony ${auditData.metadata.title}: 
                    - Szybkość (Score): ${auditData.psi?.score || 'N/A'}
                    - Wynik LCP: ${auditData.psi?.metrics?.lcp || 'N/A'}
                    - Dane Strukturalne (Schema): ${auditData.structuredData.total > 0 ? 'Wykryto' : 'BRAK!'}
                    - Nagłówki H1: ${auditData.headings.h1.length}
                    - Brakujące ALTy obrazów: ${auditData.images.missingAlt}
                    
                    Przygotuj krótki raport konsultanta.`
                }
            ]
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error('DeepSeek Error:', error);
        return "Niestety nie udało się wygenerować analizy AI w tej chwili.";
    }
};

app.post('/api/analyze', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const startTime = Date.now();

    try {
        const [browser, psiData] = await Promise.all([
            puppeteer.launch({ 
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }),
            getPageSpeedData(url)
        ]);

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        const loadTime = Date.now() - startTime;

        const crawlerData = await page.evaluate((baseUrl) => {
            const images = Array.from(document.querySelectorAll('img'));
            const links = Array.from(document.querySelectorAll('a'));
            const internalLinks = links.filter(link => link.href.startsWith(baseUrl));
            const externalLinks = links.filter(link => !link.href.startsWith(baseUrl) && link.href.startsWith('http'));

            const getMeta = (name) => document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.content || '';

            return {
                metadata: {
                    title: document.title,
                    description: getMeta('description'),
                    canonical: document.querySelector('link[rel="canonical"]')?.href || '',
                    robots: getMeta('robots')
                },
                social: {
                    ogTitle: getMeta('og:title'),
                    ogDescription: getMeta('og:description'),
                    ogImage: getMeta('og:image'),
                    twitterCard: getMeta('twitter:card')
                },
                headings: {
                    h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim()),
                    h2: Array.from(document.querySelectorAll('h2')).map(h => h.innerText.trim()),
                    h3: Array.from(document.querySelectorAll('h3')).map(h => h.innerText.trim())
                },
                images: {
                    total: images.length,
                    missingAlt: images.filter(img => !img.alt || img.alt.trim() === '').length
                },
                links: {
                    total: links.length,
                    internal: internalLinks.length,
                    external: externalLinks.length
                },
                structuredData: {
                    total: document.querySelectorAll('script[type="application/ld+json"]').length,
                    found: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(script => {
                        try {
                            const data = JSON.parse(script.textContent);
                            return { type: data['@type'] || 'Niesprecyzowany' };
                        } catch (e) {
                            return { type: 'Błąd składni JSON' };
                        }
                    })
                },
                scripts: document.querySelectorAll('script').length,
                styles: document.querySelectorAll('link[rel="stylesheet"]').length
            };
        }, new URL(url).origin);

        crawlerData.status = response.status();
        crawlerData.loadTimeMs = loadTime;
        crawlerData.psi = psiData;

        // AI Analysis
        crawlerData.aiConsultantReport = await getAIAnalysis(crawlerData);

        await browser.close();
        res.json({ success: true, data: crawlerData });
    } catch (error) {
        console.error('Audit Error:', error);
        res.status(500).json({ error: 'Failed to analyze page: ' + error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', domain: 'Micro-biz AI Consultant' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
