# Role: Operator (Prawnik/Operator)

Ten dokument opisuje przepływ pracy i system komunikacji z perspektywy Operatora w systemie LexPortal.

## Przepływ Informacji Operatora

```mermaid
graph TD
    A[Logowanie Operatora] --> B[Dashboard Operatora]
    B --> C{Zadania}
    C --> D[Przegląd Spraw i Dokumentów]
    C --> E[AI Analiza Dokumentów]
    C --> F[Bezpieczny Czat z Klientem]
    
    E --> G[Raport Ryzyk AI]
    G --> B
    
    F --> H[Wymiana Wiadomości E2E]
    H --> I[Ustalenia ze Zleceniodawcą]
    I --> B
```

## Odpowiedzialności Operatora

- **Zarządzanie Sprawami**: Przeglądanie i aktualizacja statusów spraw przypisanych do operatora.
- **Weryfikacja Dokumentów**: Wykorzystywanie silnika AI do automatycznej analizy ryzyk w dokumentach przesłanych przez klientów.
- **Komunikacja**: Bezpośredni, szyfrowany kontakt z klientem w celu wyjaśnienia szczegółów prawnych.

## Przykładowy Scenariusz: Konsultacja Sprawy

1. Operator loguje się do systemu.
2. Wybiera nową sprawę z list zadań.
3. Analizuje przesłaną umowę za pomocą narzędzia AI.
4. Przesyła uwagi do klienta za pomocą "Bezpiecznego Czatu".
5. Klient akceptuje zmiany lub przesyła nową wersję dokumentu.
