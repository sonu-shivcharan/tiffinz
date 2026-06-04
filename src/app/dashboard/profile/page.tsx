"use client";
import UserProfile from "@/components/dashboard/profile/UserProfile";
import { useAuth } from "@/hooks/useAuth";
import Loader from "@/components/ui/Loader";


function ProfilePage() {
  const { user } = useAuth();
  if (!user) return <Loader />;
  return (
    <>
      <UserProfile user={user} />
      
    </>
  );
}

export default ProfilePage;
