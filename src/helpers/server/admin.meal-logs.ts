import { MealStatus, TransactionType } from "@/constants/enum";
import Meal, { IMeal } from "@/models/meal.model";
import MealLog from "@/models/mealLogs.model";
import { ApiError } from "@/utils/apiError";
import connectDB from "@/utils/dbConnect";
import { MealLogSchemaInputType } from "@/zod/mealLog.schema";
import mongoose, { isValidObjectId, Types } from "mongoose";
import { ITransaction } from "@/models/transaction.model";
import { createTransaction, createTransactionDoc } from "./transactions";
import { updateAccountBalance } from "./admin.add-balance";
import { handleError } from "@/utils/handleError";
import Account from "@/models/account.model";

type createMealOptions = {
  userId: string;
  mealId: string;
  adminId: string;
  mealStatus?: MealStatus;
  description?: string;
  session?: mongoose.mongo.ClientSession;
};
async function createMealLog(
  mealData: MealLogSchemaInputType,
  {
    adminId,
    mealId,
    mealStatus = MealStatus.taken,
    userId,
    session,
  }: createMealOptions,
) {
  if (!isValidObjectId(userId)) {
    throw new ApiError("Invalid user id", 400);
  }
  if (!isValidObjectId(mealId)) {
    throw new ApiError("Invalid meal id", 400);
  }
  await connectDB();

  const meal: IMeal | null = await Meal.findById(mealId);
  if (!meal) {
    throw new ApiError("Meal not found", 404);
  }
  const mealLogDoc = {
    ...mealData,
    user: userId,
    meal: meal._id,
    totalAmount: meal.price,
    status: mealStatus,
    updatedBy: adminId,
  };
  const mealLog = await MealLog.create([mealLogDoc], { session });
  if (!mealLog) {
    throw new ApiError("Failed to order meal", 500);
  }
  return mealLog;
}

/** 
 * @deprecated instead use ` markMealAsTaken()`
- Marks meal as taken in meal logs 
- Updates user's account balance by deducting meal cost
- Creates a transaction record for the meal deduction
*/
async function markMealTakenAndUpdateAccountBalance(
  mealLogData: MealLogSchemaInputType,
  { adminId, mealId, userId, description }: createMealOptions,
) {
  try {
    const mealLog = await createMealLog(mealLogData, {
      mealId,
      adminId,
      userId,
      mealStatus: MealStatus.taken,
    });
    const totalAmountToDeduct = mealLog[0].totalAmount;
    const { account: userAccount, updateType: transactionType } =
      await updateAccountBalance(userId, -totalAmountToDeduct);

    const transactionDoc: ITransaction = {
      account: userAccount._id,
      amount: totalAmountToDeduct,
      isMeal: true,
      type: transactionType,
      user: new Types.ObjectId(userId),
      mealLog: mealLog[0]._id,
      ...(description && { description }),
    };
    const transaction = await createTransaction(transactionDoc);
    return {
      transactionId: transaction._id,
      userAccount,
      mealLog,
      transaction,
    };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Marks meal as taken in meal logs ensuring atomicity
 - Updates user's account balance by deducting meal cost
 - Creates a transaction record for the meal deduction
 */
async function markAsMealTaken(
  mealLogData: MealLogSchemaInputType,
  { adminId, mealId, userId, description }: createMealOptions,
) {
  if (!isValidObjectId(adminId)) {
    throw new ApiError("Invalid adminId", 409);
  } else if (!isValidObjectId(mealId)) {
    throw new ApiError("Invalid mealId", 409);
  } else if (!isValidObjectId(userId)) {
    throw new ApiError("Invalid userId", 409);
  }
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const mealLog = await createMealLog(mealLogData, {
      adminId,
      mealId,
      userId,
      mealStatus: MealStatus.taken,
      session,
    });
    const totalAmountToDeduct = mealLog[0].totalAmount;
    const updatedAccount = await Account.findOneAndUpdate(
      { user: userId },
      {
        $inc: { balance: -totalAmountToDeduct },
      },
      { new: true, session },
    );
    // if account not found, throw an error to abort the transaction
    if (!updatedAccount) {
      throw new ApiError("Account not found for the user", 404);
    }
    const closingBalance = updatedAccount.balance;
    const openingBalance = closingBalance + totalAmountToDeduct;
    // now create a transaction doc
    const transactionDoc: ITransaction = {
      account: updatedAccount._id,
      amount: totalAmountToDeduct,
      isMeal: true,
      type: TransactionType.debit,
      user: new Types.ObjectId(userId),
      mealLog: mealLog[0]._id,
      openingBalance: openingBalance,
      ...(description && { description }),
    };
    const newTransaction = await createTransactionDoc({
      data: transactionDoc,
      session,
    });

    await session.commitTransaction();
    return {
      transactionId: newTransaction._id,
      userAccount: updatedAccount,
      mealLog: mealLog[0],
      transaction: newTransaction,
    };
  } catch (error) {
    await session.abortTransaction();
    throw handleError(error);
  }
}

export { createMealLog, markMealTakenAndUpdateAccountBalance, markAsMealTaken };
