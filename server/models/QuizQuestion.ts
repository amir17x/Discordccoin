import mongoose, { Schema, Document } from 'mongoose';

/**
 * مدل سوال برای بازی اطلاعات عمومی
 */
export interface QuizQuestion extends Document {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  addedBy?: string; // شناسه کاربر اضافه‌کننده
  approved: boolean; // وضعیت تأیید سوال
  approvedBy?: string; // شناسه کاربر تأیید‌کننده
  createdAt: Date;
  reward?: number; // پاداش برای کاربر اضافه‌کننده در صورت تأیید
}

/**
 * اسکیمای سوال اطلاعات عمومی
 */
const QuizQuestionSchema = new Schema<QuizQuestion>({
  id: { type: String, required: true, unique: true },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: Number, required: true },
  category: { type: String, required: true },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['easy', 'medium', 'hard'] 
  },
  addedBy: { type: String },
  approved: { type: Boolean, default: false },
  approvedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  reward: { type: Number, default: 50 } // پاداش پیش‌فرض 50 کوین
});

// ایجاد یک ایندکس برای جستجوی سریع‌تر
QuizQuestionSchema.index({ category: 1, difficulty: 1, approved: 1 });

// ساخت مدل
export const QuizQuestionModel = mongoose.model<QuizQuestion>('QuizQuestion', QuizQuestionSchema);

// صادر کردن مدل
export default QuizQuestionModel;