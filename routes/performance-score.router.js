import express from 'express';
import PerformanceController from '../controllers/performance-score.controller.js';

const performanceScoreRouter = express.Router();

const performanceController = new PerformanceController();

performanceScoreRouter.put('/:userId', performanceController.updateUserPerformance.bind(performanceController));
performanceScoreRouter.get('/:userId/history', performanceController.getPerformanceHistory.bind(performanceController));
performanceScoreRouter.get('/leaderboard', performanceController.getLeaderboard.bind(performanceController));
performanceScoreRouter.post('/performance/batch-update', performanceController.batchUpdate.bind(performanceController));

 export default performanceScoreRouter;