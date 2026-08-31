// ═══════════════════════════════════════════════
// src/controllers/reportController.js
// ═══════════════════════════════════════════════

const reportService = require('../services/reportService');
const { sendSuccess } = require('../utils/response');

// GET /api/reports/summary?month=5&year=2026
// Returns JSON report data for the frontend preview
const getReportSummary = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const data = await reportService.getReportData(req.user.id, month, year);

    sendSuccess(res, {
      summary:             data.summary,
      categoryBreakdown:   data.categoryData,
      paymentMethodData:   data.paymentMethodData,
      expenseCount:        data.expenses.length,
      month:               data.month,
      year:                data.year,
      monthName:           data.monthName,
      userName:            data.user.name,
    }, 'Report data fetched');
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/csv?month=5&year=2026
const downloadCSV = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const { content, filename, mimeType } = await reportService.generateCSV(
      req.user.id, month, year
    );

    // Set headers to trigger file download in browser
    res.setHeader('Content-Type', `${mimeType}; charset=utf-8`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.send(content);
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/pdf?month=5&year=2026
const downloadPDF = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const { content, filename, mimeType } = await reportService.generatePDF(
      req.user.id, month, year
    );

    // Set headers to trigger PDF download
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', content.length);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    res.send(content);
  } catch (error) {
    next(error);
  }
};

module.exports = { getReportSummary, downloadCSV, downloadPDF };