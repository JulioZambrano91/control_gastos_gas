const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const USE_MOCK = process.env.USE_MOCK === 'true' || process.argv.includes('--mock');

// Solo cargamos Prisma si NO estamos en modo Mock
let prisma = null;
if (!USE_MOCK) {
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  } catch (e) {
    console.warn('Prisma not initialized, falling back to MOCK mode.');
  }
}

// Mock-only storage
let mockExpenses = [];
let mockRates = [];
let mockCards = [];
let mockDebts = [];

const app = express();
app.use(cors());
app.use(express.json());

const BCV_URL = 'https://www.bcv.org.ve/';

// Helper function to fetch BCV rate
async function fetchBCVRate() {
  try {
    const { data } = await axios.get(BCV_URL);
    const usdIndex = data.indexOf('USD');
    if (usdIndex === -1) return 36.50;
    
    const strongStart = data.indexOf('<strong>', usdIndex) + 8;
    const strongEnd = data.indexOf('</strong>', strongStart);
    let rateStr = data.substring(strongStart, strongEnd).trim();
    
    const cleanRate = rateStr.replace(/\./g, "").replace(",", ".");
    return parseFloat(cleanRate);
  } catch (error) {
    console.error('Error fetching BCV rate:', error);
    return 450.00; // Tasa por defecto solicitada
  }
}

// Route to get or update daily rate
app.get('/api/rate', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  let rate;
  if (USE_MOCK) {
    rate = mockRates.find(r => r.date === todayStr);
  } else {
    rate = await prisma.exchangeRate.findFirst({ where: { date: today } });
  }

  if (!rate) {
    const newRateValue = await fetchBCVRate();
    if (newRateValue) {
      if (USE_MOCK) {
        rate = { id: Date.now(), date: todayStr, rate: newRateValue };
        mockRates.push(rate);
      } else {
        rate = await prisma.exchangeRate.create({
          data: { date: today, rate: newRateValue }
        });
      }
    }
  }

  res.json(rate || { error: 'Could not fetch rate' });
});

// Route to get all expenses
app.get('/api/expenses', async (req, res) => {
  if (USE_MOCK) {
    res.json([...mockExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)));
  } else {
    const expenses = await prisma.expense.findMany({ orderBy: { date: 'desc' } });
    const formatted = expenses.map(exp => {
      const match = exp.description.match(/^\[(.*?)\]\s*(.*)$/);
      if (match) {
        return { ...exp, category: match[1], description: match[2] };
      }
      return { ...exp, category: 'Otros' };
    });
    res.json(formatted);
  }
});

// Actualizar gasto con nuevos campos (subcategory, paymentMethod)
app.post('/api/expenses', async (req, res) => {
  const { description, amountVES, rate, category, cardId, commission, commissionType, subcategory, paymentMethod } = req.body;
  const amountUSD = amountVES / rate;
  const date = new Date();
  const defCategory = category || 'Otros';

  if (USE_MOCK) {
    const expense = {
      id: Date.now(),
      description,
      category: defCategory,
      subcategory: subcategory || null,
      paymentMethod: paymentMethod || 'efectivo',
      amountVES,
      amountUSD,
      exchangeRate: rate,
      cardId: cardId || null,
      commission: commission || 0,
      commissionType: commissionType || 'percent',
      date: date.toISOString()
    };
    mockExpenses.push(expense);
    res.json(expense);
  } else {
    const expense = await prisma.expense.create({
      data: { description: `[${defCategory}] ${description}`, amountVES, amountUSD, exchangeRate: rate, date }
    });
    res.json({ ...expense, description, category: defCategory, subcategory: subcategory || null, paymentMethod: paymentMethod || 'efectivo', cardId: cardId || null, commission: commission || 0, commissionType: commissionType || 'percent' });
  }
});

// Actualizar un gasto
app.put('/api/expenses/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { description, amountVES, rate, category, cardId, commission, commissionType } = req.body;
  const amountUSD = amountVES / rate;
  const defCategory = category || 'Otros';

  if (USE_MOCK) {
    const idx = mockExpenses.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    mockExpenses[idx] = {
      ...mockExpenses[idx],
      description, category: defCategory, amountVES, amountUSD,
      exchangeRate: rate, cardId: cardId || null,
      commission: commission || 0, commissionType: commissionType || 'percent'
    };
    res.json(mockExpenses[idx]);
  } else {
    const expense = await prisma.expense.update({
      where: { id },
      data: { description: `[${defCategory}] ${description}`, amountVES, amountUSD, exchangeRate: rate }
    });
    res.json({ ...expense, description, category: defCategory, cardId: cardId || null, commission: commission || 0, commissionType: commissionType || 'percent' });
  }
});

// Eliminar un gasto
app.delete('/api/expenses/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (USE_MOCK) {
    mockExpenses = mockExpenses.filter(e => e.id !== id);
    res.json({ success: true });
  } else {
    await prisma.expense.delete({ where: { id } });
    res.json({ success: true });
  }
});

// ===== RUTAS DE TARJETAS BANCARIAS =====

// Obtener todas las tarjetas
app.get('/api/cards', async (req, res) => {
  if (USE_MOCK) {
    res.json(mockCards || []);
  } else {
    const cards = await prisma.bankCard.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(cards);
  }
});

// Crear nueva tarjeta
app.post('/api/cards', async (req, res) => {
  const { bankId, bankName, bankCode, last4, holderName, isNomina, alias } = req.body;
  if (USE_MOCK) {
    const card = { id: Date.now(), bankId, bankName, bankCode, last4, holderName, isNomina: !!isNomina, alias: alias || '', createdAt: new Date().toISOString() };
    mockCards.push(card);
    res.json(card);
  } else {
    const card = await prisma.bankCard.create({
      data: { bankId, bankName, bankCode, last4, holderName, isNomina: !!isNomina, alias: alias || '' }
    });
    res.json(card);
  }
});

// Eliminar tarjeta
app.delete('/api/cards/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (USE_MOCK) {
    mockCards = (mockCards || []).filter(c => c.id !== id);
    res.json({ success: true });
  } else {
    await prisma.bankCard.delete({ where: { id } });
    res.json({ success: true });
  }
});

// Actualizar tarjeta
app.put('/api/cards/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { bankId, bankName, bankCode, last4, holderName, isNomina, alias } = req.body;
  if (USE_MOCK) {
    const idx = (mockCards || []).findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    mockCards[idx] = { ...mockCards[idx], bankId, bankName, bankCode, last4, holderName, isNomina: !!isNomina, alias: alias || '' };
    res.json(mockCards[idx]);
  } else {
    const card = await prisma.bankCard.update({
      where: { id },
      data: { bankId, bankName, bankCode, last4, holderName, isNomina: !!isNomina, alias: alias || '' }
    });
    res.json(card);
  }
});

// ===== RUTAS DE DEUDAS / CACHEA =====

// Obtener todas las deudas
app.get('/api/debts', (req, res) => {
  res.json([...mockDebts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Crear nueva deuda
app.post('/api/debts', (req, res) => {
  const debt = { ...req.body, id: req.body.id || Date.now() };
  mockDebts.push(debt);
  res.json(debt);
});

// Actualizar deuda (abonar, editar)
app.put('/api/debts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10) || req.params.id;
  const idx = mockDebts.findIndex(d => d.id === id || String(d.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Deuda no encontrada' });
  mockDebts[idx] = { ...mockDebts[idx], ...req.body };
  res.json(mockDebts[idx]);
});

// Eliminar deuda
app.delete('/api/debts/:id', (req, res) => {
  const before = mockDebts.length;
  mockDebts = mockDebts.filter(d => String(d.id) !== String(req.params.id));
  if (mockDebts.length === before) return res.status(404).json({ error: 'Deuda no encontrada' });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running (${USE_MOCK ? 'MOCK MODE' : 'DATABASE MODE'}) on http://localhost:${PORT}`);
});
