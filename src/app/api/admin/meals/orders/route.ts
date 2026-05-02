import { DailyMealFor, MealStatus, UserRole } from "@/constants/enum";
import MealLog from "@/models/mealLogs.model";
import { ApiResponse } from "@/utils/ApiResponse";
import connectDB from "@/utils/dbConnect";
import { withAuth } from "@/utils/withAuth";

const getOrders = withAuth(
  async (req) => {
    const searchParams = req.nextUrl.searchParams;
    const options = {
      status: searchParams.get("status")?.toLowerCase() || "",
      count: searchParams.get("count") === "true",
      mealFor: searchParams.get("mealFor")?.toLowerCase() || "",
    };

    if (options.status !== "" && !(options.status in MealStatus)) {
      return ApiResponse.error("Invalid status", 400);
    }
    if (options.mealFor !== "" && !(options.mealFor in DailyMealFor)) {
      return ApiResponse.error("Invalid mealFor", 400);
    }
    await connectDB();
    if (options.count) {
      const count = await MealLog.countDocuments({
        status: options.status.toUpperCase(),
        ...(options.mealFor && { mealFor: options.mealFor.toUpperCase() }),
      });
      return ApiResponse.success(
        "Orders count fetched successfully",
        { count },
        200,
      );
    }
    console.log("options", options);

    const meals = await MealLog.aggregatePaginate([
      {
        $match: {
          ...(options.status && { status: options.status.toUpperCase() }),
          ...(options.mealFor && { mealFor: options.mealFor.toUpperCase() }),
        },
      },
      {
        $lookup: {
          from: "meals",
          localField: "meal",
          foreignField: "_id",
          as: "meal",
          pipeline: [
            {
              $project: {
                name: 1,
                price: 1,
              },
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
                // _id: 1,
                fullName: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          baseMealName: {
            $arrayElemAt: ["$meal.name", 0],
          },
          user: {
            $arrayElemAt: ["$user", 0],
          },
          extras: {
            $arrayElemAt: ["$extras.quantity", 0],
          },
        },
      },
      {
        $unset: ["meal"],
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);
    return ApiResponse.success("Orders fetched successfully", meals, 200);
  },
  { requiredRole: UserRole.admin },
);

export { getOrders as GET };
