// =============================================================================
// LexPortal Frontend - Konfiguracja Tailwind CSS
// =============================================================================
//
// Ten plik konfiguracyjny zarządza frameworkiem Tailwind CSS.
// Definiuje on, gdzie szukać używanych klas CSS, jak rozszerzyć domyślny
// motyw (theme) i jakie wtyczki (plugins) są aktywne.
//
// Kluczowe Sekcje:
//   - darkMode: Ustawione na 'class', co pozwala na ręczne przełączanie
//               trybu ciemnego za pomocą klasy w drzewie DOM.
//   - content: Lista plików, które Tailwind skanuje w poszukiwaniu nazw
//              klas. Jest to kluczowe dla optymalizacji (tree-shaking)
//              i usuwania nieużywanego CSS z finalnego builda.
//   - theme.extend: Miejsce na dodawanie lub nadpisywanie domyślnych
//                   wartości Tailwind, np. własnej palety kolorów,
//                   fontów czy spacingu.
//
// =============================================================================
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Google Sans"',
          '"Google Sans Text"',
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
}

