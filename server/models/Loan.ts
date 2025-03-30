import mongoose from 'mongoose';
import { Loan } from '../storage';

// شمای مانگو برای وام‌ها
const loanSchema = new mongoose.Schema({
  id: { type: String, required: true, index: true },
  userId: { type: Number, required: true, index: true },
  amount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  requestDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'paid', 'overdue', 'confiscated'], required: true },
  type: { type: String, enum: ['small', 'medium', 'large'], required: true }
});

// مدل وام
const LoanModel = mongoose.model<Loan & mongoose.Document>('Loan', loanSchema);

export default LoanModel;