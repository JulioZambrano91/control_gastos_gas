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

// Route to create an expense
app.post('/api/expenses', async (req, res) => {
  const { description, amountVES, rate, category } = req.body;
  const amountUSD = amountVES / rate;
  const date = new Date();
  const defCategory = category || 'Otros';

  if (USE_MOCK) {
    const expense = {
      id: Date.now(),
      description,
      category: defCategory,
      amountVES,
      amountUSD,
      exchangeRate: rate,
      date: date.toISOString()
    };
    mockExpenses.push(expense);
    res.json(expense);
  } else {
    const expense = await prisma.expense.create({
      data: { description: `[${defCategory}] ${description}`, amountVES, amountUSD, exchangeRate: rate, date }
    });
    // Formatear salida para que sea igual
    res.json({ ...expense, description, category: defCategory });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running (${USE_MOCK ? 'MOCK MODE' : 'DATABASE MODE'}) on http://localhost:${PORT}`);
});
