/**
 * مسیر تست API
 */
import express from 'express';

const router = express.Router();

// صفحه تست API
router.get('/test-api', (req, res) => {
    res.render('test-api', { layout: false });
});

export default router;
