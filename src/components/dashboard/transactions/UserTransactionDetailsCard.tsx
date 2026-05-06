"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import { TransactionType, UserRole } from "@/constants/enum";
import { getTransactionById } from "@/helpers/client/admin.transactions";
import { getUserTransactionById } from "@/helpers/client/user.transactions";
import useCurrentUser from "@/hooks/useCurrentUser";
import { getDateAndTimeString } from "@/lib/date-format";
import { formatToIndianCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import MealLogCard from "../meals/MealLogCard";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

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

  const amount = formatToIndianCurrency(transaction.amount);
  const { openingBalance, closingBalance, description } = transaction;

  return (
    <>
      <Card className="w-full max-w-2xl shadow border border-border/60 mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Transaction Details
          </CardTitle>
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

                <p className="text-sm">{transaction.user.phone}</p>
              </div>
            </>
          )}
        </CardHeader>

        <Separator />
        <CardContent className="space-y-6">
          {/* Transaction ID */}
          <div className="text-sm text-muted-foreground">
            Transaction ID: {String(transaction._id)}
          </div>

          {/* Amount + Type */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="text-xl font-bold">{amount}</div>

            <div className="text-xs text-muted-foreground flex flex-col items-center md:items-end gap-1">
              <Badge
                variant={
                  transaction.type === TransactionType.credit
                    ? "default"
                    : "destructive"
                }
              >
                {transaction.type}
              </Badge>
              <p>{getDateAndTimeString(transaction.createdAt)}</p>
            </div>
          </div>

          {/* Balances */}
          {(openingBalance !== undefined || closingBalance !== undefined) && (
            <>
              <Separator />

              <div className="flex flex-col gap-3 text-sm ">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opening Balance</span>
                  <span className="font-medium">
                    {formatToIndianCurrency(openingBalance)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closing Balance</span>
                  <span className="font-medium">
                    {formatToIndianCurrency(closingBalance)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Description */}
          {description && (
            <>
              <Separator />

              <div>
                <span className="font-medium text-muted-foreground">
                  Remark:
                </span>
                <p className="text-sm text-muted-foreground">
                  {transaction.description || "-"}
                </p>
              </div>
            </>
          )}

          {transaction.isMeal && (
            <>
              <Separator />
              <Badge>Meal Transaction</Badge>
            </>
          )}
        </CardContent>
      </Card>

      {transaction.isMeal && <MealLogCard mealLog={transaction.mealLog} />}
    </>
  );
}

export default UserTransactionDetailsCard;
