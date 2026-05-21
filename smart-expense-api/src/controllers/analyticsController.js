// ═══════════════════════════════════════════════
// src/controllers/analyticsController.js
// ═══════════════════════════════════════════════

const analyticsService = require('../services/analyticsService');
const { sendSuccess } = require('../utils/response');

const getDashboard = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const data = await analyticsService.getMonthlyOverview(
      req.user.id,
      month,
      year
    );

    sendSuccess(res, data, 'Dashboard data fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };