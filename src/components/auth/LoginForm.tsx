"use client";
import React, { useEffect, useState } from "react";
import LoaderButton from "../ui/loader-button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import {
  loginUserWithPhone,
  loginUserWithEmail,
  loginUserWithUsername,
} from "@/helpers/client/user.auth";
import { login } from "@/store/authSlice";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { EyeClosed, LucideEye } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import useCurrentUser from "@/hooks/useCurrentUser";
import Link from "next/link";
import { email } from "zod/v4";

type LoginFormData = {
  identifier: string;
  password: string;
};

function LoginForm() {
  const { user, isLoggedIn } = useCurrentUser();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectPath = searchParams.get("redirect") || "/dashboard";
    if (user && isLoggedIn) {
      router.replace(redirectPath);
    }
  }, [user, searchParams, isLoggedIn, router]);
  const toggleShowPassword = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: LoginFormData) => {
    const loginType = detectLoginType(data.identifier);
    let result;

    if (loginType === "phone") {
      result = await loginUserWithPhone({
        phone: data.identifier,
        password: data.password,
      });
    } else if (loginType === "email") {
      result = await loginUserWithEmail({
        email: data.identifier,
        password: data.password,
      });
    } else {
      result = await loginUserWithUsername({
        username: data.identifier,
        password: data.password,
      });
    }

    const { user, error } = result;
    if (error) {
      setError("root", { message: error.message });

      toast.error("Login failed: " + error.message);
      return;
    }
    toast.success("Login Success");
    console.log("Login successful:", user);
    dispatch(login(user));
  };
  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Phone / Email / Username"
            placeholder="Enter phone, email or username"
            errorMessage={errors.identifier?.message as string}
            {...register("identifier", {
              required: "Phone, email or username is required",
            })}
          />
          <div className="w-full flex items-end">
            <Input
              className="border w-full"
              errorMessage={errors.password?.message as string}
              label="Enter your password"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              {...register("password", { required: "Password is required" })}
            />
            <Button
              className=""
              variant={"outline"}
              type="button"
              onClick={toggleShowPassword}
            >
              {showPassword ? <EyeClosed /> : <LucideEye />}
            </Button>
          </div>
          {errors.root && (
            <p className="text-red-600 text-sm text-center pt-2">
              {errors.root.message}
            </p>
          )}
          <LoaderButton
            className="w-full"
            isLoading={isSubmitting}
            fallbackText="logging in..."
          >
            Login
          </LoaderButton>
        </form>
      </CardContent>
      <CardFooter>
        <div className="text-center w-full text-muted-foreground">
          Don&apos;t have account?{" "}
          <Link href="/register" className="underline">
            Register
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default LoginForm;

function detectLoginType(identifier: string) {
  const phoneRegex = /^[0-9]{10,15}$/;

  if (phoneRegex.test(identifier.replace(/\s/g, ""))) {
    return "phone";
  } else if (email().safeParse(identifier).success) {
    return "email";
  } else {
    return "username";
  }
}
