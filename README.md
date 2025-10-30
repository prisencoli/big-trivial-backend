# LiberMania - Backend

NestJS + TypeScript

## Sviluppo rapido

- Installa le dipendenze: `npm install`
- Avvia in dev: `npm run start:dev`

---

## API principali disponibili (mock/demo)
- POST `/books/my-collection`  — Aggiungi libro personale
- PUT `/books/my-collection/:id`  — Cambia stato (in offerta/ritira)
- GET `/books/my-collection`  — Lista libri utente
- DELETE `/books/my-collection/:id`  — Cancella
- GET `/books/available`  — Lista globali disponibili
- GET `/books/isbn/:isbn`  — Cerca ISBN su Google Books
- GET `/books/config/affiliate` — Codice affiliato Amazon (globale)

---

### Esempio di flow:
1. Chiamata POST `/books/my-collection` con ISBN/descrizione ➔ conferma e crediti bonus
2. Subito o dopo: PUT `/books/my-collection/:id` con status `AVAILABLE` ➔ libro pubblicato
3. Lato frontend compare tra “I miei libri”, subito pronto per browsing, offerte, gestione

> Pronto per essere convertito in DB e collegato al sistema auth JWT.
