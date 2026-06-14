"use client";
import Loader from "@/components/ui/Loader";
import { IUser } from "@/models/user.model";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AvatarFallback, AvatarImage, Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function UserProfile({ user }: { user: IUser | null }) {
  if (!user) {
    return <Loader />;
  }

  return (
    <Card className="rounded-xl">
      {/* Header */}
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Profile</CardTitle>
        <CardAction className="">
          <Button variant="outline" size="sm" className="px-3 rounded-2xl" asChild>
            <Link href={"/dashboard/profile/settings"}>Edit</Link>
          </Button>
        </CardAction>
        <p className="text-sm text-muted-foreground mt-1">
          ID: {String(user._id)}
        </p>
      </CardHeader>

      {/* Body */}
      <CardContent className="space-y-6">
        {/* Top Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Avatar + User Info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-full overflow-hidden">
              <AvatarImage src={user.avatar} alt={user.fullName} />
              <AvatarFallback className="text-lg font-bold">
                {user.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-0.5">
              <h3 className="text-lg font-semibold">{user.fullName}</h3>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          {/* Verified Badge */}
          <Badge
            variant={user.isVerified ? "default" : "outline"}
            className="flex items-center gap-1 px-3 py-1 text-sm"
          >
            <BadgeCheck size={16} />
            {user.isVerified ? "Verified" : "Unverified"}
          </Badge>
        </div>

        {/* Phone */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium text-muted-foreground">Phone</p>
          <p className="text-base font-medium">{user.phone}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserProfile;
