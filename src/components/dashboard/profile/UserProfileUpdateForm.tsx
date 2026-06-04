"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useCurrentUser from "@/hooks/useCurrentUser";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Camera } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

function UserProfileUpdateForm() {
  const { user } = useCurrentUser();

  return (
    <div className="space-y-6 ">
      <AvatarUpload />
      <form className="space-y-4">
        <Input label="Name" defaultValue={user?.fullName} />
        <Input label="email" defaultValue={user?.email} />
      </form>
    </div>
  );
}

const AvatarUpload = () => {
  const { user } = useCurrentUser();
  const avatarUploadRef = useRef<HTMLInputElement>(null);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const handleAvatarClick = () => {
    setSelectedImage(null);
    setAvatarEditorOpen(false);
    avatarUploadRef.current?.click();
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setSelectedImage(file);
      setAvatarEditorOpen(true);
    }
  };
  if (!user) return null;
  return (
    <div>
      <Input
        onChange={handleImageChange}
        ref={avatarUploadRef}
        type="file"
        id="avatar-upload"
        className="hidden"
        accept="image/*"
      />
      <Avatar className="h-20 w-20 rounded-full overflow-visible relative">
        <AvatarImage src={user?.avatar} alt={user?.fullName} />
        <AvatarFallback className="text-xl font-bold">
          {user?.fullName.charAt(0).toUpperCase()}
        </AvatarFallback>
        <Button
          onClick={handleAvatarClick}
          variant="outline"
          size="icon"
          className="absolute bottom-0 right-0 rounded-full p-0 px-0 py-0 size-9 border bg-accent! border-muted hover:bg-accent/80"
        >
          <Camera className=" h-10 w-10 text-muted-foreground" />
        </Button>
      </Avatar>
      <Dialog open={avatarEditorOpen} onOpenChange={setAvatarEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit</DialogTitle>
            <DialogDescription className="text-sm sr-only">
              Edit your avatar image. You can crop and adjust the image before
              saving.
            </DialogDescription>
            <SelectedImagePreview selectedImage={selectedImage} />
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SelectedImagePreview = ({
  selectedImage,
}: {
  selectedImage?: File | null;
}) => {
  return (
    <div className="flex-col items-center justify-center">
      <div
        id="image-crop-area"
        className="w-[400px] h-[400px] bg-muted overflow-visible border-4 border-blue-500 mx-auto"
      >
        {selectedImage && (
          <Image
            src={URL.createObjectURL(selectedImage!)}
            alt="Selected Avatar"
            width={200}
            height={200}
            className="h-full w-full object-cover cursor-move"
            onMouseMove={(e) => {
              console.log("Mouse move", e.clientX, e.clientY);
            }}
          />
        )}
      </div>
      <Input type="range" min="0" max="100" className="w-full mt-4" />
    </div>
  );
};

export default UserProfileUpdateForm;
