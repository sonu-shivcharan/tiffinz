import { upload, UploadResponse } from "@imagekit/next";
import axios from "axios";
import { useState } from "react";
let abortController: AbortController | null = null;
export function useImageKit() {
  const [fileData, setFileData] = useState<UploadResponse>();
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploader = async (
    file: File,
    options?: {
      folder?: string;
      tags?: string | string[];
    },
  ) => {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    setFileData(undefined);
    setIsUploading(true);
    setError(null);

    try {
      const { token, signature, publicKey, expire } = await getAuthSignature();
      const uploadResp = await upload({
        expire,
        file,
        publicKey,
        signature,
        token,
        fileName: file.name,
        ...(options?.folder && { folder: options.folder.trim() }),
        ...(options?.tags &&
          options.tags?.length > 0 && { tags: options.tags }),
        onProgress(event) {
          const currentProgress = (event.loaded / event.total) * 100;
          setProgress(currentProgress.toFixed(2));
        },
        abortSignal: abortController.signal,
      });
      setFileData(uploadResp);
      return uploadResp;
    } catch (error) {
      if (error instanceof Error) {
        setError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return {
    data: fileData,
    uploader,
    isUploading,
    error,
    progress,
  };
}

// Promise<{signature: string, expire: string, token: string, publicKey: string}>
async function getAuthSignature() {
  try {
    // Perform the request to the upload authentication endpoint.
    const response = await axios.get("/api/upload-auth");

    // Parse and destructure the response JSON for upload credentials.
    const data = await response.data;
    const { signature, expire, token, publicKey } = data;
    return { signature, expire, token, publicKey };
  } catch (error) {
    // Log the original error for debugging before rethrowing a new error.
    console.error("Authentication error:", error);
    throw new Error("Authentication request failed");
  }
}
