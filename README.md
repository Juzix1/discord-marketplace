# Discord Marketplace — Render deployment

Instrukcje szybkiego wdrożenia na Render (Python web service):

- Ustaw w Render:
  - `DISCORD_TOKEN` — token bota Discord
  - `DISCORD_CHANNEL_ID` — ID kanału, z którego pobierane są wiadomości
  - (opcjonalnie) `FETCH_SECRET` — tajny token do ochrony endpointu `/fetch`

- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app`

Jak działa:
- Aplikacja `app.py` serwuje statyczne pliki (`index.html`, `script.js`, `styles.css`) oraz `offers.json`.
- Aby zaktualizować `offers.json`, ustaw Render Cron (Scheduled Job) aby robił POST/GET do:
  `https://<your-service>.onrender.com/fetch?secret=YOUR_SECRET` (jeśli ustawisz `FETCH_SECRET`).
- Alternatywnie możesz dodać background worker, który wywołuje `scripts/fetch_messages.fetch_once()` cyklicznie.

Test lokalny:

1. Zainstaluj zależności:
```
python -m pip install -r requirements.txt
```
2. Wyeksportuj zmienne środowiskowe (Linux/macOS):
```
export DISCORD_TOKEN=your_token
export DISCORD_CHANNEL_ID=123456789012345678
export FETCH_SECRET=some-secret   # opcjonalnie
```
3. Uruchom lokalnie:
```
gunicorn app:app
```
4. Ręcznie zaktualizuj oferty (lokalnie):
```
curl "http://127.0.0.1:8000/fetch?secret=some-secret"
```

Uwaga:
- System plików na Render jest ephemeral — żeby mieć regularne aktualizacje, skonfiguruj Render Cron, który będzie wywoływał endpoint `/fetch` co godzinę.
- Plik `offers.json` zapisywany jest w katalogu aplikacji i będzie dostępny dla serwowanej strony.
