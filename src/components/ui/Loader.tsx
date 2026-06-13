import { Loader2 } from "lucide-react";
import React from "react";

interface LoaderProps {
  text?: string;
}
function Loader({ text }: LoaderProps) {
  return (
    <div className=" w-full h-full flex justify-center items-center mx-auto gap-2">
      <Loader2 className="h-12 w-12 animate-spin duration-100"></Loader2>{" "}
      {text && <span>{text}</span>}
    </div>
  );
}

export default Loader;
