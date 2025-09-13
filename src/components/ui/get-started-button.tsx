import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function GetStartedButton() {
  return (
    <Button 
      className="group relative overflow-hidden bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90" 
      size="lg"
    >
      <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">
        Get Started
      </span>
      <i className="absolute right-1 top-1 bottom-1 rounded-sm z-10 grid w-1/4 place-items-center transition-all duration-500 bg-white/15 dark:bg-black/15 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
        <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
      </i>
    </Button>
  );
}
