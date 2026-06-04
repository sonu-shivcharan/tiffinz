"use client";

import UserProfileUpdateForm from "@/components/dashboard/profile/UserProfileUpdateForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import React from "react";

function SettingModal() {
  const router = useRouter();

  return (
    <Dialog open={true} onOpenChange={() => router.back()}>
      <DialogContent className="w-full sm:w-[80%] md:max-w-lg">
        <DialogDescription className=" sr-only text-sm text-muted-foreground">
          Update your profile information and settings.
        </DialogDescription>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4">
            Update Profile
          </DialogTitle>
        </DialogHeader>
        <UserProfileUpdateForm />
      </DialogContent>
    </Dialog>
  );
}

export default SettingModal;
