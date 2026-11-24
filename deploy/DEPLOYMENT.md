# LexPortal - Instrukcja Wdrożenia Produkcyjnego

Ten folder zawiera konfigurację niezbędną do uruchomienia systemu LexPortal w środowisku produkcyjnym (VPS, AWS, DigitalOcean).

## Wymagania

- Docker i Docker Compose (V2+)
- Zarejestrowana domena i skonfigurowane rekordy DNS (A/AAAA)
- Klucze API (Gemini, Mollie)

## Szybki Start (Deploy)

1. **Przygotuj zmienne środowiskowe**:
   W folderze głównym projektu:

   ```bash
   cp deploy/.env.prod.example .env.prod
   nano .env.prod  # Wpisz prawdziwe hasła i klucze
   ```

2. **Zbuduj i uruchom kontenery**:

   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
   ```

3. **Wykonaj migracje bazy danych**:
   Aplikacja automatycznie wykonuje migracje przy starcie (skrypt `start.py`), ale możesz to zrobić ręcznie:

   ```bash
   docker exec -it lexportal_backend_prod alembic upgrade head
   ```

## Bezpieczeństwo (Security Checklist)

- [ ] Zmień domyślne hasło do bazy danych w `.env.prod`.
- [ ] Upewnij się, że `DEBUG` jest ustawione na `False`.
- [ ] Skonfiguruj SSL (zalecane użycie Certbot/Let's Encrypt na hoście lub jako sidecar).
- [ ] Sprawdź limity zasobów w `docker-compose.prod.yml` pod kątem specyfikacji Twojego serwera.

## Monitoring

Logi są dostępne za pomocą standardowych komend dockera:

```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```

## Kopie Zapasowe (Backups)

Dane bazy danych znajdują się w wolumenie `postgres_prod_data`. Zaleca się regularne wykonywanie zrzutów bazy:

```bash
docker exec lexportal_db_prod pg_dump -U lexadmin lexportal_prod > backup_$(date +%F).sql
```
