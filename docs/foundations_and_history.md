# Podstawy AI Engineering System - Architektura i Historia

Ten dokument opisuje fundamenty techniczne i proces budowy aplikacji **AI SEO Auditor**, stanowiącej trzon systemu nauki AI Engineering.

## 1. Wizja Projektu
Celem było stworzenie narzędzia typu "AI-First", które automatyzuje pracę konsultanta SEO dla mikrofirm. Aplikacja nie tylko pobiera techniczne dane, ale używa LLM do interpretacji wyników i generowania rekomendacji biznesowych.

## 2. Architektura Backend (Node.js + Express)
Fundament backendu opiera się na trzech filarach:

### A. Crawlowanie i Scraping (Puppeteer)
Zintegrowano bezgłową przeglądarkę **Puppeteer**, aby:
- Pobierać zawartość stron renderowaną dynamicznie.
- Eksponować dane SEO: Tytuły, meta opisy, nagłówki (H1-H3).
- Analizować obrazy pod kątem brakujących atrybutów `alt`.
- Wykrywać dane strukturalne (**Schema.org**) w formacie JSON-LD, co jest kluczowe dla "zrozumienia" strony przez chatboty AI.

### B. Integracja z Wydajnością (Google PageSpeed Insights)
Aplikacja łączy się bezpośrednio z API Google PSI, aby pobierać rzeczywiste dane **Core Web Vitals**:
- **Score**: Ogólny wynik wydajności na mobile.
- **LCP (Largest Contentful Paint)**: Czas ładowania największego elementu.
- **CLS (Cumulative Layout Shift)**: Stabilność wizualna.

### C. Inteligencja Konsultanta (DeepSeek AI)
Kluczowym elementem "foundations" jest moduł analizy AI:
- Użycie modelu **DeepSeek-Chat** (przez interfejs OpenAI).
- Specjalnie zaprojektowany **System Prompt**, który ustawia AI w roli "Profesjonalnego AI Engineering Consultant".
- Generowanie raportu ROI w formacie Markdown na podstawie zebranych danych technicznych.

## 3. Frontend (React + Vite)
Interfejs użytkownika został zaprojektowany z naciskiem na przejrzystość i użyteczność:
- **Analiza w Czasie Rzeczywistym**: Formularz wysyłający URL do backendu.
- **Wizualizacja Danych**: Podział wyników na karty (Metadata, Social, Nagłówki, Obrazy, Zasoby).
- **AI Readiness**: Sekcja dedykowana danym Schema.org, podkreślająca ich znaczenie w erze AI.
- **Rendering Markdown**: Dynamiczne wyświetlanie raportu od AI Consultant.

## 4. Historia Rozwoju i Migracje
- **Inicjalizacja**: Budowa crawlera i podstawowego UI.
- **Integracja PSI**: Rozszerzenie audytu o dane o szybkości z Google.
- **Migracja na DeepSeek**: Zastąpienie/uzupełnienie modeli OpenAI modelem DeepSeek w celu optymalizacji kosztów i jakości analiz.
- **Git Sync**: Uruchomienie profesjonalnej kontroli wersji i repozytorium na GitHub.

---
*Dokument ten stanowi "pamięć operacyjną" dla systemu AI, definiującą dotychczasowy postęp w budowie narzędzi AI Engineering.*
