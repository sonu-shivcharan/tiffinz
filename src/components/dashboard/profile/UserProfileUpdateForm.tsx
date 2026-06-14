"use client";

import { Input } from "@/components/ui/input";
import useCurrentUser from "@/hooks/useCurrentUser";

import { toast } from "sonner";

import { updateUserProfile } from "@/helpers/client/user.auth";

import { useAuth } from "@/hooks/useAuth";
import { IUser } from "@/models/user.model";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateUserProfile, updateUserSchema } from "@/zod/user.schema";
import LoaderButton from "@/components/ui/loader-button";
import { AvatarUpload } from "./AvatarUploder";

function UserProfileUpdateForm() {
  const { user } = useCurrentUser();
  const { setUser } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors, isDirty },
  } = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: user?.email || "",
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      username: user?.username || "",
    },
  });
  const onSubmit = async (data: UpdateUserProfile) => {
    const { user: updatedUser, error } = await updateUserProfile(data);
    if (error) {
      toast.error("Profile Update Failed", {
        description: error.message,
      });
      return;
    }
    if (updatedUser) {
      setUser({ ...user, ...updatedUser } as IUser);
      reset(data);
      toast.success("Profile Updated Successfully");
    }
  };
  return (
    <div className="space-y-6  ">
      <AvatarUpload />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Full Name"
          {...register("fullName")}
          errorMessage={errors.fullName?.message}
        />
        <Input
          label="Username"
          placeholder="user123"
          {...register("username")}
          errorMessage={errors.username?.message}
        />
        <Input
          label="email"
          placeholder="user@gmail.com"
          {...register("email", { required: false })}
          errorMessage={errors.email?.message}
        />
        <Input
          label="Phone"
          placeholder="9999955555"
          {...register("phone")}
          errorMessage={errors.phone?.message}
        />

        <LoaderButton
          disabled={!isDirty}
          fallbackText=""
          isLoading={isSubmitting}
        >
          Update
        </LoaderButton>
      </form>
    </div>
  );
}

export default UserProfileUpdateForm;
