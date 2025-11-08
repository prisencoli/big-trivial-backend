#!/usr/bin/env node
/*
  Importa domande/risposte da file JSON o CSV e le invia all'endpoint /quiz/admin/import

  USO:
    node backend/scripts/import-from-file.cjs <API_BASE> <PATH_FILE> <BATCH=500>

  FORMATI ACCETTATI:
  1) JSON (estensione .json): array di oggetti con chiavi:
     [
       {
         "categoryName": "The Simpsons",
         "questionText": "Chi è il padre di Bart?",
         "timerSeconds": 20,           // opzionale (default 20)
         "answers": [                  // 2..6 risposte; almeno una isCorrect=true
           { "text": "Homer", "isCorrect": true },
           { "text": "Ned Flanders", "isCorrect": false },
           ...
         ]
       }, ...
     ]

  2) CSV (estensione .csv): intestazione obbligatoria con colonne:
     categoryName,questionText,answerA,answerB,answerC,answerD,correct,timerSeconds
     - correct: A|B|C|D (indica quale risposta è corretta)
     - timerSeconds: opzionale

  Esempio CSV:
     The Simpsons,Chi è la madre di Lisa?,Marge,Mona,Patty,Selma,A,20
*/
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const API_BASE = process.argv[2] || 'http://localhost:3000';
const FILE_PATH = process.argv[3];
const BATCH_SIZE = Number(process.argv[4] || 500);

if (!FILE_PATH) {
  console.error('Specifica il file: node backend/scripts/import-from-file.cjs <API_BASE> <PATH_FILE> [BATCH]');
  process.exit(1);
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const req = lib.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(l=>l.trim().length>0);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map(h=>h.trim());
  const idx = (name) => header.indexOf(name);
  const q = [];
  for (let i=1;i<lines.length;i++) {
    const raw = lines[i];
    // gestione csv semplice senza virgole nelle celle; se servono casi complessi usa un parser dedicato
    const cols = raw.split(',');
    if (cols.length < 7) continue;
    const cat = cols[idx('categoryName')];
    const text = cols[idx('questionText')];
    const a = cols[idx('answerA')];
    const b = cols[idx('answerB')];
    const c = idx('answerC')>=0 ? cols[idx('answerC')] : undefined;
    const d = idx('answerD')>=0 ? cols[idx('answerD')] : undefined;
    const correct = (cols[idx('correct')] || 'A').trim().toUpperCase();
    const ts = idx('timerSeconds')>=0 && cols[idx('timerSeconds')] ? Number(cols[idx('timerSeconds')]) : 20;
    const answers = [];
    if (a) answers.push({ text: a, isCorrect: correct==='A' });
    if (b) answers.push({ text: b, isCorrect: correct==='B' });
    if (c) answers.push({ text: c, isCorrect: correct==='C' });
    if (d) answers.push({ text: d, isCorrect: correct==='D' });
    q.push({ categoryName: cat, questionText: text, timerSeconds: ts, answers });
  }
  return q;
}

function loadQuestions(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf8');
  if (ext === '.json') {
    const arr = JSON.parse(content);
    if (!Array.isArray(arr)) throw new Error('JSON non è un array');
    return arr;
  }
  if (ext === '.csv') {
    return parseCsv(content);
  }
  throw new Error('Estensione non supportata (usa .json o .csv)');
}

(async () => {
  console.log(`Leggo file: ${FILE_PATH}`);
  const questions = loadQuestions(FILE_PATH);
  console.log(`Domande trovate: ${questions.length}`);
  if (questions.length === 0) {
    console.error('Nessuna domanda da importare');
    process.exit(1);
  }

  // Raccogli categorie uniche dalle domande (primo batch)
  const categoryNames = [...new Set(questions.map(q => q.categoryName).filter(Boolean))];
  const categories = categoryNames.map(name => {
    // Colori predefiniti per categorie note
    const colors = {
      'The Simpsons': '#f5e25b',
      'Storia': '#ffe28a',
      'Geografia': '#8be2ff',
      'Scienza': '#aaffbe',
      'Arte': '#ff9ad2',
      'Sport': '#f68e8e',
      'Spettacolo': '#bfa6ff'
    };
    return { name, colorHex: colors[name] || '#cccccc' };
  });
  console.log(`Categorie trovate: ${categoryNames.join(', ')}`);

  // Prima crea le categorie (se non esistono già)
  if (categories.length > 0) {
    const catRes = await postJson(`${API_BASE}/quiz/admin/import`, { categories, questions: [] });
    console.log(`Categorie create/aggiornate:`, catRes);
  }

  // Funzione per randomizzare l'ordine delle risposte (Fisher-Yates shuffle)
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Randomizza l'ordine delle risposte per ogni domanda prima di importare
  const shuffledQuestions = questions.map(q => ({
    ...q,
    answers: shuffleArray(q.answers)
  }));

  // Poi importa le domande in batch
  for (let i = 0; i < shuffledQuestions.length; i += BATCH_SIZE) {
    const batch = shuffledQuestions.slice(i, i + BATCH_SIZE);
    const body = { categories: [], questions: batch };
    const res = await postJson(`${API_BASE}/quiz/admin/import`, body);
    console.log(`Batch ${i + 1}-${Math.min(i + BATCH_SIZE, shuffledQuestions.length)} →`, res);
  }
  console.log('Import completato');
})().catch(err => { console.error(err); process.exit(1); });
