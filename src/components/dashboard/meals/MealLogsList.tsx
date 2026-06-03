"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatToIndianCurrency } from "@/lib/utils";
import { getSmartDate } from "@/lib/date-format";
import { Button } from "@/components/ui/button";
import { PaginatedResult } from "@/helpers/client/client.types";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getAllMealLogs } from "@/helpers/client/meal";

export type MealLogListItemType = {
  _id: string;
  mealFor?: number;
  totalAmount?: number;
  date?: string;
  createdAt?: string;
  status?: string;
};

export function MealLogsListSkeleton() {
  return (
    <Card className="w-full md:max-w-md mx-auto bg-transparent shadow-none px-0 mt-2">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent Tiffins</CardTitle>
      </CardHeader>
      <CardContent className="p-0 mt-0 border-t">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center p-4 border-b">
            <div className="flex gap-2 flex-col justify-center">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="text-right">
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </CardContent>
      <div className="text-center mt-4">
        <Skeleton className="h-9 w-28 mx-auto rounded-md" />
      </div>
    </Card>
  );
}

interface MealLogsListProps {
  userId: string;
  data?: PaginatedResult<MealLogListItemType> | null;
  error?: Error | null;
  isLoading?: boolean;
}

function MealLogsList({ userId, data: propData, error: propError, isLoading: propIsLoading }: MealLogsListProps) {
  const hasProps = propData !== undefined;

  const { data: queryData, error: queryError, isLoading: queryLoading } = useQuery<
    PaginatedResult<MealLogListItemType>
  >({
    queryKey: ["getUserMealLogs", userId],
    queryFn: () => getAllMealLogs({ userId, limit: 5 }),
    refetchOnWindowFocus: false,
    enabled: !hasProps,
  });

  const data = hasProps ? propData : queryData;
  const error = hasProps ? propError : queryError;
  const isLoading = hasProps ? propIsLoading : queryLoading;

  if (isLoading) {
    return <MealLogsListSkeleton />;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive px-4 py-3">
        Unable to load meal logs.
      </div>
    );
  }

  const logs = data?.docs || [];
  if (!logs || logs.length === 0) {
    return null;
  }

  return (
    <Card className="w-full md:max-w-md mx-auto bg-transparent shadow-none px-0 mt-2">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent Tiffins</CardTitle>
      </CardHeader>
      <CardContent className="p-0 mt-0 border-t">
        {logs.map((mealLog) => (
          <MealLogListItem key={String(mealLog._id)} mealLog={mealLog} />
        ))}
      </CardContent>
      <div className="text-center mt-4">
        <Button variant="outline" size="sm" className="px-8" asChild>
          <Link href={`/dashboard/meal-logs?user=${userId}`} prefetch={false}>
            View All <ArrowRight className="ml-1" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

export function MealLogListItem({ mealLog }: { mealLog: MealLogListItemType }) {
  const dateValue = mealLog.date ? getSmartDate(mealLog.date) : "-";
  const amountValue = formatToIndianCurrency(mealLog.totalAmount ?? 0);

  return (
    <Link href={`/dashboard/meal-logs/${mealLog._id}`} prefetch={false}>
      <div className="flex justify-between items-center p-4 hover:bg-accent/50 duration-100 border-b cursor-pointer">
        <div className="flex gap-2 flex-col justify-center">
          {mealLog.status ? (
            <Badge variant={"secondary"} className=" ">
              {mealLog.mealFor}
            </Badge>
          ) : null}
          <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded-xl">
            {dateValue}
          </span>
        </div>

        <div className="text-right">
          <span className="font-medium text-shadow-muted">{amountValue}</span>
        </div>
      </div>
    </Link>
  );
}

export default MealLogsList;

