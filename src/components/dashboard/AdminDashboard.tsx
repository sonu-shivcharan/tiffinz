"use client";

import { IUser } from "@/models/user.model";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useQueries } from "@tanstack/react-query";
import Loader from "../ui/Loader";
import { MealStatus, PaymentStatus } from "@/constants/enum";
import { getRequests } from "@/helpers/client/add-balance";
import { Button } from "../ui/button";
import Link from "next/link";
import { getUsers } from "@/helpers/client/admin.users";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { setUsers } from "@/store/usersSlice";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

import axios from "axios";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { CreditCard, Users, Utensils, IndianRupee } from "lucide-react";

function AdminDashboard({ user }: { user: IUser }) {
  const [
    {
      data: pendingRequestsData,
      error: pendingRequestsError,
      isLoading: pendingRequestsLoading,
    },
    {
      data: unverifiedUsersData,
      error: unverifiedUsersError,
      isLoading: unverifiedUsersLoading,
    },
    {
      data: totalSalesData,
      error: totalSalesError,
      isLoading: totalSalesLoading,
    },
    {
      data: ordersCountData,
      error: ordersCountError,
      isLoading: ordersCountLoading,
    },
  ] = useQueries({
    queries: [
      {
        queryKey: ["getPendingRequestsCount", PaymentStatus.pending],
        queryFn: () => getRequestsCount(PaymentStatus.pending),
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ["getUnVerifiedUsers", false],
        queryFn: () => getUsersCount(false),
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ["getTotalSales"],
        queryFn: () => axios.get("api/admin/dashboard").then((res) => res.data),
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ["getOrdersCount", MealStatus.not_taken],
        queryFn: () =>
          axios
            .get(
              `api/admin/meals/orders?status=${MealStatus.not_taken}&count=true`,
            )
            .then((res) => res.data),
        refetchOnWindowFocus: false,
      },
    ],
  });

  return (
    <div className="px-2 pt-6">
      <h1 className="text-2xl font-semibold mb-4">Welcome, {user.fullName}!</h1>
      <div className="flex items-center md:items-start justify-center flex-col md:flex-row flex-wrap gap-6">
        <OrdersCountCard
          data={ordersCountData}
          error={ordersCountError}
          isLoading={ordersCountLoading}
        />
        <RequestCountCard
          data={pendingRequestsData}
          error={pendingRequestsError}
          isLoading={pendingRequestsLoading}
        />
        <UsersCountCard
          data={unverifiedUsersData}
          error={unverifiedUsersError}
          isLoading={unverifiedUsersLoading}
        />

        <TotalMoneyLast
          data={totalSalesData}
          error={totalSalesError}
          isLoading={totalSalesLoading}
        />
      </div>
    </div>
  );
}
export async function getRequestsCount(status?: PaymentStatus) {
  return getRequests({ status, count: true });
}
export async function getUsersCount(isVerified?: boolean) {
  return getUsers({ count: true, isVerified });
}
export function RequestCountCard({
  data,
  error,
  isLoading,
}: {
  data: any;
  error: unknown;
  isLoading: boolean;
}) {
  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <CardTitle className="text-lg font-semibold">
          Pending Requests
        </CardTitle>
        <CreditCard className="h-5 w-5 text-muted-foreground" />
      </CardHeader>

      <CardContent className="flex items-center justify-center py-6">
        {isLoading ? (
          <Loader />
        ) : error instanceof Error ? (
          <p className="text-sm text-red-500">{error.message}</p>
        ) : (
          <p className="text-3xl font-bold text-primary">{data?.count ?? 0}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button asChild variant="outline">
          <Link href={"/dashboard/requests"}>View Requests</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function UsersCountCard({
  data,
  error,
  isLoading,
}: {
  data: any;
  error: unknown;
  isLoading: boolean;
}) {
  const dispatch = useAppDispatch();
  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <CardTitle className="text-lg font-semibold">
          Unverified Users
        </CardTitle>
        <Users className="h-5 w-5 text-muted-foreground" />
      </CardHeader>

      <CardContent className="flex items-center justify-center py-6">
        {isLoading ? (
          <Loader />
        ) : error instanceof Error ? (
          <p className="text-sm text-red-500">{error.message}</p>
        ) : (
          <p className="text-3xl font-bold text-primary">{data?.count ?? 0}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          asChild
          variant="outline"
          onClick={() => dispatch(setUsers(""))}
        >
          <Link href={"/dashboard/users?verified=false"}>View Users</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function OrdersCountCard({
  data,
  error,
  isLoading,
}: {
  data: any;
  error: unknown;
  isLoading: boolean;
}) {
  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Pending Orders</CardTitle>
        <Utensils className="h-5 w-5 text-muted-foreground" />
      </CardHeader>

      <CardContent className="flex items-center justify-center py-6">
        {isLoading ? (
          <Loader />
        ) : error instanceof Error ? (
          <p className="text-sm text-red-500">{error.message}</p>
        ) : (
          <p className="text-3xl font-bold text-primary">
            {data?.data?.count ?? 0}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button asChild variant="outline">
          <Link href={`/dashboard/orders?status=${MealStatus.not_taken}`}>
            View Orders
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
type Sales = {
  month: number;
  year: number;
  totalAmount: number;
  monthLabel?: string;
};
const chartConfig = {
  month: {
    label: "Month",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;
export function TotalMoneyLast({
  data,
  error,
  isLoading,
}: {
  data: any;
  error: any;
  isLoading: boolean;
}) {
  if (isLoading)
    return (
      <Card className="w-full rounded-2xl shadow-md">
        <CardContent>
          <Loader />
        </CardContent>
      </Card>
    );
  if (error) return <p className="text-red-500">{error.message}</p>;
  console.log(data.data?.totalMoneyRecievedMonthly);

  const MONTHS = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  console.log("data", data);
  const monthWiseSales = data.data?.totalMoneyRecievedMonthly as Sales[];
  if (monthWiseSales.length === 0) {
    return (
      <Card className="w-full rounded-2xl shadow-md">
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No sales data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const sales = monthWiseSales.map((item) => ({
    ...item,
    monthLabel: MONTHS[item.month],
  }));

  return (
    <Card className="w-full rounded-2xl shadow-md md:mx-4">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">
            Amount Recieved
          </CardTitle>
          <div className="text-xs text-muted-foreground rounded-lg">
            Showing the total amount credited monthly
          </div>
        </div>
        <IndianRupee className="h-5 w-5 text-muted-foreground" />
      </CardHeader>

      <ChartContainer
        className="px-4 max-h-54 h-full  max-w-4xlx w-full mx-auto"
        config={chartConfig}
      >
        <BarChart
          accessibilityLayer
          data={sales}
          margin={{ left: 10, right: 10 }}
        >
          <CartesianGrid vertical={true} />
          <XAxis
            dataKey="month"
            tickLine={true}
            axisLine={true}
            tickMargin={8}
            tickFormatter={(value) => MONTHS[value]}
          />

          <ChartTooltip cursor={true} content={<ChartTooltipContent />} />

          <Bar
            dataKey="totalAmount"
            type="natural"
            fill="var(--color-month)"
            fillOpacity={0.2}
            stroke="var(--color-month)"
          />
        </BarChart>
      </ChartContainer>

      <CardFooter className="flex flex-col justify-end">
        <Button asChild variant="outline">
          <Link href={"/dashboard/transactions"}>View Transactions</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default AdminDashboard;
