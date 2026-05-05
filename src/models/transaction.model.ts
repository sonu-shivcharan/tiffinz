import { TransactionType } from "@/constants/enum";
import mongoose, {
  AggregatePaginateModel,
  model,
  models,
  Schema,
} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { IUser } from "./user.model";

interface ITransaction {
  _id?: mongoose.Types.ObjectId;
  amount: number;
  type: TransactionType;
  isMeal: boolean;
  mealLog?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  account: mongoose.Types.ObjectId;
  openingBalance?: number;
  closingBalance?: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
interface TransactionModel extends AggregatePaginateModel<ITransaction> {
  _sample?: string;
}
const transactionSchema = new Schema<ITransaction>(
  {
    amount: {
      type: Number,
      required: true,
    },
    openingBalance: {
      type: Number,
    },
    closingBalance: {
      type: Number,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      default: TransactionType.debit,
    },
    isMeal: {
      type: Boolean,
      default: true,
    },
    mealLog: {
      type: Schema.Types.ObjectId,
      ref: "MealLog",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true },
);
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ user: 1, mealLog: 1, createdAt: -1 });

transactionSchema.plugin(mongooseAggregatePaginate);
const Transaction =
  (models?.Transaction as TransactionModel) ||
  model<ITransaction>("Transaction", transactionSchema);
type ITransactionWithUser = ITransaction & {
  user: IUser;
};
export type { ITransaction, ITransactionWithUser };
export default Transaction;
