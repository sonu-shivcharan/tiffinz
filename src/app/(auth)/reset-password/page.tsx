"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import Loader from "@/components/ui/Loader";
import LoaderButton from "@/components/ui/loader-button";
import { verifyPasswordResetToken } from "@/helpers/client/user.auth";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import axios from "axios";
import { handleError } from "@/lib/handleError";
// import { Button } from "@/components/ui/button";

function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.toString() || "";
  const userId = searchParams.get("id")?.toString() || "";
  const { data, error, isLoading } = useQuery({
    queryKey: ["verifyResetToken", token, userId],
    queryFn: async () => verifyPasswordResetToken(token, userId),
    retry: false,
    enabled: !!token && !!userId,
    refetchOnWindowFocus: false,
  });

  if (!token || !userId) {
    return (
      <div className="w-full flex flex-col justify-center items-center">
        <div className="text-destructive text-center p-4">
          Invalid password reset link
        </div>
        {/* <div>
          <Button variant={"outline"}>Go Back</Button>
        </div> */}
      </div>
    );
  }
  if (isLoading) {
    return <Loader />;
  }
  if (error) {
    toast.error(error.message || "Password Verification Error");
  }

  if (!data) {
    return (
      <div className="text-destructive font-semibold text-center p-4">
        <p>Password reset link expired!</p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center">
      <Card className="max-w-[400px] w-full">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordResetForm token={token} userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}

type ResetPasswordFormData = {
  newPassword?: string;
  confirmPassword?: string;
};

export function PasswordResetForm({
  token,
  userId,
}: {
  token: string;
  userId: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>();

  const newPassword = watch("newPassword");

  const onSubmit: SubmitHandler<ResetPasswordFormData> = async (data) => {
    try {
      await axios.post("/api/users/reset-password", {
        token,
        userId,
        newPassword: data.newPassword,
      });
      toast.success("Password reset successfully!");
      router.push("/login");
    } catch (err: unknown) {
      const errMsg =
        handleError(err, "passwordResetForm").message ||
        "Failed to reset password";
      toast.error(errMsg);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <PasswordInput
        label="New Password"
        placeholder="Enter new password"
        errorMessage={errors.newPassword?.message as string}
        {...register("newPassword", {
          required: "New password is required",
          minLength: {
            value: 6,
            message: "Password must be at least 6 characters",
          },
          pattern: {
            value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
            message: "Password must contain both letters and numbers",
          },
        })}
      />
      <PasswordInput
        label="Confirm Password"
        placeholder="Confirm your password"
        errorMessage={errors.confirmPassword?.message as string}
        {...register("confirmPassword", {
          required: "Please confirm your password",
          validate: (val) => val === newPassword || "Passwords do not match",
        })}
      />
      <LoaderButton
        isLoading={isSubmitting}
        fallbackText="Resetting..."
        className="w-full"
      >
        Reset Password
      </LoaderButton>
    </form>
  );
}

export default ResetPasswordPage;
