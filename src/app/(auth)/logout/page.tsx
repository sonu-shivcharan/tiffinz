"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { logout } from "@/store/authSlice";
import { logoutUser } from "@/helpers/client/user.auth";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";
import { useRouter } from "next/navigation";
import useCurrentUser from "@/hooks/useCurrentUser";

const LogoutPage = () => {
  const { isLoggedIn } = useCurrentUser();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    if (isLoggedIn) {
      logoutUser()
        .then(() => {
          dispatch(logout());
          toast.success("Logged out successfully");
        })
        .catch((error) => {
          console.log("Failed to logout: " + error.message);
        })
        .finally(() => {
          queryClient.clear();
          router.replace("/login?loggedOut=true");
        });
    }
  }, [isLoggedIn, dispatch, queryClient, router]);

  return <Loader />;
};

export default LogoutPage;
