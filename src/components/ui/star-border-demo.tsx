import { cn } from "@/lib/utils"
import { StarBorder } from "@/components/ui/star-border"

export function StarBorderDemo() {
  return (
    <div className="space-y-8">
      <StarBorder>
        Theme-aware Border
      </StarBorder>
    </div>
  )
}