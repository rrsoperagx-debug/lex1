# Role: Klient (Zleceniodawca)

Ten dokument opisuje przepływ pracy i interakcje klienta w systemie LexPortal.

## Przepływ Informacji Klienta

```mermaid
graph TD
    A[Rejestracja/Logowanie] --> B[Dashboard Klienta]
    B --> C[Generator Dokumentów - Wizard]
    B --> D[Przesyłanie Dokumentów]
    B --> E[Bezpieczny Czat]
    
    C --> F[Podgląd i Pobieranie PDF]
    F --> B
    
    E --> G[Konsultacja z Operatorem]
    G --> B
    
    D --> H[Analiza AI dokumentu]
    H --> B
```

## Odpowiedzialności i Możliwości Klienta

- **Samodzielne Tworzenie Dokumentów**: Korzystanie z inteligentnych formularzy do generowania umów.
- **Zasoby Sprawy**: Przechowywanie i zarządzanie własnymi dokumentami w chmurze (integracja z Google Drive).
- **Bezpieczeństwo**: Komunikacja z prawnikami w chronionym środowisku bez konieczności używania zewnętrznych komunikatorów.

## Przykładowy Scenariusz: Generowanie Umowy

1. Klient przechodzi do sekcji "Kreator Dokumentów".
2. Wypełnia formularz (np. Umowa o dzieło).
3. System generuje podgląd na żywo z uwzględnieniem klauzul RODO i kar umownych.
4. Klient pobiera gotowy plik PDF lub wysyła go do weryfikacji przez operatora.
