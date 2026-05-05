import { TransactionType } from "@/constants/enum";
import Account, { IAccount } from "@/models/account.model";
import { ApiError } from "@/utils/apiError";
import connectDB from "@/utils/dbConnect";
import { handleError } from "@/utils/handleError";
import { UpdateUserAccountBalanceParams } from "@/zod/account.schema";
import { ClientSession, isValidObjectId } from "mongoose";
import { createTransaction } from "./transactions";

async function doesUserAccountExist(
  userId: string,
): Promise<boolean | IAccount> {
  try {
    await connectDB();
    const existingAccount = await Account.findOne({ user: userId });
    return !!existingAccount;
  } catch (error) {
    throw handleError(error);
  }
}

async function createAccount(userId: string) {
  if (!isValidObjectId(userId)) {
    throw new ApiError("Invalid User ID", 400);
  }

  await connectDB();
  console.log("creating user account with id", userId);
  const existingAccount = await doesUserAccountExist(userId);
  if (existingAccount) {
    throw new ApiError("Account already exists", 400);
  }
  const newAccount: IAccount = await Account.create({
    user: userId,
    balace: 0,
  });
  if (!newAccount) {
    throw new ApiError("Failed to create new user account", 500);
  }
  return newAccount;
}
/**
 *
 * @deprecated - use `updateAccountBalance` instead
 */
async function updateUserAccountBalance(data: UpdateUserAccountBalanceParams) {
  const { amount, accountId, userId, type, description } = data;
  if (!userId && !accountId) {
    throw new ApiError("Either userId or accountId is required", 400);
  }
  if (accountId && !isValidObjectId(accountId)) {
    throw new ApiError("Invalid Account ID", 400);
  }
  if (userId && !isValidObjectId(userId)) {
    throw new ApiError("Invalid User ID", 400);
  }

  await connectDB();
  const account: IAccount = (await Account.findOne({
    user: userId,
  })) as IAccount;
  if (!account) {
    throw new ApiError("Account not found", 404);
  }
  if (type === TransactionType.credit) {
    account.balance += amount;
  } else if (type === TransactionType.debit) {
    account.balance -= amount;
  } else {
    throw new ApiError("Invalid transaction type", 400);
  }
  console.log("account", account);
  await account.save();
  const transaction = await createTransaction({
    amount,
    type,
    account: account._id,
    user: account.user,
    isMeal: false,
    ...(description && { description }),
  });
  return { transaction };
}

type UpdateAccountBalanceParams = {
  accountId: string | undefined;
  type: TransactionType;
  amount: number;
  userId?: string;
  session?: ClientSession;
};
/*
- updates the account balance based on the transaction type and amount
- if session is provided, it will use the session to update the account balance, otherwise it will update without session
*/
async function updateAccountBalance({
  accountId,
  amount,
  type,
  userId,
  session,
}: UpdateAccountBalanceParams) {
  console.log("accountId", accountId);
  if (!isValidObjectId(accountId) && !isValidObjectId(userId)) {
    throw new ApiError("Invalid Account ID", 400);
  }
  await connectDB();
  try {
    const updatedAccount = await Account.findOneAndUpdate(
      { ...(accountId ? { _id: accountId } : { user: userId }) },
      {
        $inc: {
          balance: type === TransactionType.debit ? -amount : amount,
        },
      },
      { new: true, session },
    );

    if (!updatedAccount) {
      throw new ApiError("Account not found", 404);
    }
    return updatedAccount;
  } catch (error) {
    session?.abortTransaction();
    console.error("Error while updating account balance", error);
    throw new ApiError("Failed to update account balance", 500);
  }
}
export {
  createAccount,
  doesUserAccountExist,
  updateUserAccountBalance,
  updateAccountBalance,
};
