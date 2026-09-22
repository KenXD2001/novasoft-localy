import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toAddress = (host: string, port: number) => {
  const bare = host.replace(/^https?:\/\//i, "").split(":")[0].split("/")[0];
  return `http://${bare}:${port}`;
};
