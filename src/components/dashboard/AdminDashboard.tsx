"use client";

import { IUser } from "@/models/user.model";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useQuery } from "@tanstack/react-query";
import Loader from "../ui/Loader";
import { PaymentStatus } from "@/constants/enum";
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

function AdminDashboard({ user }: { user: IUser }) {
  return (
    <div className="px-2 pt-6">
      <h1 className="text-2xl font-semibold mb-4">Welcome, {user.fullName}!</h1>
      <div className="flex items-center md:items-start justify-center flex-col md:flex-row flex-wrap gap-4">
        <RequestCountCard />
        <UsersCountCard />
        {/* <ExampleCharts /> */}
        <TotalMoneyLast />
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
export function RequestCountCard() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["getPendingRequestsCount", PaymentStatus.pending],
    queryFn: () => getRequestsCount(PaymentStatus.pending),
    refetchOnWindowFocus: false,
  });

  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Pending Requests
        </CardTitle>
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

export function UsersCountCard() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["getUnVerifiedUsers", false],
    queryFn: () => getUsersCount(false),
    refetchOnWindowFocus: false,
  });
  const dispatch = useAppDispatch();
  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Unverified Users
        </CardTitle>
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
export function TotalMoneyLast() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["getTotalSales"],
    queryFn: () => axios.get("api/admin/dashboard").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  if (isLoading)
    return (
      <Card className="w-full max-w-sm rounded-2xl shadow-md">
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

  const sales = data.data?.totalMoneyRecievedMonthly.map((item: Sales) => ({
    ...item,
    monthLabel: MONTHS[item.month],
  }));
  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Amount Recieved</CardTitle>
        <div className="text-xs text-muted-foreground rounded-lg">
          Showing the total amount credited monthly
        </div>
      </CardHeader>

      <ChartContainer className="px-4" config={chartConfig}>
        <BarChart
          accessibilityLayer
          data={sales}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical={true} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => MONTHS[value]}
          />

          <ChartTooltip cursor={true} content={<ChartTooltipContent />} />

          <Bar
            dataKey="totalAmount"
            type="natural"
            fill="var(--color-month)"
            fillOpacity={0.5}
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
