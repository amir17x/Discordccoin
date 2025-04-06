/**
 * مسیرهای مدیریت نقش‌های کاربری
 * 
 * این ماژول مسیرهای مربوط به مدیریت نقش‌های کاربری را تعریف می‌کند.
 */

import express from 'express';
import * as roleController from '../controllers/roleController.js';
import { isAuthenticated } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

// محافظت از تمامی مسیرها با middleware احراز هویت
router.use(isAuthenticated);

// مشاهده لیست نقش‌ها - نیاز به دسترسی مشاهده تنظیمات
router.get('/', checkPermission('settings:view'), roleController.listRoles);

// نمایش فرم ایجاد نقش جدید - نیاز به دسترسی ویرایش تنظیمات
router.get('/create', checkPermission('settings:edit'), roleController.showCreateRoleForm);

// ثبت نقش جدید - نیاز به دسترسی ویرایش تنظیمات
router.post('/create', checkPermission('settings:edit'), roleController.createRole);

// نمایش فرم ویرایش نقش - نیاز به دسترسی ویرایش تنظیمات
router.get('/edit/:id', checkPermission('settings:edit'), roleController.showEditRoleForm);

// ذخیره تغییرات نقش - نیاز به دسترسی ویرایش تنظیمات
router.post('/edit/:id', checkPermission('settings:edit'), roleController.updateRole);

// حذف نقش - نیاز به دسترسی ویرایش تنظیمات
router.post('/delete/:id', checkPermission('settings:edit'), roleController.deleteRole);

// نمایش جزئیات نقش - نیاز به دسترسی مشاهده تنظیمات
router.get('/view/:id', checkPermission('settings:view'), roleController.viewRoleDetails);

export default router;