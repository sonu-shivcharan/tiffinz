"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, LoaderIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useImageKit } from "@/hooks/useImageKit";
import { handleError } from "@/lib/handleError";
import { cn } from "@/lib/utils";
import { ImageKitFolder } from "@/constants/enum";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { updateUserAvatar } from "@/helpers/client/user.auth";
import useCurrentUser from "@/hooks/useCurrentUser";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { IUser } from "@/models/user.model";
import { useAuth } from "@/hooks/useAuth";
import LoaderButton from "@/components/ui/loader-button";

export const AvatarUpload = () => {
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
        <AvatarImage
          className="rounded-full"
          src={user?.avatar}
          alt={user?.fullName}
        />
        <AvatarFallback className="text-xl font-bold">
          {user?.fullName.charAt(0).toUpperCase()}
        </AvatarFallback>
        <Button
          onClick={handleAvatarClick}
          variant="outline"
          size="icon"
          className="absolute bottom-0 right-0 rounded-full p-0 px-0 py-0 size-9 border bg-accent/60! border-muted-foreground"
        >
          <Camera className=" h-6 w-6 text-accent-foreground" />
        </Button>
      </Avatar>
      <AlertDialog
        open={avatarEditorOpen}
        onOpenChange={handleDialogOpenChange}
      >
        <AlertDialogContent className="overflow-y-auto  flex justify-items-start flex-col item min-w-dvw p-8 min-h-dvh md:min-w-fit md:max-w-lg md:min-h-fit ">
          <AlertDialogHeader className="">
            <div className="max-w-full flex justify-between items-center">
              <AlertDialogTitle>Edit</AlertDialogTitle>
              <AlertDialogCancel asChild>
                <Button size={"icon"} variant={"outline"}>
                  <XIcon />
                </Button>
              </AlertDialogCancel>
            </div>

            <AlertDialogDescription className="text-sm sr-only">
              Edit your avatar image. You can crop and adjust the image before
              saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ImageEditor
            onSuccess={() => handleDialogOpenChange(false)}
            selectedImage={selectedImage}
          />
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ImageEditor = ({
  selectedImage,
  onSuccess,
}: {
  selectedImage?: File | null;
  onSuccess?: () => void;
}) => {
  const [scale, setScale] = useState(20);
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

  const { error, isUploading, progress, uploader } = useImageKit();

  const { setUser, user } = useAuth();
  const handleImageSave = async () => {
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
    try {
      const file = await getCroppedImageFile({
        canvas,
        image,
        position,
        scale,
      });
      if (!file) {
        throw new Error("failed to crop image");
      }

      const uploadedAvatar = await uploader(file, {
        folder: ImageKitFolder.users,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      const avatarUrl = uploadedAvatar?.url;
      if (!avatarUrl) {
        toast.error("Failed to upload the profile picture");
        return;
      }
      setUser({ ...(user as IUser), avatar: avatarUrl });
      onSuccess?.();
      await updateUserAvatar(avatarUrl);
    } catch (error) {
      const message = handleError(error, "Avatar update error").message;
      toast.error(message);
    }
  };

  return (
    <div className="flex-col">
      <div
        id="image-crop-area"
        className="max-w-[400px] relative aspect-square bg-muted overflow-hidden border-3 rounded-sm border-blue-500 mx-auto"
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
            className="w-full h-auto cursor-move select-none "
            style={{
              transformOrigin: "top left",
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale * 0.05})`,
            }}
          />
        )}
        <div
          className={cn(
            "absolute w-full  bg-accent/60 rounded text-xs z-30  p-1 flex justify-end text gap-1 duration-75",
            isUploading ? "bottom-0" : "-bottom-10",
          )}
        >
          <LoaderIcon className="h-4 animate-spin" />
          {/* <span>Uploading</span> */}
          <span className="tabular-nums">{progress || 0}%</span>
          {/* <div className="w-full absolute h-1 rounded bg-primary/70 bottom-0"></div> */}
        </div>
      </div>
      <div className="max-w-[400px] mx-auto">
        <Input
          type="range"
          min="1"
          max="100"
          value={scale}
          onChange={handleScaleChange}
          className="w-full h-1 p-0 bg-gray-950 mx-auto mt-4 transition-all duration-300"
        />

        <AlertDialogFooter className=" mt-10">
          <div className="grid grid-cols-2 w-full gap-4">
            <AlertDialogCancel asChild className="max-w-full">
              <Button variant={"outline"}>Cancel</Button>
            </AlertDialogCancel>
            <LoaderButton
              onClick={handleImageSave}
              isLoading={isUploading}
              fallbackText={`Uploading `}
            >
              Save
            </LoaderButton>
          </div>
        </AlertDialogFooter>
      </div>

      <canvas ref={canvasRef} className="w-full border hidden"></canvas>
    </div>
  );
};

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
  const cropSize = image.parentElement?.clientWidth as number;

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
