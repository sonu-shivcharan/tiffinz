import { TransactionType } from "@/constants/enum";
import Account from "@/models/account.model";
import Transaction, { ITransaction } from "@/models/transaction.model";
import { ApiError } from "@/utils/apiError";
import connectDB from "@/utils/dbConnect";
import { ClientSession, PaginateOptions, PipelineStage, Types } from "mongoose";
import { isValidObjectId } from "mongoose";

/**
 *
 * @param transactionDoc
 * @returns
 * @deprecated - use `createTransactionDoc`
 */
async function createTransaction(transactionDoc: ITransaction) {
  if (!isValidObjectId(transactionDoc.account)) {
    throw new ApiError("Inavlid Account id");
  }
  if (!isValidObjectId(transactionDoc.user)) {
    throw new ApiError("Inavlid user id");
  }
  await connectDB();
  const newTransaction = await Transaction.create(transactionDoc);

  if (!newTransaction) {
    throw new ApiError("Failed to create a transaction");
  }
  return newTransaction;
}

async function getTransactionById(transactionId: string, userId?: string) {
  if (!isValidObjectId(transactionId)) {
    throw new ApiError("Invalid Transaction ID");
  }
  if (userId && !isValidObjectId(userId)) {
    throw new ApiError("Invalid User id");
  }
  await connectDB();
  const query = {
    _id: transactionId,
    ...(userId && { user: userId }),
  };
  const transaction = await Transaction.findOne(query)
    .populate("mealLog")
    .populate({ path: "mealLog", populate: { path: "meal" } })
    .populate({ path: "mealLog", populate: { path: "extras.extras" } });
  if (!userId) {
    await transaction?.populate({ path: "user", select: "-password" });
  }

  if (!transaction) {
    throw new ApiError("Transaction not found", 404);
  }
  return transaction;
}

async function getUserTransactions(userId: string, options: PaginateOptions) {
  if (!isValidObjectId(userId)) {
    throw new ApiError("Invalid User id");
  }
  await connectDB();
  const transactions = await Transaction.aggregatePaginate(
    [{ $match: { user: new Types.ObjectId(userId) } }],
    { ...options },
  );
  return transactions;
}

// using agggregation pipeline in this function
async function getTransactionWithPopuplatedFields(
  transactionId: string,
  userId?: string,
) {
  if (!isValidObjectId(transactionId)) {
    throw new ApiError("Invalid Transaction ID");
  }
  if (userId && !isValidObjectId(userId)) {
    throw new ApiError("Invalid User ID");
  }
  await connectDB();
  const pipeline: PipelineStage[] = [
    {
      $match: {
        _id: new Types.ObjectId(transactionId),
        ...(userId && { user: new Types.ObjectId(userId) }),
      },
    },
    {
      $lookup: {
        from: "meallogs",
        localField: "mealLog",
        foreignField: "_id",
        as: "mealLog",
        pipeline: [
          {
            $lookup: {
              from: "meals",
              localField: "meal",
              foreignField: "_id",
              as: "meal",
            },
          },
          {
            $lookup: {
              from: "meals",
              let: { extrasArr: "$extras" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: ["$_id", "$$extrasArr.extras"],
                    },
                  },
                },
                {
                  $project: {
                    name: 1,
                    price: 1,
                  },
                },
              ],
              as: "populated",
            },
          },
          {
            $addFields: {
              extras: {
                $map: {
                  input: "$extras",
                  as: "extraItem",
                  in: {
                    quantity: "$$extraItem.quantity",
                    details: {
                      $first: {
                        $filter: {
                          input: "$populated",
                          as: "populatedItem",
                          cond: {
                            $eq: ["$$populatedItem._id", "$$extraItem.extras"],
                          },
                        },
                      },
                    },
                  },
                },
              },
              meal: { $first: "$meal" },
            },
          },
          {
            $addFields: {
              priceBreakdown: {
                basePrice: "$meal.price",
                extrasTotal: {
                  $first: {
                    $map: {
                      input: "$extras",
                      as: "extraItem",
                      in: {
                        $multiply: [
                          "$$extraItem.quantity",
                          "$$extraItem.details.price",
                        ],
                      },
                    },
                  },
                },
                total: "$totalAmount",
              },
            },
          },
          {
            $unset: "populated",
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              fullName: 1,
              email: 1,
              role: 1,
              username: 1,
              phone: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        mealLog: { $first: "$mealLog" },
        user: { $first: "$user" },
      },
    },
  ];
  const transaction = await Transaction.aggregate(pipeline);
  if (transaction.length === 0) {
    throw new ApiError("Transaction not found", 404);
  }
  return transaction[0];
}

type CreateTransactionDocParams = {
  data: ITransaction;
  session: ClientSession;
  currentBalance?: number;
};

/**
 *
 * @param data - transaction data
 * @param session - mongoose client session for transaction
 * @returns created transaction document
 * @description This function creates a transaction document and calculates the opening and closing balance based on the transaction type. It uses the provided session for transaction management.
 *  ### **Note**:
 *  - This function does not update the account balance, it only creates the transaction document. The account balance should be updated separately to ensure data consistency, especially when using transactions.
 *  - account balance should be updated in the same transaction to maintain data integrity. You can use the `updateAccountBalance` function to update the account balance.
 *  - If the `openingBalance` is not provided in the `data`, it will fetch the current balance from the account document. This is to ensure that the transaction document has accurate opening and closing balance values.
 */
async function createTransactionDoc({
  data,
  session,
}: CreateTransactionDocParams) {
  await connectDB();
  try {
    let openingBalance = 0;
    if (data.openingBalance !== undefined) {
      openingBalance = data.openingBalance;
    } else {
      const account = await Account.findById(data.account).session(session);
      openingBalance = account?.balance || 0;
    }
    const closingBalance =
      data.type === TransactionType.credit
        ? openingBalance + data.amount
        : openingBalance - data.amount;

    const newTransaction = await Transaction.create(
      [{ ...data, openingBalance, closingBalance }],
      { session },
    );
    if (!newTransaction || newTransaction.length === 0) {
      throw new ApiError("Failed to create a transaction");
    }
    return newTransaction[0];
  } catch (error: unknown) {
    await session.abortTransaction();
    console.error("Failed to create transaction", error);
    throw new ApiError("Failed to create transaction", 500);
  }
}

export {
  createTransaction,
  createTransactionDoc,
  getTransactionById,
  getUserTransactions,
  getTransactionWithPopuplatedFields,
};
