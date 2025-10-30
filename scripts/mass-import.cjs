#!/usr/bin/env node
/*
  Usage:
    node backend/scripts/mass-import.cjs <API_BASE> <Q_PER_CAT=1000> <BATCH=500> <FILTER_NAMES="Name1,Name2"> 
  Notes:
    - Genera QUESTIONS_PER_CATEGORY domande per ciascuna categoria (o solo per quelle filtrate)
    - Invia in batch a /quiz/admin/import
*/
const https = require('https');
const http = require('http');

const API_BASE = process.argv[2] || 'http://localhost:3000';
const QUESTIONS_PER_CATEGORY = Number(process.argv[3] || 1000);
const BATCH_SIZE = Number(process.argv[4] || 500);
const FILTER = (process.argv[5] || '').split(',').map(s=>s.trim()).filter(Boolean);

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
  });
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

function buildQuestion(categoryName, i) {
  const q = {
    categoryName,
    questionText: `Q${i} ${categoryName}: quale opzione è corretta?`,
    timerSeconds: 20,
    answers: [
      { text: `Opzione A per ${categoryName} ${i}`, isCorrect: i % 4 === 0 },
      { text: `Opzione B per ${categoryName} ${i}`, isCorrect: i % 4 === 1 },
      { text: `Opzione C per ${categoryName} ${i}`, isCorrect: i % 4 === 2 },
      { text: `Opzione D per ${categoryName} ${i}`, isCorrect: i % 4 === 3 }
    ]
  };
  return q;
}

(async () => {
  console.log(`Leggo categorie da ${API_BASE}/quiz/categories ...`);
  let cats = await fetchJson(`${API_BASE}/quiz/categories`);
  if (!Array.isArray(cats) || cats.length === 0) {
    console.error('Nessuna categoria disponibile. Assicurati di aver eseguito il seed.');
    process.exit(1);
  }
  if (FILTER.length) {
    cats = cats.filter(c => FILTER.includes(c.name));
    if (cats.length === 0) {
      console.error('Nessuna categoria corrisponde al filtro:', FILTER.join(', '));
      process.exit(1);
    }
  }
  console.log(`Categorie target: ${cats.map(c=>c.name).join(', ')}`);

  let total = 0;
  for (const c of cats) {
    console.log(`\nCategoria: ${c.name} → genero ${QUESTIONS_PER_CATEGORY} domande`);
    const payloadQuestions = Array.from({ length: QUESTIONS_PER_CATEGORY }, (_, idx) => buildQuestion(c.name, idx + 1));

    for (let i = 0; i < payloadQuestions.length; i += BATCH_SIZE) {
      const batch = payloadQuestions.slice(i, i + BATCH_SIZE);
      const body = { categories: [], questions: batch };
      const res = await postJson(`${API_BASE}/quiz/admin/import`, body);
      console.log(`Batch ${i + 1}-${Math.min(i + BATCH_SIZE, payloadQuestions.length)} →`, res);
    }
    total += payloadQuestions.length;
  }
  console.log(`\nCompletato. Domande create (richieste inviate): ~${total}`);
})().catch(err => { console.error(err); process.exit(1); });
