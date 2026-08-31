// ═══════════════════════════════════════════════
// src/controllers/receiptController.js
// OCR receipt scanning — extract expense fields
// from a photo using Tesseract.js
// ═══════════════════════════════════════════════

const { createWorker } = require('tesseract.js');
const { sendSuccess, sendError } = require('../utils/response');

// ── Amount extraction ──────────────────────────
// Strategy: look for Grand Total / Total first,
// then fall back to the largest currency value found.
const extractAmount = (text) => {
  const lines = text.split('\n');

  // Priority 1 — contextual: "Grand Total / Net Amount / Payable" + number on same line
  for (const line of lines) {
    if (/grand\s*total|net\s*(?:total|amount)|bill\s*amount|amount\s*(?:due|payable)|total\s*payable/i.test(line)) {
      const nums = line.match(/[\d,]+\.?\d*/g);
      if (nums) {
        const vals = nums.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => n > 0);
        if (vals.length) return Math.max(...vals);
      }
    }
  }

  // Priority 2 — line starting with just "TOTAL"
  for (const line of lines) {
    if (/^\s*total\s*[:\-]?\s*/i.test(line)) {
      const nums = line.match(/[\d,]+\.?\d*/g);
      if (nums) {
        const vals = nums.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => n > 0);
        if (vals.length) return Math.max(...vals);
      }
    }
  }

  // Priority 3 — any ₹ / Rs. / $ prefixed value → take the max (usually the total)
  const currencyMatches = [...text.matchAll(/(?:[₹\$]|Rs\.?)\s*([\d,]+\.?\d*)/gi)];
  if (currencyMatches.length) {
    const vals = currencyMatches
      .map(m => parseFloat(m[1].replace(/,/g, '')))
      .filter(n => !isNaN(n) && n > 0);
    if (vals.length) return Math.max(...vals);
  }

  // Priority 4 — bare decimal values that look like amounts (e.g. 1234.56)
  const decimalMatches = [...text.matchAll(/\b(\d{1,7}\.\d{2})\b/g)]
    .map(m => parseFloat(m[1]))
    .filter(n => n > 0);
  if (decimalMatches.length) return Math.max(...decimalMatches);

  return null;
};

// ── Date extraction ────────────────────────────
const MONTH_MAP = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const extractDate = (text) => {
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY  (Indian standard)
  const ddmmyyyy = text.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const dt = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(dt)) return dt.toISOString().split('T')[0];
  }

  // "1 June 2024" / "01-Jun-24"
  const wordDate = text.match(/\b(\d{1,2})[\s\-](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-,](\d{2,4})\b/i);
  if (wordDate) {
    const [, d, mon, y] = wordDate;
    const year = y.length === 2 ? `20${y}` : y;
    const dt = new Date(`${year}-${String(MONTH_MAP[mon.toLowerCase().slice(0, 3)]).padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(dt)) return dt.toISOString().split('T')[0];
  }

  // "June 1, 2024"
  const wordDate2 = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if (wordDate2) {
    const [, mon, d, y] = wordDate2;
    const dt = new Date(`${y}-${String(MONTH_MAP[mon.toLowerCase().slice(0, 3)]).padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(dt)) return dt.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
};

// ── Merchant extraction ────────────────────────
// Receipts almost always put the store name in the first few lines.
const extractMerchant = (lines) => {
  for (const line of lines.slice(0, 6)) {
    const trimmed = line.trim();
    // Skip lines that are pure numbers, short codes, or symbols
    if (
      trimmed.length >= 3 &&
      /[a-zA-Z]/.test(trimmed) &&
      !/^\s*(?:date|time|invoice|bill|receipt|order|ref|tax|gst)\s*[:\-#]/i.test(trimmed)
    ) {
      return trimmed.slice(0, 100);
    }
  }
  return '';
};

// ── Payment method detection ───────────────────
const extractPaymentMethod = (text) => {
  const t = text.toLowerCase();
  if (/\bupi\b|gpay|google\s*pay|phonepe|paytm|bhim/.test(t)) return 'UPI';
  if (/credit\s*card|mastercard|visa\s*credit|amex|american\s*express/.test(t)) return 'Credit Card';
  if (/debit\s*card|visa\s*debit|rupay/.test(t)) return 'Debit Card';
  if (/net\s*banking|neft|imps|rtgs/.test(t)) return 'Net Banking';
  if (/\bcash\b/.test(t)) return 'Cash';
  return 'Other';
};

// ── Category suggestion ────────────────────────
const suggestCategory = (text) => {
  const t = text.toLowerCase();
  if (/restaurant|cafe|hotel|food|pizza|burger|biryani|swiggy|zomato|domino|kfc|mcdonalds|subway|starbucks|dhaba|canteen|tiffin/.test(t)) return 'Food & Dining';
  if (/uber|ola|rapido|taxi|cab|petrol|fuel|diesel|parking|toll|metro|bus\s*ticket|train|irctc|flight|airline/.test(t)) return 'Transportation';
  if (/amazon|flipkart|myntra|ajio|nykaa|meesho|mall|supermart|big\s*bazaar|d-mart|dmart|store|shoppe/.test(t)) return 'Shopping';
  if (/movie|cinema|pvr|inox|netflix|prime|spotify|hotstar|game|theatre|concert|event/.test(t)) return 'Entertainment';
  if (/hospital|clinic|pharmacy|chemist|medicine|doctor|lab|diagnostic|health/.test(t)) return 'Healthcare';
  if (/electricity|water\s*bill|gas|internet|wifi|broadband|recharge|dth|jio|airtel|bsnl|utility/.test(t)) return 'Utilities';
  if (/school|college|university|course|coaching|tuition|book\s*store|library|education/.test(t)) return 'Education';
  if (/hotel\s*booking|resort|flight\s*ticket|oyo|makemytrip|goibibo|booking\.com|travel\s*agent/.test(t)) return 'Travel';
  if (/salon|spa|beauty|parlour|gym|fitness|hair/.test(t)) return 'Personal Care';
  return 'Other';
};

// ── Main controller ────────────────────────────
const scanReceipt = async (req, res) => {
  if (!req.file) {
    return sendError(res, 'No image uploaded. Please attach a receipt photo.', 400);
  }

  let worker;
  try {
    // Initialize Tesseract worker with English language
    worker = await createWorker('eng', 1, {
      logger: () => {},        // suppress progress logs
      errorHandler: () => {},  // suppress error logs
    });

    const { data: { text } } = await worker.recognize(req.file.buffer);

    if (!text || text.trim().length < 5) {
      return sendError(res, 'Could not read any text from the image. Please try a clearer photo with better lighting.', 422);
    }

    const lines = text.split('\n').filter(l => l.trim().length > 0);

    const extracted = {
      amount:        extractAmount(text),
      merchant:      extractMerchant(lines),
      date:          extractDate(text),
      paymentMethod: extractPaymentMethod(text),
      category:      suggestCategory(text),
    };

    return sendSuccess(res, extracted, 'Receipt scanned successfully');

  } catch (err) {
    console.error('OCR error:', err.message);
    return sendError(res, 'Failed to process the image. Please try again with a clearer photo.', 500);
  } finally {
    if (worker) await worker.terminate();
  }
};

module.exports = { scanReceipt };
