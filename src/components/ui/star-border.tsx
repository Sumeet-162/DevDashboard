import { cn } from "@/lib/utils"
import { ElementType, ComponentPropsWithoutRef } from "react"

interface StarBorderProps<T extends ElementType> {
  as?: T
  color?: string
  speed?: string
  className?: string
  children: React.ReactNode
}

export function StarBorder<T extends ElementType = "button">({
  as,
  className,
  color,
  speed = "6s",
  children,
  ...props
}: StarBorderProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof StarBorderProps<T>>) {
  const Component = as || "button"
  const defaultColor = color || "hsl(var(--foreground))"

  return (
    <Component 
      className={cn(
        "relative inline-block py-[1px] overflow-hidden rounded-xl",
        className
      )} 
      {...props}
    >
      <div
        className={cn(
          "absolute w-[250%] h-[40%] bottom-[-8px] right-[-200%] rounded-full animate-star-movement-bottom z-0",
          "opacity-15 dark:opacity-50" 
        )}
        style={{
          background: `radial-gradient(circle, ${defaultColor}, transparent 15%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={cn(
          "absolute w-[250%] h-[40%] top-[-8px] left-[-200%] rounded-full animate-star-movement-top z-0",
          "opacity-15 dark:opacity-50"
        )}
        style={{
          background: `radial-gradient(circle, ${defaultColor}, transparent 15%)`,
          animationDuration: speed,
        }}
      />
      <div className={cn(
        "relative z-1 border text-foreground text-center text-sm py-2 px-4 rounded-xl",
        "bg-gradient-to-b from-background/90 to-muted/90 border-border/40",
        "dark:from-background dark:to-muted dark:border-border"
      )}>
        {children}
      </div>
    </Component>
  )
}