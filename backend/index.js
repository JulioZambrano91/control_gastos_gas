const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const BCV_URL = 'https://www.bcv.org.ve/';

// Helper function to fetch BCV rate (Simplified version of your .gs logic)
async function fetchBCVRate() {
  try {
    const { data } = await axios.get(BCV_URL);
    const usdIndex = data.indexOf('USD');
    if (usdIndex === -1) return null;
    
    // Find strong tag after USD
    const strongStart = data.indexOf('<strong>', usdIndex) + 8;
    const strongEnd = data.indexOf('</strong>', strongStart);
    let rateStr = data.substring(strongStart, strongEnd).trim();
    
    // Parse VES float format: "339,14950000" -> "339.14"
    const cleanRate = rateStr.replace(/\./g, "").replace(",", ".");
    return parseFloat(cleanRate);
  } catch (error) {
    console.error('Error fetching BCV rate:', error);
    return null;
  }
}

// Route to get or update daily rate
app.get('/api/rate', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let rate = await prisma.exchangeRate.findFirst({
    where: { date: today }
  });

  if (!rate) {
    const newRateValue = await fetchBCVRate();
    if (newRateValue) {
      rate = await prisma.exchangeRate.create({
        data: { date: today, rate: newRateValue }
      });
    }
  }

  res.json(rate || { error: 'Could not fetch rate' });
});

// Route to get all expenses
app.get('/api/expenses', async (req, res) => {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' }
  });
  res.json(expenses);
});

// Route to create an expense
app.post('/api/expenses', async (req, res) => {
  const { description, amountVES, rate } = req.body;
  const amountUSD = amountVES / rate;

  const expense = await prisma.expense.create({
    data: {
      description,
      amountVES,
      amountUSD,
      exchangeRate: rate,
      date: new Date()
    }
  });

  res.json(expense);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
