const insightsService = require('../services/insightsService');
const { sendSuccess } = require('../utils/response');

const getInsights = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const insights = await insightsService.generateInsights(
      req.user.id, month, year
    );

    sendSuccess(res, { insights, count: insights.length }, 'Insights generated');
  } catch (error) {
    next(error);
  }
};

module.exports = { getInsights };