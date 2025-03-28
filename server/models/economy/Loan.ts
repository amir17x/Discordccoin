import mongoose, { Document, Schema } from 'mongoose';

// تعریف ساختار وام
export interface ILoan extends Document {
  borrowerId: number;
  lenderId: number;
  amount: number;
  interest: number;
  dueDate: Date;
  status: 'active' | 'repaid' | 'overdue';
  createdAt: Date;
  repaymentDate?: Date;
  description?: string;
}

// طرح اسکیما برای وام
const LoanSchema = new Schema<ILoan>(
  {
    borrowerId: { type: Number, required: true },
    lenderId: { type: Number, required: true },
    amount: { type: Number, required: true, min: 1 },
    interest: { type: Number, required: true, default: 0, min: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ['active', 'repaid', 'overdue'],
      default: 'active'
    },
    createdAt: { type: Date, default: Date.now },
    repaymentDate: { type: Date },
    description: { type: String }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ایجاد ایندکس‌های مورد نیاز برای بهبود کارایی
LoanSchema.index({ borrowerId: 1 });
LoanSchema.index({ lenderId: 1 });
LoanSchema.index({ status: 1 });
LoanSchema.index({ dueDate: 1 });
LoanSchema.index({ createdAt: -1 });

// ایجاد و صادر کردن مدل
export const LoanModel = mongoose.model<ILoan>('Loan', LoanSchema);

export default LoanModel;