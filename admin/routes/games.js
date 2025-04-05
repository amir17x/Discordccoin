/**
 * مسیرهای مدیریت بازی‌ها پنل ادمین
 */

import express from 'express';
import { getGameStats, getGamesList, getGameById, toggleGameStatus, 
         updateGameSettings, getRecentGames, getUserGames, 
         updateGameChanceSettings, resetGameStats } from '../services/gameService.js';

const router = express.Router();

/**
 * صفحه اصلی مدیریت بازی‌ها
 */
router.get('/', async (req, res) => {
  try {
    const stats = await getGameStats();
    const games = await getGamesList();
    const recentGames = await getRecentGames(5);
    
    res.render('games/index', {
      title: 'مدیریت بازی‌ها',
      stats,
      games,
      recentGames
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری اطلاعات بازی‌ها: ${error.message}`);
    res.redirect('/admin/dashboard');
  }
});

/**
 * صفحه جزئیات یک بازی
 */
router.get('/details/:gameId', async (req, res) => {
  const { gameId } = req.params;
  
  try {
    const game = await getGameById(gameId);
    
    if (!game) {
      req.flash('error_msg', 'بازی موردنظر یافت نشد');
      return res.redirect('/admin/games');
    }
    
    res.render('games/details', {
      title: `جزئیات بازی ${game.name}`,
      game
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری اطلاعات بازی: ${error.message}`);
    res.redirect('/admin/games');
  }
});

/**
 * صفحه ویرایش تنظیمات بازی
 */
router.get('/edit/:gameId', async (req, res) => {
  const { gameId } = req.params;
  
  try {
    const game = await getGameById(gameId);
    
    if (!game) {
      req.flash('error_msg', 'بازی موردنظر یافت نشد');
      return res.redirect('/admin/games');
    }
    
    res.render('games/edit', {
      title: `ویرایش بازی ${game.name}`,
      game
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری اطلاعات بازی: ${error.message}`);
    res.redirect('/admin/games');
  }
});

/**
 * به‌روزرسانی تنظیمات بازی
 */
router.post('/edit/:gameId', async (req, res) => {
  const { gameId } = req.params;
  const settings = req.body;
  
  try {
    await updateGameSettings(gameId, settings);
    req.flash('success_msg', 'تنظیمات بازی با موفقیت به‌روزرسانی شد');
    res.redirect(`/admin/games/details/${gameId}`);
  } catch (error) {
    req.flash('error_msg', `خطا در به‌روزرسانی تنظیمات بازی: ${error.message}`);
    res.redirect(`/admin/games/edit/${gameId}`);
  }
});

/**
 * فعال/غیرفعال کردن بازی
 */
router.post('/toggle/:gameId', async (req, res) => {
  const { gameId } = req.params;
  const { enabled } = req.body;
  
  try {
    await toggleGameStatus(gameId, enabled === 'true');
    req.flash('success_msg', `بازی با موفقیت ${enabled === 'true' ? 'فعال' : 'غیرفعال'} شد`);
    
    // اگر درخواست از طریق AJAX آمده باشد JSON برمی‌گرداند
    if (req.xhr) {
      return res.json({ success: true });
    }
    
    res.redirect('/admin/games');
  } catch (error) {
    req.flash('error_msg', `خطا در تغییر وضعیت بازی: ${error.message}`);
    
    // اگر درخواست از طریق AJAX آمده باشد JSON برمی‌گرداند
    if (req.xhr) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    res.redirect('/admin/games');
  }
});

/**
 * صفحه مدیریت شانس بازی
 */
router.get('/chance/:gameId', async (req, res) => {
  const { gameId } = req.params;
  
  try {
    const game = await getGameById(gameId);
    
    if (!game) {
      req.flash('error_msg', 'بازی موردنظر یافت نشد');
      return res.redirect('/admin/games');
    }
    
    res.render('games/chance', {
      title: `مدیریت شانس ${game.name}`,
      game
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری اطلاعات بازی: ${error.message}`);
    res.redirect('/admin/games');
  }
});

/**
 * به‌روزرسانی تنظیمات شانس بازی
 */
router.post('/chance/:gameId', async (req, res) => {
  const { gameId } = req.params;
  const chanceSettings = req.body;
  
  try {
    await updateGameChanceSettings(gameId, chanceSettings);
    req.flash('success_msg', 'تنظیمات شانس بازی با موفقیت به‌روزرسانی شد');
    res.redirect(`/admin/games/details/${gameId}`);
  } catch (error) {
    req.flash('error_msg', `خطا در به‌روزرسانی تنظیمات شانس: ${error.message}`);
    res.redirect(`/admin/games/chance/${gameId}`);
  }
});

/**
 * ریست آمار بازی
 */
router.post('/reset/:gameId', async (req, res) => {
  const { gameId } = req.params;
  
  try {
    await resetGameStats(gameId);
    req.flash('success_msg', 'آمار بازی با موفقیت ریست شد');
    
    // اگر درخواست از طریق AJAX آمده باشد JSON برمی‌گرداند
    if (req.xhr) {
      return res.json({ success: true });
    }
    
    res.redirect(`/admin/games/details/${gameId}`);
  } catch (error) {
    req.flash('error_msg', `خطا در ریست آمار بازی: ${error.message}`);
    
    // اگر درخواست از طریق AJAX آمده باشد JSON برمی‌گرداند
    if (req.xhr) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    res.redirect(`/admin/games/details/${gameId}`);
  }
});

/**
 * مشاهده تاریخچه بازی‌های یک کاربر
 */
router.get('/user-games/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const games = await getUserGames(userId, 50);
    
    res.render('games/user-games', {
      title: 'بازی‌های کاربر',
      userId,
      games
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری بازی‌های کاربر: ${error.message}`);
    res.redirect('/admin/games');
  }
});

export default router;