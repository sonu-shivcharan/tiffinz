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
import { useEffect, useRef, useState } from "react";

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
    avatarUploadRef.current?.click();
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setSelectedImage(file);
      setAvatarEditorOpen(true);
    }
  };
  const handleDialogOpenChange = (open: boolean) => {
    setAvatarEditorOpen(open);

    if (!open) {
      setSelectedImage(null);
    }
  };

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
      <Dialog open={avatarEditorOpen} onOpenChange={handleDialogOpenChange}>
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
  const [scale, setScale] = useState(50);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  useEffect(() => {
    const url = selectedImage ? URL.createObjectURL(selectedImage) : undefined;
    setPreviewUrl(url);
    return () => {
      if (url) return URL.revokeObjectURL(url);
    };
  }, [selectedImage]);

  const handlePoiterDown = (e: React.PointerEvent<HTMLImageElement>) => {
    const x = e.clientX;
    const y = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragStart({ x, y });
    setDragOrigin(position);
    // console.log("poiner down", { x, y });
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (e.buttons !== 1) return; // Only move when left mouse button is pressed

    const x = e.clientX;
    const y = e.clientY;
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    setPosition({
      x: dragOrigin.x + deltaX,
      y: dragOrigin.y + deltaY,
    });
    // console.log("poiner move", { x, y }, { deltaX, deltaY });
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLImageElement>) => {
    if (e.buttons !== 1) return; // Only move when left mouse button is released
    e.currentTarget.releasePointerCapture(e.pointerId);
    const x = e.clientX;
    const y = e.clientY;
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    setPosition({
      x: dragOrigin.x + deltaX,
      y: dragOrigin.y + deltaY,
    });
  };
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
  };
  const handleImageSave = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!image) {
      return;
    }
    if (!canvas) {
      return;
    }

    canvas.width = 600;
    canvas.height = 600;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    console.log("selectedImage", selectedImage);
  };
  // console.log(position);

  return (
    <div className="flex-col items-center justify-center">
      <div
        id="image-crop-area"
        className="w-full aspect-square md:w-[400px] md:h-[400px] bg-muted overflow-hidden border-4 border-blue-500 mx-auto"
      >
        {selectedImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imageRef}
            src={previewUrl}
            alt="Selected Avatar"
            onPointerDown={handlePoiterDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            draggable={false}
            className="w-full cursor-move select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale * 0.05})`,
            }}
          />
        )}
      </div>
      <Input
        type="range"
        min="1"
        max="100"
        value={scale}
        onChange={handleScaleChange}
        className="w-full mt-4 transition-all duration-300"
      />
      <Button onClick={handleImageSave} variant={"outline"}>
        Save
      </Button>
      <canvas ref={canvasRef} className="w-full border"></canvas>
    </div>
  );
};

export default UserProfileUpdateForm;
