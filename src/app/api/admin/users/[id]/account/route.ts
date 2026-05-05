import { UserRole } from "@/constants/enum";
import { updateAccountBalance } from "@/helpers/server/admin.accounts";
import { createTransactionDoc } from "@/helpers/server/transactions";

import { ApiResponse } from "@/utils/ApiResponse";
import connectDB from "@/utils/dbConnect";
import { withAuth } from "@/utils/withAuth";
import {
  UpdateUserAccountBalanceParams,
  UpdateUserAccountBalanceSchema,
} from "@/zod/account.schema";
import mongoose, { startSession } from "mongoose";

const addBalanceToUserAccount = withAuth<{ id: string }>(
  async (req, context) => {
    const { id: userId } = await context.params;
    const body = await req.json();
    const { amount, type, description } = body;
    const document: UpdateUserAccountBalanceParams = {
      amount,
      type,
      userId,
      description,
    };
    const parseResult = UpdateUserAccountBalanceSchema.safeParse(document);
    if (parseResult.success === false) {
      return ApiResponse.zodError(parseResult.error);
    }

    const { amount: parsedAmount, type: parsedType } = parseResult.data;

    await connectDB();
    const session = await startSession();

    try {
      session.startTransaction();

      const updatedAccount = await updateAccountBalance({
        accountId: undefined,
        userId,
        type: parsedType,
        amount: parsedAmount,
        session,
      });

      const transaction = await createTransactionDoc({
        data: {
          user: new mongoose.Types.ObjectId(userId),
          account: updatedAccount._id,
          amount: parsedAmount,
          type: parsedType,
          isMeal: false,
          description,
        },
        session,
      });

      const message = `Account balance updated successfully`;
      await session.commitTransaction();
      return ApiResponse.success(message, { transaction });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error updating account balance:", error);
      return ApiResponse.error("Failed to update account balance");
    }
  },
  { requiredRole: UserRole.admin },
);

export { addBalanceToUserAccount as PATCH };
