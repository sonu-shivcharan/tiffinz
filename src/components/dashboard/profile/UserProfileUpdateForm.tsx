"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import useCurrentUser from "@/hooks/useCurrentUser";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";

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
      <AlertDialog
        open={avatarEditorOpen}
        onOpenChange={handleDialogOpenChange}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sr-only">
              Edit your avatar image. You can crop and adjust the image before
              saving.
            </AlertDialogDescription>
            <ImageEditor selectedImage={selectedImage} />
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ImageEditor = ({ selectedImage }: { selectedImage?: File | null }) => {
  const [scale, setScale] = useState(50);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCropAreaRef = useRef<HTMLDivElement>(null);
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
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (e.buttons !== 1) return;

    const x = e.clientX;
    const y = e.clientY;
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    setPosition({
      x: dragOrigin.x + deltaX,
      y: dragOrigin.y + deltaY,
    });
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
  const handleImageSave = async () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const imageCropArea = imageCropAreaRef.current;
    if (!imageCropArea) {
      return;
    }
    if (!image) {
      return;
    }
    if (!canvas) {
      return;
    }

    canvas.width = 400;
    canvas.height = 400;
    const file = await getCroppedImageFile({ canvas, image, position, scale });
    if (!file) {
      throw new Error("failed to crop image");
    }
    console.log("file", file);

    //TODO: handle upload the image
  };

  return (
    <div className="flex-col">
      <div
        ref={imageCropAreaRef}
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
            className="w-full h-auto cursor-move select-none"
            style={{
              transformOrigin: "top left",
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
      <canvas ref={canvasRef} className="w-full border hidden"></canvas>
    </div>
  );
};

export default UserProfileUpdateForm;

type GetCroppedImageFilePorps = {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  position: { x: number; y: number };
  scale: number;
};
async function getCroppedImageFile({
  canvas,
  image,
  position,
  scale,
}: GetCroppedImageFilePorps) {
  const cropSize = 400;

  const { naturalHeight, naturalWidth, clientHeight, clientWidth } = image;

  const zoom = scale * 0.05;
  const displayedImageWidth = clientWidth * zoom;
  const displayedImageHeight = clientHeight * zoom;

  const sourceWidth = naturalWidth * (cropSize / displayedImageWidth);
  const sourceHeight = naturalHeight * (cropSize / displayedImageHeight);
  const sourceX = (-position.x / displayedImageWidth) * naturalWidth;

  const sourceY = (-position.y / displayedImageHeight) * naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  console.log({
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
  });
  console.log("selectedImage", {
    position,
    scale,
    naturalWidth,
    naturalHeight,
    clientWidth,
    clientHeight,
  });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const newImageFile = await canvasToFile(canvas);
  return newImageFile;
}

function canvasToFile(canvas: HTMLCanvasElement) {
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create blob"));
        return;
      }

      resolve(new File([blob], "avatar.png", { type: blob.type }));
    });
  });
}
