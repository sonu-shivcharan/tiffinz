import { PaymentStatus, UserRole } from "@/constants/enum";
import AddBalanceRequest from "@/models/addBalanceRequest.model";
import { ApiResponse } from "@/utils/ApiResponse";
import connectDB from "@/utils/dbConnect";
import { withAuth } from "@/utils/withAuth";

type FilterType = {
  status?: PaymentStatus;
};
export const GET = withAuth(
  async (req) => {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") as PaymentStatus | null;
    const countOnly = searchParams.get("count") === "true";

    const filter: FilterType = {};
    if (status && Object.values(PaymentStatus).includes(status)) {
      filter.status = status;
    }
    await connectDB();
    if (countOnly) {
      const count = await AddBalanceRequest.countDocuments(filter);
      return ApiResponse.success(
        "Count fetched successfully",
        { count, status },
        200,
      );
    }
    const requests = await AddBalanceRequest.find(filter).populate({
      path: "user",
      select: "-password",
    });
    if (!requests || requests.length === 0) {
      return ApiResponse.error("No requests found", 404);
    }
    return ApiResponse.success(
      "Fetched requests successfully",
      { requests },
      200,
    );
  },
  {
    requiredRole: UserRole.admin,
  },
);
