"use client";

import { getCurrentUser, refreshUserSession } from "@/helpers/client/user.auth";
import { useAppDispatch } from "@/hooks/reduxHooks";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useQuery } from "@tanstack/react-query";
import Loader from "../ui/Loader";
import { useEffect } from "react";
import { setUser } from "@/store/authSlice";
import { notFound, usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/refresh-session",
  "/logout",
]; // add your actual public routes
const validProtectedRoutes = [
  "/dashboard",
  "/dashboard/users",
  "/dashboard/add-balance",
  "/dashboard/account",
  "/dashboard/requests",
  "/dashboard/add-balance",
];

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: currentUser, isLoggedIn } = useCurrentUser();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = publicRoutes.includes(pathname);
  const isValidRoute =
    publicRoutes.some((route) => pathname === route) ||
    validProtectedRoutes.some((route) => pathname.startsWith(route));

  const {
    data: user,
    error,
    isLoading,
    isFetched,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUserOrRefresh,
    retry: false,
    enabled:
      !currentUser && pathname !== "/logout" && pathname !== "/refresh-session",
  });
  // useEffect(()=>{
  //   if(pathname.startsWith("/login") && isLoading){
  //     toast.loading("Logging in..")
  //   }
  //   if(pathname.startsWith("/refresh-session")){
  //     toast.loading("Refreshing Session")
  //   }
  // },[pathname, isLoading])
  useEffect(() => {
    // console.log('pathname', pathname)
    if (user && !currentUser && isFetched && !error) {
      dispatch(setUser(user));
    }
  }, [user, currentUser, dispatch, isFetched, pathname, error, isLoggedIn]);

  useEffect(() => {
    if (
      !isLoading &&
      isFetched &&
      !user &&
      !currentUser &&
      !isPublicRoute &&
      !isLoggedIn
    ) {
      const safeRedirect = validProtectedRoutes.find((value) =>
        value.startsWith(pathname),
      )
        ? pathname
        : "/dashboard";
      router.replace(`/login?redirect=${encodeURIComponent(safeRedirect)}`);
    }
  }, [
    isLoading,
    currentUser,
    isPublicRoute,
    pathname,
    router,
    isFetched,
    user,
    isLoggedIn,
  ]);

  if (!isPublicRoute && !isValidRoute) {
    return notFound();
  }

  if (isLoading && !currentUser) {
    return <Loader />;
  }

  if (error && !currentUser && !isPublicRoute) {
    toast.error(error.message);
    return null;
  }

  return <>{children}</>;
}

async function getCurrentUserOrRefresh() {
  try {
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    const refreshResponse = await refreshUserSession();
    if (refreshResponse) {
      return refreshResponse;
    }
    throw error;
  }
}
export default AuthProvider;
