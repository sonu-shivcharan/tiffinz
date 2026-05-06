"use client";
import {
  BadgeIndianRupee,
  Home,
  List,
  LucideOctagon,
  Package,
  PlusCircleIcon,
  // Search,
  Settings,
  User,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/constants/enum";
import LogoutButton from "../auth/Logout";
import { useAppSelector } from "@/hooks/reduxHooks";

interface ISidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onlyForAdmin?: boolean;
  onlyForUser?: boolean;
}
// Menu items.

const sidebarItems: ISidebarItem[] = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Users",
    url: "/dashboard/users",
    icon: User,
    onlyForAdmin: true, // Only for admin users
  },

  {
    title: "Transactions",
    url: "/dashboard/transactions",
    icon: BadgeIndianRupee,
  },
  {
    title: "Meals",
    url: "/dashboard/meals",
    icon: List,
    onlyForAdmin: true, // Only for admin users
  },
  {
    title: "Orders",
    url: "/dashboard/orders",
    icon: Package,
    onlyForAdmin: true, // Only for admin users
  },
  // {
  //   title: "Accounts",
  //   url: "/accounts",
  //   icon: Search,
  // },
  // {
  //   title: "Add Balance",
  //   url: "/dashboard/add-balance",
  //   icon: PlusCircleIcon,
  //   onlyForUser: true, // Only for regular users
  // },
  {
    title: "Add Balance Request",
    url: "/dashboard/requests",
    icon: PlusCircleIcon,
    onlyForAdmin: true,
  },
  // {
  //   title: "Settings",
  //   url: "/dashboard/settings",
  //   icon: Settings,
  // },
];

export function AppSidebar() {
  const pathname = usePathname();

  // console.log('currentUser', currentUser);
  const currentUserRole = useAppSelector((state) => state.auth.user?.role);

  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenuButton>
          {" "}
          <LucideOctagon />
          <span className="text-lg font-semibold text-foreground">Tiffinz</span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => {
                if (item.onlyForAdmin && currentUserRole !== UserRole.admin) {
                  return null; // Skip items that are only for admin users
                }
                if (item.onlyForUser && currentUserRole !== UserRole.user) {
                  return null; // Skip items that are only for regular users
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="w-full">
                <SidebarMenuButton className="w-full" asChild>
                  <LogoutButton />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
