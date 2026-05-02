import { TransactionType, UserRole } from "@/constants/enum";
import Transaction from "@/models/transaction.model";
import { ApiResponse } from "@/utils/ApiResponse";
import connectDB from "@/utils/dbConnect";
import { withAuth } from "@/utils/withAuth";

export const GET = withAuth(
  async () => {
    await connectDB();
    const totalMoneyRecievedMonthly = await Transaction.aggregate([
      {
        $match: {
          type: TransactionType.credit,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $addFields: {
          year: "$_id.year",
          month: "$_id.month",
          _id: "$$REMOVE",
        },
      },
      {
        $sort: {
          year: -1,
          month: -1,
        },
      },
      {
        $limit: 6,
      },
      {
        $sort: {
          year: 1,
          month: 1,
        },
      },
    ]);
    return ApiResponse.success("Admin route", { totalMoneyRecievedMonthly });
  },
  { requiredRole: UserRole.admin },
);
