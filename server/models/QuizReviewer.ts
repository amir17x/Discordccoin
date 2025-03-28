import mongoose, { Schema, Document } from 'mongoose';

/**
 * مدل داور سوالات اطلاعات عمومی
 */
export interface QuizReviewer extends Document {
  userId: string;
  username: string;
  appointedAt: Date;
  appointedBy: string;
  totalReviewed: number;
  totalApproved: number;
  totalRejected: number;
  isActive: boolean;
  lastActivity: Date;
}

/**
 * اسکیمای داور سوالات اطلاعات عمومی
 */
const QuizReviewerSchema = new Schema<QuizReviewer>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  appointedAt: { type: Date, default: Date.now },
  appointedBy: { type: String, required: true },
  totalReviewed: { type: Number, default: 0 },
  totalApproved: { type: Number, default: 0 },
  totalRejected: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastActivity: { type: Date, default: Date.now }
});

// ساخت مدل
export const QuizReviewerModel = mongoose.model<QuizReviewer>('QuizReviewer', QuizReviewerSchema);

// صادر کردن مدل
export default QuizReviewerModel;