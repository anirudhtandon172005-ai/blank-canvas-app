import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  imgClassName?: string;
  alt?: string;
}

export default function BrandLogo({ className, imgClassName, alt = "Kala Mandir" }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src="/brand/kala-logo.png"
        alt={alt}
        className={cn("h-full w-full object-contain", imgClassName)}
      />
    </div>
  );
}
