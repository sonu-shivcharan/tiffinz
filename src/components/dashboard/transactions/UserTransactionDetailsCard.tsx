"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import { TransactionType, UserRole } from "@/constants/enum";

import { getTransactionById } from "@/helpers/client/admin.transactions";
import { getUserTransactionById } from "@/helpers/client/user.transactions";

import useCurrentUser from "@/hooks/useCurrentUser";
import { getDateAndTimeString } from "@/lib/date-format";
import { cn, formatToIndianCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useQuery } from "@tanstack/react-query";
import MealLogCard from "../meals/MealLogCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function UserTransactionDetailsCard({
  transactionId,
}: {
  transactionId: string;
}) {
  const { userRole } = useCurrentUser();
  const queryFn =
    userRole === UserRole.admin ? getTransactionById : getUserTransactionById;
  const {
    data: transaction,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["getTransactionById", transactionId],
    queryFn: () => queryFn(transactionId),
    refetchOnWindowFocus: false,
  });
  if (error) {
    return <div>{error.message}</div>;
  }
  if (isFetching) {
    return <Loader />;
  }
  console.log("data", transaction);
  const isCredit = transaction.type === TransactionType.credit;
  const amount = `${isCredit ? "+" : "-"} ${formatToIndianCurrency(
    transaction.amount,
  )}`;
  const { openingBalance, closingBalance, description } = transaction;

  return (
    <>
      <Card className="w-full max-w-2xl shadow border border-border/60 mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Transaction Details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Info */}
          {userRole === UserRole.admin && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Link
                    href={`/dashboard/users/${transaction.user._id}`}
                    className="flex items-center gap-4"
                  >
                    <Avatar className="h-14 w-14 bg-amber-200 rounded-full flex justify-center items-center">
                      <AvatarImage
                        src={transaction.user.avatar}
                        alt={transaction.user.fullName}
                      />
                      <AvatarFallback>
                        {transaction.user.fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {transaction.user.fullName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      @{transaction.user.username}
                    </p>
                  </div>
                </div>
                <div>
                  <p>{transaction.user.phone}</p>
                </div>
              </div>
            </>
          )}

          {/* Transaction Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 text-sm items-center">
            <p className="text-sm opacity-90 mt-1">
              Transaction ID: {String(transaction._id)}
            </p>
            <div className="col-span-2 gap-y-4 text-center p-4 flex flex-col md:flex-row  justify-between items-center rounded-lg  bg-muted/60">
              <div className={cn("text-xl font-bold")}>{amount}</div>
              <div className="text-xs text-muted-foreground flex flex-col md:items-end gap-2">
                <p>
                  <Badge
                    variant={
                      transaction.type === TransactionType.credit
                        ? "default"
                        : "destructive"
                    }
                  >
                    {transaction.type}
                  </Badge>
                </p>
                <p>{getDateAndTimeString(transaction.createdAt)}</p>
              </div>
            </div>

            {(openingBalance !== undefined || closingBalance !== undefined) && (
              <div className="col-span-2 flex justify-center items-center text-lg font-medium gap-4">
                <div
                  className="text-center cursor-pointer"
                  title="Opening Balance"
                >
                  <div className="text-xs text-muted-foreground">Opening</div>
                  <div className="text-accent-foreground">
                    {formatToIndianCurrency(openingBalance)}
                  </div>
                </div>

                <div className="mx-2 text-muted-foreground">
                  <ArrowRight />
                </div>

                <div
                  className="text-center cursor-pointer"
                  title="Closing Balance"
                >
                  <div className="text-xs text-muted-foreground">Closing</div>
                  <div className="text-accent-foreground">
                    {formatToIndianCurrency(closingBalance)}
                  </div>
                </div>
              </div>
            )}

            {description && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Remark:
                </span>
                <p className={cn("text-sm text-muted-foreground")}>
                  {transaction.description || "-"}
                </p>
              </div>
            )}
          </div>

          {transaction.isMeal && <Badge>Meal Transaction</Badge>}
        </CardContent>
      </Card>
      {transaction.isMeal && <MealLogCard mealLog={transaction.mealLog} />}
    </>
  );
}

export default UserTransactionDetailsCard;
