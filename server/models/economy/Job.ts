import mongoose, { Document, Schema } from 'mongoose';

// تعریف ساختار شغل
export interface IJob extends Document {
  userId: number;
  jobType: string;
  income: number;
  cyclePeriod: number; // ساعت
  lastCollected: Date;
  level: number;
  xp: number;
  xpRequired: number;
  hiredAt: Date;
}

// طرح اسکیما برای شغل
const JobSchema = new Schema<IJob>(
  {
    userId: { type: Number, required: true, unique: true },
    jobType: { type: String, required: true },
    income: { type: Number, required: true, min: 1 },
    cyclePeriod: { type: Number, required: true, min: 1 }, // ساعت
    lastCollected: { type: Date, default: Date.now },
    level: { type: Number, required: true, default: 1, min: 1 },
    xp: { type: Number, required: true, default: 0, min: 0 },
    xpRequired: { type: Number, required: true, default: 100, min: 1 },
    hiredAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ایجاد ایندکس‌های مورد نیاز برای بهبود کارایی
JobSchema.index({ userId: 1 }, { unique: true });
JobSchema.index({ jobType: 1 });
JobSchema.index({ lastCollected: 1 });
JobSchema.index({ level: -1 });

// ایجاد و صادر کردن مدل
export const JobModel = mongoose.model<IJob>('Job', JobSchema);

export default JobModel;