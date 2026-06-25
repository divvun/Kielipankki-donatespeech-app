import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
  label: string;
}

export function BackButton({ onClick, label }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-base text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer min-w-0 max-w-[50%]"
    >
      <ChevronLeft className="w-6 h-6 text-foreground shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
