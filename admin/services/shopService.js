/**
 * سرویس فروشگاه
 * 
 * این ماژول شامل توابع مدیریت فروشگاه و آیتم‌ها است.
 */

import { Shop } from '../models/shop.js';
import { Item } from '../models/item.js';
import { Transaction } from '../models/transaction.js';

/**
 * سرویس مدیریت فروشگاه
 */
export const shopService = {
  /**
   * دریافت تمام فروشگاه‌ها
   * @returns {Promise<Array>} لیست فروشگاه‌ها
   */
  getAllShops: async () => {
    try {
      return await Shop.find().sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error in getAllShops:', error);
      throw error;
    }
  },

  /**
   * دریافت یک فروشگاه با شناسه
   * @param {string} shopId شناسه فروشگاه
   * @returns {Promise<Object>} اطلاعات فروشگاه
   */
  getShopById: async (shopId) => {
    try {
      return await Shop.findById(shopId);
    } catch (error) {
      console.error(`Error in getShopById for ID ${shopId}:`, error);
      throw error;
    }
  },

  /**
   * ایجاد فروشگاه جدید
   * @param {Object} shopData اطلاعات فروشگاه
   * @returns {Promise<Object>} فروشگاه ایجاد شده
   */
  createShop: async (shopData) => {
    try {
      const newShop = new Shop(shopData);
      return await newShop.save();
    } catch (error) {
      console.error('Error in createShop:', error);
      throw error;
    }
  },

  /**
   * به‌روزرسانی یک فروشگاه
   * @param {string} shopId شناسه فروشگاه
   * @param {Object} shopData اطلاعات جدید فروشگاه
   * @returns {Promise<Object>} فروشگاه به‌روزرسانی شده
   */
  updateShop: async (shopId, shopData) => {
    try {
      return await Shop.findByIdAndUpdate(shopId, shopData, { new: true });
    } catch (error) {
      console.error(`Error in updateShop for ID ${shopId}:`, error);
      throw error;
    }
  },

  /**
   * حذف یک فروشگاه
   * @param {string} shopId شناسه فروشگاه
   * @returns {Promise<Object>} نتیجه حذف
   */
  deleteShop: async (shopId) => {
    try {
      return await Shop.findByIdAndDelete(shopId);
    } catch (error) {
      console.error(`Error in deleteShop for ID ${shopId}:`, error);
      throw error;
    }
  },

  /**
   * دریافت تمام آیتم‌ها
   * @returns {Promise<Array>} لیست آیتم‌ها
   */
  getAllItems: async () => {
    try {
      return await Item.find().sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error in getAllItems:', error);
      throw error;
    }
  },

  /**
   * دریافت آیتم‌های یک فروشگاه
   * @param {string} shopId شناسه فروشگاه
   * @returns {Promise<Array>} لیست آیتم‌ها
   */
  getItemsByShopId: async (shopId) => {
    try {
      return await Item.find({ shopId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error(`Error in getItemsByShopId for shop ID ${shopId}:`, error);
      throw error;
    }
  },

  /**
   * دریافت یک آیتم با شناسه
   * @param {string} itemId شناسه آیتم
   * @returns {Promise<Object>} اطلاعات آیتم
   */
  getItemById: async (itemId) => {
    try {
      return await Item.findById(itemId);
    } catch (error) {
      console.error(`Error in getItemById for ID ${itemId}:`, error);
      throw error;
    }
  },

  /**
   * ایجاد آیتم جدید
   * @param {Object} itemData اطلاعات آیتم
   * @returns {Promise<Object>} آیتم ایجاد شده
   */
  createItem: async (itemData) => {
    try {
      const newItem = new Item(itemData);
      return await newItem.save();
    } catch (error) {
      console.error('Error in createItem:', error);
      throw error;
    }
  },

  /**
   * به‌روزرسانی یک آیتم
   * @param {string} itemId شناسه آیتم
   * @param {Object} itemData اطلاعات جدید آیتم
   * @returns {Promise<Object>} آیتم به‌روزرسانی شده
   */
  updateItem: async (itemId, itemData) => {
    try {
      return await Item.findByIdAndUpdate(itemId, itemData, { new: true });
    } catch (error) {
      console.error(`Error in updateItem for ID ${itemId}:`, error);
      throw error;
    }
  },

  /**
   * حذف یک آیتم
   * @param {string} itemId شناسه آیتم
   * @returns {Promise<Object>} نتیجه حذف
   */
  deleteItem: async (itemId) => {
    try {
      return await Item.findByIdAndDelete(itemId);
    } catch (error) {
      console.error(`Error in deleteItem for ID ${itemId}:`, error);
      throw error;
    }
  },

  /**
   * دریافت تراکنش‌های خرید آیتم‌ها
   * @param {number} limit تعداد نتایج
   * @returns {Promise<Array>} لیست تراکنش‌ها
   */
  getItemPurchases: async (limit = 10) => {
    try {
      return await Transaction.find({ type: 'purchase' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('itemId');
    } catch (error) {
      console.error('Error in getItemPurchases:', error);
      throw error;
    }
  },

  /**
   * دریافت آمار فروش آیتم‌ها
   * @returns {Promise<Object>} آمار فروش
   */
  getItemSalesStats: async () => {
    try {
      // تعداد کل فروش در هر فروشگاه
      const shopSales = await Transaction.aggregate([
        { $match: { type: 'purchase' } },
        { $lookup: { from: 'items', localField: 'itemId', foreignField: '_id', as: 'item' } },
        { $unwind: '$item' },
        { $lookup: { from: 'shops', localField: 'item.shopId', foreignField: '_id', as: 'shop' } },
        { $unwind: '$shop' },
        { $group: { _id: '$shop._id', shopName: { $first: '$shop.name' }, count: { $sum: 1 }, total: { $sum: '$amount' } } },
        { $sort: { total: -1 } }
      ]);

      // پرفروش‌ترین آیتم‌ها
      const topItems = await Transaction.aggregate([
        { $match: { type: 'purchase' } },
        { $lookup: { from: 'items', localField: 'itemId', foreignField: '_id', as: 'item' } },
        { $unwind: '$item' },
        { $group: { _id: '$itemId', itemName: { $first: '$item.name' }, count: { $sum: 1 }, total: { $sum: '$amount' } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      return {
        shopSales,
        topItems
      };
    } catch (error) {
      console.error('Error in getItemSalesStats:', error);
      throw error;
    }
  }
};