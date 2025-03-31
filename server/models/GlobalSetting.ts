import { Schema, model, Document } from 'mongoose';

/**
 * ساختار داده‌های تنظیمات عمومی
 */
export interface IGlobalSetting extends Document {
  key: string;
  value: string;
  updatedAt: Date;
}

/**
 * طرح اسکیمای Mongoose برای تنظیمات عمومی
 */
const globalSettingSchema = new Schema<IGlobalSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const GlobalSettingModel = model<IGlobalSetting>('GlobalSetting', globalSettingSchema);