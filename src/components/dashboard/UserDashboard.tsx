"use client";
import { IUser } from "@/models/user.model";
import AccountCard, { AccountCardSkeleton } from "@/components/dashboard/wallet/AccountCard";
import MealLogsList, { MealLogsListSkeleton, MealLogListItemType } from "./meals/MealLogsList";
import { useQueries } from "@tanstack/react-query";
import { getCurrentUserAccount } from "@/helpers/client/user.account";
import { getAllMealLogs } from "@/helpers/client/meal";
import { IAccount } from "@/models/account.model";
import { PaginatedResult } from "@/helpers/client/client.types";

function UserDashboard({ user }: { user: IUser }) {
  const [accountQuery, mealLogsQuery] = useQueries({
    queries: [
      {
        queryKey: ["currentUserAccount"],
        queryFn: getCurrentUserAccount,
        retry: false,
        enabled: !!user?.isVerified,
      },
      {
        queryKey: ["getUserMealLogs", user._id?.toString()],
        queryFn: () => getAllMealLogs({ userId: user._id?.toString() as string, limit: 5 }),
        refetchOnWindowFocus: false,
      },
    ],
  });

  const isAccountLoading = !!user?.isVerified && accountQuery.isLoading;
  const isMealLogsLoading = mealLogsQuery.isLoading;

  return (
    <div className="px-2 py-4 space-y-4">
      <h1 className="text-2xl font-semibold mb-2">Welcome, {user.fullName}!</h1>

      {isAccountLoading ? (
        <AccountCardSkeleton />
      ) : (
        <AccountCard
          account={accountQuery.data as IAccount}
          error={accountQuery.error}
          user={user}
        />
      )}

      {isMealLogsLoading ? (
        <MealLogsListSkeleton />
      ) : (
        <MealLogsList
          userId={user._id?.toString() as string}
          data={mealLogsQuery.data as PaginatedResult<MealLogListItemType>}
          error={mealLogsQuery.error}
        />
      )}
    </div>
  );
}

export default UserDashboard;

