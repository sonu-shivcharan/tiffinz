"use client";
import WithDrawer from "@/components/ui/withDrawer";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IAccount } from "@/models/account.model";
import { IUser } from "@/models/user.model";
import { PlusCircleIcon } from "lucide-react";
import AddBalanceForm from "../add-balance/AddBalanceForm";
import { formatToIndianCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUserAccount } from "@/helpers/client/user.account";
import useCurrentUser from "@/hooks/useCurrentUser";

export function AccountCardSkeleton() {
  return (
    <Card className="w-full md:max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Wallet</CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-32" />
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">
            Available Balance
          </span>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-28 rounded-md" />
      </CardFooter>
    </Card>
  );
}

interface AccountCardProps {
  account?: IAccount | null;
  error?: Error | null;
  user?: IUser | null;
  isLoading?: boolean;
}

function AccountCard({ account: propAccount, error: propError, user: propUser, isLoading: propIsLoading }: AccountCardProps) {
  const hasProps = propUser !== undefined;

  const { data: queryAccount, error: queryError, isLoading: queryLoading } = useQuery<IAccount>({
    queryKey: ["currentUserAccount"],
    queryFn: getCurrentUserAccount,
    retry: false,
    enabled: !hasProps,
  });

  const currentUserHook = useCurrentUser();

  const user = hasProps ? propUser : currentUserHook.user;
  const account = hasProps ? propAccount : queryAccount;
  const error = hasProps ? propError : queryError;
  const isLoading = hasProps ? propIsLoading : queryLoading;

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  if (isLoading) {
    return <AccountCardSkeleton />;
  }

  if (error) {
    return (
      <Card className="w-full md:max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">
            {!user?.isVerified
              ? "Your account is not verified. Please wait for verification to access your wallet details."
              : error.message}
          </p>
        </CardContent>
      </Card>
    );
  } else if (!user?.isVerified) {
    return (
      <Card className="w-full md:max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Your account is not verified. Please wait for verification to access
            your wallet details.
          </p>
        </CardContent>
      </Card>
    );
  } else if (account) {
    return (
      <Card className="w-full md:max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Wallet</CardTitle>
          <CardDescription>Account ID: {String(account._id)}</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">
              Available Balance
            </span>
            <span className="text-lg font-bold text-primary">
              {formatToIndianCurrency(account.balance)}
            </span>
          </div>
        </CardContent>
        <CardFooter>
          <ActionButtons />
        </CardFooter>
      </Card>
    );
  }

  return null;
}

const ActionButtons = () => {
  return (
    <>
      <WithDrawer
        drawerTriggerText="Add Balance"
        drawerTriggerIcon={<PlusCircleIcon />}
      >
        <AddBalanceForm className="border-none shadow-none bg-transparent" />
      </WithDrawer>
    </>
  );
};

export default AccountCard;

