/**
 * مسیرهای مربوط به قالب Fluent UI
 */

import express from 'express';
import * as fluentController from '../controllers/fluentController.js';
import { checkAuth, redirectIfAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// مسیرهای عمومی
router.get('/login', redirectIfAuthenticated, fluentController.showLogin);
router.post('/login', redirectIfAuthenticated, fluentController.processLogin);
router.get('/logout', fluentController.logout);

// مسیرهای نیازمند احراز هویت
router.get('/dashboard', checkAuth, fluentController.showDashboard);
router.get('/profile', checkAuth, fluentController.showProfile);

// مسیرهای منوی سایدبار
router.get('/servers', checkAuth, fluentController.showServers);
router.get('/users', checkAuth, fluentController.showUsers);
router.get('/economy', checkAuth, fluentController.showEconomy);
router.get('/shop', checkAuth, fluentController.showShop);
router.get('/stock-market', checkAuth, fluentController.showStockMarket);
router.get('/lottery', checkAuth, fluentController.showLottery);
router.get('/bank', checkAuth, fluentController.showBank);
router.get('/logs', checkAuth, fluentController.showLogs);
router.get('/settings', checkAuth, fluentController.showSettings);

// API ها
router.get('/api/refresh-status', checkAuth, fluentController.refreshStatus);

export default router;