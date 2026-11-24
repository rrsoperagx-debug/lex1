# Centrum Dokumentów & AI w Panelu Prawnika
## Problem
Panel prawnika/operatora (LawyerDashboard) potrzebuje nowego widoku, który umożliwi:
1. **Procesowanie pism** – wklejanie/upload dokumentów i analiza AI (podsumowanie, ryzyka, kluczowe punkty)
2. **Generowanie dokumentów** – tworzenie pism prawnych z szablonów z pomocą AI
3. **Asystent prawny** – czat AI pomagający w rozwiązywaniu spraw prawnych
## Stan obecny
* `LawyerDashboard.tsx` (~3208 linii) – główny panel z nawigacją sidebar i widokami: sprawy, kalendarz, klienci, poczta, czat, baza pism
* Istnieje mały panel AI w widoku `case_detail` (prawy sidebar) – ograniczony do analizy jednego dokumentu
* Backend ma endpointy: `/ai/generate-stream`, `/ai/generate`, `/documents/generate`, `/legal-templates/`
* Frontend serwisy: `geminiService.ts`, `api.ts` (documentsApi, casesApi), `legalTemplateService.ts`
## Proponowane zmiany
### 1. Nowy komponent: `DocumentAICenter.tsx` (frontend/components/)
Samodzielny komponent z trzema zakładkami:
**Tab 1: Procesowanie Pism**
* Textarea do wklejenia tekstu dokumentu + opcja upload pliku
* Przycisk "Analizuj" – wysyła do `/ai/generate-stream` z promptem prawniczym
* Wyniki: podsumowanie, kluczowe elementy, ocena ryzyk, sugestie
* Historia przeanalizowanych dokumentów (w state)
**Tab 2: Generator Dokumentów**
* Lista szablonów z `legalTemplateService` (dropdown/karty)
* Formularz pól do wypełnienia (dynamicznie na podstawie szablonu)
* Opcja generowania treści AI ("Wygeneruj z AI" – np. na podstawie opisu sprawy)
* Podgląd wygenerowanego dokumentu + eksport
**Tab 3: Asystent Prawny**
* Pełny czat AI ze strumieniowaniem (SSE)
* Kontekst spraw z systemu (lista spraw do wyboru jako kontekst)
* Gotowe sugestie tematów (prawo rodzinne, cywilne, spadki, RODO, etc.)
* Historia konwersacji w sesji
### 2. Modyfikacja `LawyerDashboard.tsx`
* Dodanie `"ai_center"` do unii typów `activeView`
* Nowy NavItem w sidebarze: ikona `Bot` + label "Centrum AI"
* Renderowanie `<DocumentAICenter />` gdy `activeView === "ai_center"`
* Dodanie nazwy do headera
### 3. Backend – bez zmian
Istniejące endpointy są wystarczające. Prompt engineering odbywa się na frontendzie (kontekst prawniczy dodawany do promptu).