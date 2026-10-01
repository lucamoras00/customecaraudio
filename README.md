# Caorle Car Meet — sito iscrizioni

Sito responsive con tema scuro/neon, immagine hero fornita, scelta categoria e quote:
- Moto: €5
- Custom: €15
- Car Audio: €25
Evento: 20 febbraio 2027, Caorle
Email organizzatore: customecaraudioevents@gmail.com

## Avvio locale
1. Installare Node.js 18 o superiore.
2. Nella cartella del progetto eseguire `npm install`.
3. Copiare `.env.example` in `.env` e completare i parametri.
4. Eseguire `npm start` e aprire `http://localhost:3000`.

## Configurazione necessaria
- Credenziali API PayPal (iniziare con Sandbox; passare a Live solo dopo i test).
- SMTP per l'invio email.
- URL pubblico HTTPS in `PUBLIC_BASE_URL`.
- Compilare e far verificare l'informativa privacy.

## Nota importante per la pubblicazione
Il backend di esempio conserva le iscrizioni in memoria (`Map`) e perde i dati al riavvio; è adatto solo a test e dimostrazione. Prima dell'uso reale va sostituito con un database persistente, gestione sicura degli upload, protezione anti-abuso/rate limit, logging e gestione delle eccezioni. Per volumi di foto elevati è preferibile inviare un link privato alla foto invece di allegarla direttamente. La pagina statica da sola non può inviare email o verificare pagamenti: serve un backend sempre attivo. Non pubblicare mai il file `.env` o le credenziali.
