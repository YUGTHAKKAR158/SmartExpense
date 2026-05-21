const predictionService = require('../services/predictionService');
const { sendSuccess } = require('../utils/response');

const getPredictions = async (req, res, next) => {
  try {
    const predictions = await predictionService.generatePredictions(req.user.id);
    sendSuccess(res, predictions, 'Predictions generated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getPredictions };