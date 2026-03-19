import { ChevronLeft, Heart } from "lucide-react";

interface DetailsHeaderProps {
  totalRecorded: string;
  onClose: () => void;
}

export function DetailsHeader({ totalRecorded, onClose }: DetailsHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 h-14 shrink-0">
      <button
        onClick={onClose}
        className="flex items-center gap-1.5 text-base text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
      >
        <ChevronLeft className="w-6 h-6 text-foreground" />
        Aiheet
      </button>

      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-primary text-[13px] font-semibold">
        <Heart className="w-3.5 h-3.5 fill-primary" />
        {totalRecorded}
      </div>
    </div>
  );
}
