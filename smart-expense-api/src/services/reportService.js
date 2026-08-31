// ═══════════════════════════════════════════════
// src/services/reportService.js
//
// Generates monthly financial reports.
// Two formats: CSV and PDF
//
// Report contains:
// - Summary (total spent, budget, savings)
// - Expense list (all transactions)
// - Category breakdown (totals per category)
// - Budget comparison (if budget was set)
// ═══════════════════════════════════════════════

const Expense  = require('../models/Expense');
const Budget   = require('../models/Budget');
const User     = require('../models/User');
const mongoose = require('mongoose');

// ───────────────────────────────────────────────
// getReportData
// Fetches and structures all data needed for report
// Shared by both CSV and PDF generators
// ───────────────────────────────────────────────
const getReportData = async (userId, month, year) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const startDate = new Date(year, month - 1, 1);
  const endDate   = new Date(year, month, 0, 23, 59, 59, 999);

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  // Run all queries in parallel
  const [user, expenses, budget, categoryData] = await Promise.all([
    User.findById(userId).select('name email currency'),

    // All expenses for the month sorted by date
    Expense.find({
      user: userObjectId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 }),

    // Budget for the month
    Budget.findOne({ user: userId, month, year }),

    // Category aggregation
    Expense.aggregate([
      {
        $match: {
          user: userObjectId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count:       { $sum: 1 },
          avgAmount:   { $avg: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),
  ]);

  // Calculate totals
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyLimit = budget?.monthlyLimit || 0;
  const budgetLeft = monthlyLimit > 0 ? monthlyLimit - totalSpent : null;

  // Payment method breakdown
  const paymentMethodData = {};
  expenses.forEach((e) => {
    paymentMethodData[e.paymentMethod] =
      (paymentMethodData[e.paymentMethod] || 0) + e.amount;
  });

  return {
    user,
    month,
    year,
    monthName: MONTH_NAMES[month - 1],
    startDate,
    endDate,
    expenses,
    budget,
    categoryData,
    paymentMethodData,
    summary: {
      totalSpent:       Math.round(totalSpent * 100) / 100,
      totalTransactions: expenses.length,
      monthlyLimit,
      budgetLeft:       budgetLeft !== null ? Math.round(budgetLeft * 100) / 100 : null,
      avgPerDay:        Math.round((totalSpent / new Date(year, month, 0).getDate()) * 100) / 100,
      avgPerTransaction: expenses.length > 0
        ? Math.round((totalSpent / expenses.length) * 100) / 100
        : 0,
      isOverBudget: monthlyLimit > 0 && totalSpent > monthlyLimit,
    },
  };
};

// ───────────────────────────────────────────────
// generateCSV
// Returns a CSV string of all expenses for the month
// ───────────────────────────────────────────────
const generateCSV = async (userId, month, year) => {
  const data = await getReportData(userId, month, year);

  const lines = [];

  // ── HEADER ──
  lines.push(`"SMART EXPENSE REPORT","${data.monthName} ${data.year}"`);
  lines.push(`"Generated on","${new Date().toLocaleDateString('en-IN')}"`);
  lines.push(`"Account","${data.user.name} <${data.user.email}>"`);
  lines.push('');

  // ── SUMMARY ──
  lines.push('"=== SUMMARY ==="');
  lines.push('"Field","Value"');
  lines.push(`"Report Period","${data.monthName} ${data.year}"`);
  lines.push(`"Total Spent","Rs. ${data.summary.totalSpent}"`);
  lines.push(`"Total Transactions","${data.summary.totalTransactions}"`);
  lines.push(`"Average Per Day","Rs. ${data.summary.avgPerDay}"`);
  lines.push(`"Average Per Transaction","Rs. ${data.summary.avgPerTransaction}"`);
  lines.push(`"Monthly Budget","${data.summary.monthlyLimit > 0 ? 'Rs. ' + data.summary.monthlyLimit : 'Not set'}"`);
  lines.push(`"Budget Status","${
    data.summary.monthlyLimit > 0
      ? data.summary.isOverBudget
        ? 'Over by Rs. ' + Math.abs(data.summary.budgetLeft)
        : 'Rs. ' + data.summary.budgetLeft + ' remaining'
      : 'N/A'
  }"`);
  lines.push('');

  // ── CATEGORY BREAKDOWN ──
  lines.push('"=== CATEGORY BREAKDOWN ==="');
  lines.push('"Category","Total Amount","Transactions","Average","% of Total"');

  data.categoryData.forEach((cat) => {
    const pct = data.summary.totalSpent > 0
      ? ((cat.totalAmount / data.summary.totalSpent) * 100).toFixed(1)
      : '0.0';
    lines.push([
      `"${cat._id}"`,
      `"Rs. ${Math.round(cat.totalAmount * 100) / 100}"`,
      `"${cat.count}"`,
      `"Rs. ${Math.round(cat.avgAmount * 100) / 100}"`,
      `"${pct}%"`,
    ].join(','));
  });

  lines.push([
    '"TOTAL"',
    `"Rs. ${data.summary.totalSpent}"`,
    `"${data.summary.totalTransactions}"`,
    '"—"',
    '"100%"',
  ].join(','));
  lines.push('');

  // ── TRANSACTIONS ──
  lines.push('"=== TRANSACTIONS ==="');
  lines.push('"#","Date","Description","Category","Amount","Payment Method","Merchant","Notes"');

  if (data.expenses.length === 0) {
    lines.push('"","No transactions found for this period","","","","","",""');
  } else {
    data.expenses.forEach((expense, idx) => {
      const row = [
        `"${idx + 1}"`,
        `"${new Date(expense.date).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        })}"`,
        `"${(expense.description || '').replace(/"/g, '""')}"`,
        `"${expense.category || ''}"`,
        `"Rs. ${expense.amount}"`,
        `"${expense.paymentMethod || ''}"`,
        `"${(expense.merchant || '').replace(/"/g, '""')}"`,
        `"${(expense.notes || '').replace(/"/g, '""')}"`,
      ];
      lines.push(row.join(','));
    });
  }

  lines.push('');
  lines.push(`"","","","TOTAL","Rs. ${data.summary.totalSpent}","","",""`);

  // Join with \r\n for Excel compatibility
  // BOM prefix fixes encoding — stops Rs. from showing as garbage
  const BOM     = '\uFEFF';
  const content = BOM + lines.join('\r\n');

  return {
    content,
    filename: `SmartExpense_${data.monthName}_${data.year}.csv`,
    mimeType: 'text/csv; charset=utf-8',
    data,
  };
};

// ───────────────────────────────────────────────
// generatePDF
// Returns a PDF buffer using PDFKit
// ───────────────────────────────────────────────
const generatePDF = async (userId, month, year) => {
  const PDFDocument = require('pdfkit');
  const data        = await getReportData(userId, month, year);

  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
    const chunks = [];

    doc.on('data',  (chunk) => chunks.push(chunk));
    doc.on('end',   () => resolve({
      content:  Buffer.concat(chunks),
      filename: `SmartExpense_${data.monthName}_${data.year}.pdf`,
      mimeType: 'application/pdf',
      data,
    }));
    doc.on('error', reject);

    // ─────────────────────────────────────────
    // DESIGN TOKENS
    // ─────────────────────────────────────────
    const C = {
      brand:       '#1a56db',
      brandDark:   '#1e3a8a',
      brandLight:  '#eff6ff',
      brandMid:    '#dbeafe',
      white:       '#ffffff',
      black:       '#0f172a',
      textPrimary: '#1e293b',
      textSecond:  '#475569',
      textMuted:   '#94a3b8',
      border:      '#e2e8f0',
      rowAlt:      '#f8fafc',
      rowWhite:    '#ffffff',
      green:       '#15803d',
      greenBg:     '#f0fdf4',
      greenBorder: '#bbf7d0',
      red:         '#b91c1c',
      redBg:       '#fef2f2',
      redBorder:   '#fecaca',
      tagBg:       '#f1f5f9',
    };

    const PAGE_W    = doc.page.width;   // 595
    const PAGE_H    = doc.page.height;  // 842
    const M         = 40;               // margin
    const CONTENT_W = PAGE_W - M * 2;  // 515

    // ─────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────
    const fill = (x, y, w, h, color) =>
      doc.save().rect(x, y, w, h).fill(color).restore();

    const stroke = (x, y, w, h, color, lw = 0.5) =>
      doc.save().rect(x, y, w, h).strokeColor(color).lineWidth(lw).stroke().restore();

    const hline = (y, x1 = M, x2 = PAGE_W - M, color = C.border, lw = 0.5) =>
      doc.save().moveTo(x1, y).lineTo(x2, y)
         .strokeColor(color).lineWidth(lw).stroke().restore();

    const vline = (x, y1, y2, color = C.border, lw = 0.5) =>
      doc.save().moveTo(x, y1).lineTo(x, y2)
         .strokeColor(color).lineWidth(lw).stroke().restore();

    const money = (n) =>
      `Rs. ${Number(n).toLocaleString('en-IN', {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      })}`;

    const fmtDate = (d) =>
      new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });

    const clip = (s, max) =>
      s && s.length > max ? s.slice(0, max - 1) + '…' : (s || '—');

    // ─────────────────────────────────────────
    // CATEGORY COLOR TAGS
    // ─────────────────────────────────────────
    const CAT_COLORS = {
      'Food & Dining':  { bg: '#fef9c3', text: '#854d0e' },
      'Travel':         { bg: '#e0f2fe', text: '#075985' },
      'Entertainment':  { bg: '#fae8ff', text: '#6b21a8' },
      'Shopping':       { bg: '#fce7f3', text: '#9d174d' },
      'Healthcare':     { bg: '#dcfce7', text: '#14532d' },
      'Utilities':      { bg: '#ffedd5', text: '#9a3412' },
      'Education':      { bg: '#e0e7ff', text: '#3730a3' },
      'Transportation': { bg: '#f0fdf4', text: '#166534' },
      'Other':          { bg: '#f1f5f9', text: '#475569' },
    };

    const catTag = (category, x, y, w = 90) => {
      const scheme = CAT_COLORS[category] || CAT_COLORS['Other'];
      const TAG_H  = 14;
      doc.save()
         .roundedRect(x, y - 1, w, TAG_H, 3)
         .fill(scheme.bg)
         .restore();
      doc.fillColor(scheme.text)
         .font('Helvetica')
         .fontSize(7)
         .text(clip(category, 14), x + 4, y + 2, { width: w - 8, lineBreak: false });
    };

    // ─────────────────────────────────────────
    // ════ PAGE 1 ════
    // ─────────────────────────────────────────

    // ── TOP HEADER BAR ──
    const HDR_H = 80;
    fill(0, 0, PAGE_W, HDR_H, C.brand);

    // Brand name
    doc.fillColor(C.white)
       .font('Helvetica-Bold')
       .fontSize(18)
       .text('SmartExpense', M, 18);

    // Subtitle
    doc.fillColor('#93c5fd')
       .font('Helvetica')
       .fontSize(9)
       .text('Personal Finance Report', M, 40);

    // Period badge (top right)
    const badgeW  = 130;
    const badgeX  = PAGE_W - M - badgeW;
    fill(badgeX, 20, badgeW, 22, '#1d4ed8');
    doc.fillColor(C.white)
       .font('Helvetica-Bold')
       .fontSize(10)
       .text(`${data.monthName} ${data.year}`, badgeX, 24, {
         width: badgeW, align: 'center',
       });

    doc.fillColor('#bfdbfe')
       .font('Helvetica')
       .fontSize(7.5)
       .text(`Generated ${new Date().toLocaleDateString('en-IN')}`, badgeX, 46, {
         width: badgeW, align: 'center',
       });

    // ── ACCOUNT / USER STRIP ──
    const ACCT_Y = HDR_H;
    const ACCT_H = 44;
    fill(0, ACCT_Y, PAGE_W, ACCT_H, C.brandDark);

    // Avatar circle
    doc.save()
       .circle(M + 14, ACCT_Y + 22, 13)
       .fill('#3b82f6')
       .restore();
    doc.fillColor(C.white)
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(data.user.name.charAt(0).toUpperCase(), M + 9, ACCT_Y + 16);

    // Name + email
    doc.fillColor(C.white)
       .font('Helvetica-Bold')
       .fontSize(10)
       .text(data.user.name, M + 34, ACCT_Y + 10);
    doc.fillColor('#93c5fd')
       .font('Helvetica')
       .fontSize(8)
       .text(data.user.email, M + 34, ACCT_Y + 24);

    // Account label on right
    doc.fillColor('#93c5fd')
       .font('Helvetica')
       .fontSize(7.5)
       .text('ACCOUNT STATEMENT', PAGE_W - M - 120, ACCT_Y + 19, {
         width: 120, align: 'right',
       });

    // ── KPI ROW ──
    const KPI_Y = HDR_H + ACCT_H + 16;
    const KPI_H = 68;
    const KPI_W = (CONTENT_W - 20) / 3;
    const KPI_GAP = 10;

    const kpis = [
      {
        title:  'TOTAL SPENT',
        value:  money(data.summary.totalSpent),
        sub:    `${data.summary.totalTransactions} transactions`,
        accent: C.brand,
        icon:   '↑',
      },
      {
        title:  'DAILY AVERAGE',
        value:  money(data.summary.avgPerDay),
        sub:    `per day this month`,
        accent: '#0891b2',
        icon:   '≈',
      },
      {
        title:  data.summary.monthlyLimit > 0 ? 'BUDGET' : 'AVG PER TXN',
        value:  data.summary.monthlyLimit > 0
          ? money(Math.abs(data.summary.budgetLeft))
          : money(data.summary.avgPerTransaction),
        sub:    data.summary.monthlyLimit > 0
          ? data.summary.isOverBudget
            ? `over budget of ${money(data.summary.monthlyLimit)}`
            : `remaining of ${money(data.summary.monthlyLimit)}`
          : 'per transaction',
        accent: data.summary.isOverBudget ? C.red : C.green,
        icon:   data.summary.isOverBudget ? '!' : '✓',
      },
    ];

    kpis.forEach((kpi, i) => {
      const x = M + i * (KPI_W + KPI_GAP);

      // Card shadow effect (slightly larger gray rect behind)
      fill(x + 2, KPI_Y + 2, KPI_W, KPI_H, '#e2e8f0');
      fill(x, KPI_Y, KPI_W, KPI_H, C.white);
      stroke(x, KPI_Y, KPI_W, KPI_H, C.border, 0.5);

      // Top accent bar
      fill(x, KPI_Y, KPI_W, 3, kpi.accent);

      // Title
      doc.fillColor(C.textMuted)
         .font('Helvetica')
         .fontSize(7)
         .text(kpi.title, x + 10, KPI_Y + 12, { width: KPI_W - 20 });

      // Value
      doc.fillColor(C.textPrimary)
         .font('Helvetica-Bold')
         .fontSize(kpi.value.length > 18 ? 10 : 12)
         .text(kpi.value, x + 10, KPI_Y + 26, { width: KPI_W - 20 });

      // Sub
      doc.fillColor(kpi.accent)
         .font('Helvetica')
         .fontSize(7.5)
         .text(kpi.sub, x + 10, KPI_Y + 50, { width: KPI_W - 20 });
    });

    // ── SPENDING BY CATEGORY ──
    let y = KPI_Y + KPI_H + 24;

    // Section heading
    fill(M, y, CONTENT_W, 24, C.brandLight);
    stroke(M, y, CONTENT_W, 24, C.brandMid);
    doc.fillColor(C.brand)
       .font('Helvetica-Bold')
       .fontSize(10)
       .text('SPENDING BY CATEGORY', M + 10, y + 7);
    y += 24;

    if (data.categoryData.length === 0) {
      fill(M, y, CONTENT_W, 32, C.rowAlt);
      doc.fillColor(C.textMuted).font('Helvetica').fontSize(9)
         .text('No expenses recorded.', M, y + 10, { width: CONTENT_W, align: 'center' });
      y += 32;
    } else {
      // Table header
      const CC = [160, 105, 45, 105, 100]; // col widths
      const CH = ['Category', 'Total Amount', 'Txns', 'Avg Amount', '% of Spend'];

      fill(M, y, CONTENT_W, 22, C.brand);
      let cx = M;
      CH.forEach((h, i) => {
        doc.fillColor(C.white)
           .font('Helvetica-Bold')
           .fontSize(8)
           .text(h, cx + 7, y + 7, {
             width: CC[i] - 10,
             align: i === 0 ? 'left' : 'right',
           });
        cx += CC[i];
      });
      y += 22;

      data.categoryData.forEach((cat, idx) => {
        if (y + 22 > PAGE_H - 60) { doc.addPage(); y = 50; }

        const ROW_H = 22;
        const pct   = data.summary.totalSpent > 0
          ? ((cat.totalAmount / data.summary.totalSpent) * 100).toFixed(1)
          : '0.0';

        fill(M, y, CONTENT_W, ROW_H, idx % 2 === 0 ? C.rowWhite : C.rowAlt);
        hline(y + ROW_H, M, PAGE_W - M, C.border, 0.3);

        // Progress bar for % in last column
        const barX   = M + CC[0] + CC[1] + CC[2] + CC[3] + 7;
        const barMaxW = CC[4] - 30;
        const barW   = (parseFloat(pct) / 100) * barMaxW;
        fill(barX, y + 8, barMaxW, 6, '#e2e8f0');
        fill(barX, y + 8, Math.max(2, barW), 6, C.brand);

        const rowVals = [
          clip(cat._id, 22),
          money(Math.round(cat.totalAmount * 100) / 100),
          cat.count.toString(),
          money(Math.round(cat.avgAmount * 100) / 100),
          `${pct}%`,
        ];

        cx = M;
        rowVals.forEach((val, i) => {
          doc.fillColor(i === 0 ? C.textPrimary : C.textSecond)
             .font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
             .fontSize(8.5)
             .text(val, cx + 7, y + 7, {
               width: i === 4 ? CC[i] - 36 : CC[i] - 10,
               align: i === 0 ? 'left' : 'right',
               lineBreak: false,
             });
          cx += CC[i];
        });
        y += ROW_H;
      });

      // Total row
      fill(M, y, CONTENT_W, 24, C.brandDark);
      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(9)
         .text('TOTAL', M + 7, y + 7, { width: CC[0] - 10 })
         .text(money(data.summary.totalSpent),
           M + CC[0] + 7, y + 7,
           { width: CC[1] - 10, align: 'right' })
         .text(data.summary.totalTransactions.toString(),
           M + CC[0] + CC[1] + 7, y + 7,
           { width: CC[2] - 10, align: 'right' });
      y += 24;
    }

    // ─────────────────────────────────────────
    // ════ PAGE 2 — BANK STATEMENT ════
    // ─────────────────────────────────────────
    doc.addPage();

    // ── PAGE 2 HEADER ──
    fill(0, 0, PAGE_W, 56, C.brand);
    doc.fillColor(C.white)
       .font('Helvetica-Bold')
       .fontSize(14)
       .text('Transaction Statement', M, 14);
    doc.fillColor('#93c5fd')
       .font('Helvetica')
       .fontSize(8.5)
       .text(
         `${data.monthName} ${data.year}  ·  ${data.expenses.length} transactions  ·  Total: ${money(data.summary.totalSpent)}`,
         M, 34
       );

    // Statement period pills
    const pillY = 12;
    const pillX = PAGE_W - M - 200;
    fill(pillX, pillY, 200, 18, '#1d4ed8');
    doc.fillColor(C.white)
       .font('Helvetica')
       .fontSize(8)
       .text(
         `Period: 01 ${data.monthName} – ${new Date(data.year, data.month, 0).getDate()} ${data.monthName} ${data.year}`,
         pillX + 6, pillY + 5, { width: 188 }
       );

    y = 70;

    if (data.expenses.length === 0) {
      fill(M, y, CONTENT_W, 48, C.rowAlt);
      doc.fillColor(C.textMuted).font('Helvetica').fontSize(10)
         .text('No transactions found for this period.', M, y + 16, {
           align: 'center', width: CONTENT_W,
         });
    } else {

      // ── BANK STATEMENT TABLE ──
      // Columns: # | Date | Description | Category | Method | Amount
      // Widths must sum to CONTENT_W = 515
      const COL = {
        num:  30,
        date: 70,
        desc: 175,
        cat:  105,
        meth: 70,
        amt:  65,
      };

      const COLS  = [COL.num, COL.date, COL.desc, COL.cat, COL.meth, COL.amt];
      const HDRS  = ['#', 'Date', 'Description', 'Category', 'Method', 'Amount'];
      const ROW_H = 28; // taller = bank statement feel

      const drawHeader = (startY) => {
        fill(M, startY, CONTENT_W, 26, C.brandDark);

        // Vertical dividers in header
        let hx = M;
        COLS.forEach((w, i) => {
          if (i > 0) vline(hx, startY, startY + 26, '#3b82f6', 0.4);
          doc.fillColor(C.white)
             .font('Helvetica-Bold')
             .fontSize(8)
             .text(HDRS[i], hx + 6, startY + 9, {
               width: w - 10,
               align: i === 5 ? 'right' : i === 0 ? 'center' : 'left',
               lineBreak: false,
             });
          hx += w;
        });
        return startY + 26;
      };

      y = drawHeader(y);

      // Running total
      let runningTotal = 0;

      data.expenses.forEach((expense, idx) => {

        // ── PAGE BREAK ──
        if (y + ROW_H > PAGE_H - 70) {
          // Draw continuation footer before break
          hline(y, M, PAGE_W - M, C.border);
          fill(M, y, CONTENT_W, 18, C.brandLight);
          doc.fillColor(C.brand).font('Helvetica').fontSize(7.5)
             .text('Continued on next page…', M + 6, y + 5);
          y += 18;

          doc.addPage();

          // Continuation header
          fill(0, 0, PAGE_W, 40, C.brand);
          doc.fillColor(C.white).font('Helvetica-Bold').fontSize(12)
             .text('Transaction Statement (continued)', M, 12);
          doc.fillColor('#93c5fd').font('Helvetica').fontSize(8)
             .text(`${data.monthName} ${data.year}`, M, 28);
          y = 50;

          y = drawHeader(y);
        }

        runningTotal += expense.amount;

        // Alternate row colors
        const rowBg = idx % 2 === 0 ? C.rowWhite : C.rowAlt;
        fill(M, y, CONTENT_W, ROW_H, rowBg);

        // Left accent stripe for every row (very subtle)
        fill(M, y, 3, ROW_H, idx % 2 === 0 ? '#dbeafe' : '#bfdbfe');

        // Bottom border
        hline(y + ROW_H, M, PAGE_W - M, C.border, 0.3);

        // Vertical column dividers
        let vx = M;
        COLS.forEach((w) => {
          vx += w;
          vline(vx, y, y + ROW_H, C.border, 0.3);
        });

        // ── CELL CONTENT ──

        // Col 1 — Row number (centered circle badge)
        const numStr = (idx + 1).toString();
        doc.save()
           .roundedRect(M + 7, y + 8, 16, 12, 3)
           .fill(C.brandLight)
           .restore();
        doc.fillColor(C.brand)
           .font('Helvetica-Bold')
           .fontSize(7)
           .text(numStr, M + 7, y + 11, { width: 16, align: 'center', lineBreak: false });

        // Col 2 — Date (two lines: day+month / year)
        const dateObj = new Date(expense.date);
        const dateLine1 = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const dateLine2 = dateObj.getFullYear().toString();
        const dateX = M + COL.num;
        doc.fillColor(C.textPrimary)
           .font('Helvetica-Bold')
           .fontSize(8.5)
           .text(dateLine1, dateX + 5, y + 6, { width: COL.date - 10, lineBreak: false });
        doc.fillColor(C.textMuted)
           .font('Helvetica')
           .fontSize(7)
           .text(dateLine2, dateX + 5, y + 17, { width: COL.date - 10, lineBreak: false });

        // Col 3 — Description (bold) + notes (muted, smaller)
        const descX = M + COL.num + COL.date;
        doc.fillColor(C.textPrimary)
           .font('Helvetica-Bold')
           .fontSize(8.5)
           .text(clip(expense.description, 30), descX + 5, y + 6, {
             width: COL.desc - 10, lineBreak: false,
           });
        if (expense.merchant) {
          doc.fillColor(C.textMuted)
             .font('Helvetica')
             .fontSize(7)
             .text(clip(expense.merchant, 28), descX + 5, y + 17, {
               width: COL.desc - 10, lineBreak: false,
             });
        }

        // Col 4 — Category pill/tag
        const catX = M + COL.num + COL.date + COL.desc;
        catTag(expense.category, catX + 5, y + 8, COL.cat - 12);

        // Col 5 — Payment method with icon
        const methX = M + COL.num + COL.date + COL.desc + COL.cat;
        const methIcons = {
          'UPI':        '📱',
          'Cash':       '💵',
          'Debit Card': '💳',
          'Credit Card':'💳',
          'Net Banking':'🏦',
        };
        const methIcon = methIcons[expense.paymentMethod] || '💰';
        doc.fillColor(C.textSecond)
           .font('Helvetica')
           .fontSize(8)
           .text(`${methIcon} ${clip(expense.paymentMethod, 10)}`, methX + 5, y + 10, {
             width: COL.meth - 10, lineBreak: false,
           });

        // Col 6 — Amount (right aligned, bold, colored)
        const amtX = M + COL.num + COL.date + COL.desc + COL.cat + COL.meth;
        doc.fillColor(C.red)
           .font('Helvetica-Bold')
           .fontSize(9)
           .text(money(expense.amount), amtX + 4, y + 10, {
             width: COL.amt - 8, align: 'right', lineBreak: false,
           });

        y += ROW_H;
      });

      // ── TOTAL ROW ──
      fill(M, y, CONTENT_W, 28, C.brandDark);
      // Left accent
      fill(M, y, 4, 28, '#60a5fa');

      doc.fillColor(C.white)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('TOTAL DEBITS', M + 10, y + 9, { width: 250 });

      doc.fillColor('#fca5a5')
         .font('Helvetica-Bold')
         .fontSize(9)
         .text(
           money(data.summary.totalSpent),
           M + COL.num + COL.date + COL.desc + COL.cat + COL.meth + 4,
           y + 9,
           { width: COL.amt - 8, align: 'right', lineBreak: false }
         );
      y += 28;

      // ── CLOSING BALANCE BOX ──
      y += 12;
      if (data.summary.monthlyLimit > 0) {
        const boxH  = 44;
        const isOver = data.summary.isOverBudget;
        fill(M, y, CONTENT_W, boxH, isOver ? C.redBg : C.greenBg);
        stroke(M, y, CONTENT_W, boxH, isOver ? C.redBorder : C.greenBorder, 1);
        fill(M, y, 4, boxH, isOver ? C.red : C.green);

        doc.fillColor(isOver ? C.red : C.green)
           .font('Helvetica-Bold')
           .fontSize(9)
           .text(
             isOver ? '⚠  OVER BUDGET' : '✓  WITHIN BUDGET',
             M + 14, y + 8
           );
        doc.fillColor(C.textSecond)
           .font('Helvetica')
           .fontSize(8.5)
           .text(
             `Budget: ${money(data.summary.monthlyLimit)}  |  Spent: ${money(data.summary.totalSpent)}  |  ${isOver ? 'Over by' : 'Remaining'}: ${money(Math.abs(data.summary.budgetLeft))}`,
             M + 14, y + 24
           );
        y += boxH + 12;
      }
    }

    // ─────────────────────────────────────────
    // FOOTER — ALL PAGES
    // ─────────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);

      const FY = PAGE_H - 30;
      fill(0, FY - 4, PAGE_W, 34, '#f8fafc');
      hline(FY - 4, 0, PAGE_W, C.border, 0.5);

      doc.fillColor(C.textMuted).font('Helvetica').fontSize(7)
         .text('SmartExpense · Personal Finance Intelligence', M, FY + 5, { width: 200 });

      doc.fillColor(C.border).font('Helvetica').fontSize(7)
         .text('CONFIDENTIAL', M, FY + 5, { align: 'center', width: CONTENT_W });

      doc.fillColor(C.textMuted).font('Helvetica').fontSize(7)
         .text(`Page ${i + 1} of ${range.count}`, M, FY + 5, {
           align: 'right', width: CONTENT_W,
         });
    }

    doc.end();
  });
};

module.exports = { getReportData, generateCSV, generatePDF };