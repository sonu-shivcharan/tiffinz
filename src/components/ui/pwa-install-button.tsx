"use client";

import { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePathname } from "next/navigation";

export default function InstallPrompt() {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  if (process.env.NODE_ENV === "development") return null;
  if (!pathname.startsWith("/dashboard")) return null;
  if (!isInstallable || !open) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader className="flex justify-center flex-nowrap">
          <AlertDialogTitle>Install App</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription className="mb-4">
          Install this app on your device for a better experience!
        </AlertDialogDescription>
        <AlertDialogFooter>
          <Button onClick={promptInstall}>Install</Button>
          <AlertDialogCancel onClick={() => setOpen(false)}>
            Close
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
