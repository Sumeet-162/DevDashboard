"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, useAnimation, useInView, easeOut } from 'framer-motion'
import { 
  Github, 
  Code2, 
  BarChart3, 
  Newspaper, 
  Settings2, 
  Star, 
  Users, 
  Calendar,
  Moon,
  Sun,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Zap,
  Cpu,
  Fingerprint,
  Pencil,
  Sparkles,
  Bug,
  Lightbulb
} from 'lucide-react'
import { HeroSection } from "@/components/ui/hero-section";
import { Icons } from "@/components/ui/icons";
import { GetStartedButton } from "@/components/ui/get-started-button";
import { ThemeToggleSwitch } from "@/components/ui/theme-toggle-switch";
import { StarBorder } from "@/components/ui/star-border";
import { useTheme } from "@/hooks/use-theme";
import { Marquee } from "@/components/magicui/marquee";
import { SmoothCursor } from "@/components/magicui/smooth-cursor";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { WarpBackground } from "@/components/magicui/warp-background";
import DevDashLogo from "@/components/ui/DevDashLogo";
import { FeatureCard } from "@/components/ui/grid-feature-cards";
import DisplayCards from "@/components/ui/display-cards";

// Utility function
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground"
    }
    
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8"
    }

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// Card Components
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

// Gradient Text Component
interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

const GradientText: React.FC<GradientTextProps> = ({ className, children, ...props }) => {
  return (
    <span
      className={cn("relative inline-flex overflow-hidden bg-white dark:bg-black", className)}
      {...props}
    >
      {children}
      <span className="pointer-events-none absolute inset-0 mix-blend-lighten dark:mix-blend-darken">
        <span className="pointer-events-none absolute -top-1/2 h-[30vw] w-[30vw] animate-pulse bg-blue-500 mix-blend-overlay blur-[1rem]"></span>
        <span className="pointer-events-none absolute right-0 top-0 h-[30vw] w-[30vw] animate-pulse bg-green-500 mix-blend-overlay blur-[1rem]"></span>
        <span className="pointer-events-none absolute bottom-0 left-0 h-[30vw] w-[30vw] animate-pulse bg-purple-500 mix-blend-overlay blur-[1rem]"></span>
        <span className="pointer-events-none absolute -bottom-1/2 right-0 h-[30vw] w-[30vw] animate-pulse bg-pink-500 mix-blend-overlay blur-[1rem]"></span>
      </span>
    </span>
  )
}

// Testimonials Component
const reviews = [
  {
    name: "Sarah",
    username: "@sarah_dev",
    body: "DevDash changed my coding workflow completely! Love tracking my GitHub and LeetCode progress in one place.",
    img: "https://avatar.vercel.sh/sarah",
  },
  {
    name: "Alex",
    username: "@alex_codes",
    body: "The best developer dashboard I've ever used. Clean UI and powerful insights.",
    img: "https://avatar.vercel.sh/alex",
  },
  {
    name: "Maya",
    username: "@maya_builds",
    body: "Finally, a dashboard that actually helps me stay motivated and track my progress!",
    img: "https://avatar.vercel.sh/maya",
  },
  {
    name: "Jordan",
    username: "@jordan_dev",
    body: "Incredible tool for any developer. The GitHub insights are spot-on!",
    img: "https://avatar.vercel.sh/jordan",
  },
  {
    name: "Riley",
    username: "@riley_codes",
    body: "Love the LeetCode tracking feature. Makes grinding problems so much more enjoyable.",
    img: "https://avatar.vercel.sh/riley",
  },
  {
    name: "Taylor",
    username: "@taylor_tech",
    body: "DevDash is exactly what I needed to level up my coding journey. Highly recommend!",
    img: "https://avatar.vercel.sh/taylor",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-base font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-sm font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-base">{body}</blockquote>
    </figure>
  );
};

export function MarqueeDemo() {
  return (
    <div id="testimonials" className="relative flex w-full flex-col items-center justify-center overflow-hidden py-16 md:py-32">
      <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8 text-center">❤️ Loved by Developers</h2>
      <p className="text-muted-foreground max-w-[700px] mx-auto md:text-xl/relaxed mb-8 text-center">See what others are saying about DevDash</p>
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
    </div>
  );
}

// Toggle Component
interface ToggleProps {
  checked: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  size?: "small" | "large"
  children?: React.ReactNode
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = "small",
  children,
  ...rest
}) => {
  const getClasses = (checked: boolean, disabled: boolean, size: "small" | "large") => {
    let toggle = "rounded-[14px] inline-block relative duration-150"
    let thumb = "rounded-[50%] border border-transparent absolute top-1/2 -translate-y-1/2 shadow-sm duration-150 flex items-center justify-center"

    if (size === "small") {
      toggle += " h-3.5 w-7"
      thumb += " h-3 w-3"
    } else {
      toggle += " h-6 w-10"
      thumb += " h-[22px] w-[22px]"
    }

    if (checked) {
      if (size === "small") {
        thumb += " left-3.5"
      } else {
        thumb += " left-4"
      }

      if (disabled) {
        toggle += " bg-muted border border-border cursor-not-allowed"
        thumb += " bg-muted-foreground"
      } else {
        toggle += " bg-primary border border-primary cursor-pointer"
        thumb += " bg-background"
      }
    } else {
      if (disabled) {
        toggle += " bg-background border border-border cursor-not-allowed"
        thumb += " bg-muted left-0"
      } else {
        toggle += " bg-background border border-border cursor-pointer"
        thumb += " bg-muted-foreground left-0"
      }
    }

    return { toggle, thumb }
  }

  return (
    <label
      className="relative inline-flex gap-2 items-center py-[3px] text-sm text-muted-foreground select-none"
      {...rest}
    >
      {children && <span>{children}</span>}
      <input
        className="absolute w-0 h-0 appearance-none"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className={getClasses(checked, disabled, size).toggle}>
        <div className={getClasses(checked, disabled, size).thumb}></div>
      </span>
    </label>
  )
}

// Main DevDash Landing Page Component
const DevDashLandingPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const toggleDarkMode = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const features = [
    {
      icon: Github,
      title: "GitHub Insights",
      description: "Track your commits, contributions, and top repositories visually."
    },
    {
      icon: Code2,
      title: "LeetCode Tracker",
      description: "View your solved problems, difficulty breakdown, and recent activity."
    },
    {
      icon: Newspaper,
      title: "Dev News Feed",
      description: "Stay updated with top programming articles and community trends."
    },
    {
      icon: Settings2,
      title: "Productivity Suite",
      description: "Built-in Pomodoro timer, to-do lists, calendar, and notes to boost your workflow."
    }
  ]

  const steps = [
    {
      title: "Connect Accounts",
      description: "Sign in with GitHub and LeetCode securely.",
      icon: <Users className="h-6 w-6" />,
      cardProps: {
        icon: <Users className="size-4 text-blue-300" />,
        title: "Connect",
        description: "Link your accounts",
        date: "Step 1"
      }
    },
    {
      title: "Configure Your Profile",
      description: "Set up your GitHub and LeetCode profiles to sync your coding data.",
      icon: <Settings2 className="h-6 w-6" />,
      cardProps: {
        icon: <Settings2 className="size-4 text-green-300" />,
        title: "Configure",
        description: "Set up your profiles",
        date: "Step 2"
      }
    },
    {
      title: "Track & Improve",
      description: "Monitor your growth, streaks, and stay on top of your dev game.",
      icon: <BarChart3 className="h-6 w-6" />,
      cardProps: {
        icon: <BarChart3 className="size-4 text-purple-300" />,
        title: "Track",
        description: "Monitor your progress",
        date: "Step 3"
      }
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Smooth Cursor */}
      <SmoothCursor />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2 w-48">
            <DevDashLogo size="md" showText={true} />
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-base font-medium hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-base font-medium hover:text-primary transition-colors">How It Works</a>
            <a href="#demo" className="text-base font-medium hover:text-primary transition-colors">Demo</a>
            <a href="#testimonials" className="text-base font-medium hover:text-primary transition-colors">Testimonials</a>
          </nav>

          <div className="flex items-center space-x-4 justify-end min-w-48">
            <a 
              href="https://github.com/Sumeet-162/DevDashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 hover:border-border transition-colors whitespace-nowrap"
            >
              <Github className="h-4 w-4" />
              <AnimatedShinyText className="text-sm font-medium whitespace-nowrap">
                Star on GitHub
              </AnimatedShinyText>
            </a>
            <ThemeToggleSwitch />
            
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-background"
          >
            <nav className="container py-4 space-y-2">
              <a href="#features" className="block py-2 text-base font-medium hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="block py-2 text-base font-medium hover:text-primary transition-colors">How It Works</a>
              <a href="#demo" className="block py-2 text-base font-medium hover:text-primary transition-colors">Demo</a>
              <a href="#testimonials" className="block py-2 text-base font-medium hover:text-primary transition-colors">Testimonials</a>
            </nav>
          </motion.div>
        )}
      </motion.header>

      <main>
        {/* Hero Section */}
        <div className="mt-0 pt-0">
          <HeroSection
            title="Track your coding journey. Visualize your progress."
            description="DevDash brings your GitHub and LeetCode stats together in one beautiful dashboard. Stay motivated, monitor your growth, and celebrate your achievements all in one place."
            actions={[]}
            image={{
              light: "https://raw.githubusercontent.com/Sumeet-162/DEVDASH-IMAGES/refs/heads/main/Screenshot%202025-09-13%20004013.JPG",
              dark: "https://raw.githubusercontent.com/Sumeet-162/DEVDASH-IMAGES/refs/heads/main/Screenshot%202025-09-13%20003923.JPG",
              alt: "DevDash Dashboard Preview",
            }}
            
          >
            <div className="flex justify-center mt-8">
              <a href="/login">
                <GetStartedButton />
              </a>
            </div>
          </HeroSection>
        </div>

        {/* Features Section */}
        <section id="features" className="container px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <SparklesText 
              className="text-3xl md:text-4xl font-bold mb-4"
              sparklesCount={15}
              colors={{ first: "#9E7AFF", second: "#FE8BBB" }}
            >
              🔥 Powerful Features for Every Developer
            </SparklesText>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to track your coding journey and stay motivated.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1400px] mx-auto px-4"
          >
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section 
          id="how-it-works" 
          className="relative py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
        >
          {/* Dark mode background overlay */}
          <div 
            className="absolute inset-0 hidden dark:block"
            style={{
              background: "radial-gradient(at 36% 23%, #000000 0px, transparent 50%), radial-gradient(at 22% 71%, #150050 0px, transparent 50%), radial-gradient(at 97% 26%, #3f0071 0px, transparent 50%), radial-gradient(at 64% 53%, #610094 0px, transparent 50%), #000000"
            }}
          ></div>
          
          {/* Top gradient blend */}
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-background to-transparent z-10"></div>
          
          {/* Bottom gradient blend */}
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-background to-transparent z-10"></div>
          
          <div className="container px-4 relative z-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                🚀 How It Works
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Get started in just three simple steps.
              </p>
            </motion.div>

            <div className="flex justify-center max-w-7xl mx-auto px-4">
              {/* Display Cards - Centered */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex justify-center"
              >
                <DisplayCards 
                  cards={steps.map((step, index) => ({
                    ...step.cardProps,
                    className: index === 0 
                      ? "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0"
                      : index === 1
                      ? "[grid-area:stack] translate-x-8 sm:translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0"
                      : "[grid-area:stack] translate-x-16 sm:translate-x-24 translate-y-20 hover:translate-y-10"
                  }))}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Demo Preview Section */}
        <section id="demo" className="relative py-12 md:py-24">
          <WarpBackground>
            <div className="container px-4 md:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12 md:mb-16"
              >
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                  🎯 Track Your Development Journey
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                  Get a comprehensive overview of your coding progress across GitHub and LeetCode in one unified dashboard.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative mx-auto max-w-6xl px-2 md:px-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="transform transition-all duration-300 hover:scale-105"
                  >
                    <Card className="p-4 md:p-6 h-full transition-all duration-300 border-2 hover:border-primary/30 bg-background/80 backdrop-blur-sm shadow-[0px_20px_207px_10px_rgba(165,_39,_255,_0.48)] dark:shadow-[0px_20px_207px_10px_rgba(165,_39,_255,_0.48)] hover:shadow-[0px_20px_207px_15px_rgba(165,_39,_255,_0.6)] dark:hover:shadow-[0px_20px_207px_15px_rgba(165,_39,_255,_0.6)]">
                      <h3 className="font-semibold mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                        <span className="text-orange-500">🔥</span>
                        GitHub Activity
                      </h3>
                      <div className="space-y-2 md:space-y-3">
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.5 }}
                          viewport={{ once: true }}
                          className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-muted-foreground">Current Streak</span>
                          <span className="font-bold text-primary text-xl">23 days</span>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.6 }}
                          viewport={{ once: true }}
                          className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-muted-foreground">Total Commits</span>
                          <span className="font-bold text-xl">1,247</span>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.7 }}
                          viewport={{ once: true }}
                          className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-muted-foreground">This Week</span>
                          <span className="font-bold text-xl text-green-600">+34</span>
                        </motion.div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="transform transition-all duration-300 hover:scale-105"
                  >
                    <Card className="p-4 md:p-6 h-full transition-all duration-300 border-2 hover:border-primary/30 bg-background/80 backdrop-blur-sm shadow-[0px_20px_207px_10px_rgba(165,_39,_255,_0.48)] dark:shadow-[0px_20px_207px_10px_rgba(165,_39,_255,_0.48)] hover:shadow-[0px_20px_207px_15px_rgba(165,_39,_255,_0.6)] dark:hover:shadow-[0px_20px_207px_15px_rgba(165,_39,_255,_0.6)]">
                      <h3 className="font-semibold mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                        <span className="text-blue-500">📊</span>
                        Top Repositories
                      </h3>
                      <div className="space-y-2 md:space-y-3">
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.7 }}
                          viewport={{ once: true }}
                          className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-muted-foreground font-medium">react-dashboard</span>
                            <span className="text-sm text-muted-foreground/70">TypeScript</span>
                          </div>
                          <span className="text-sm text-primary font-medium">156 commits</span>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.8 }}
                          viewport={{ once: true }}
                          className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-muted-foreground font-medium">node-api-server</span>
                            <span className="text-sm text-muted-foreground/70">JavaScript</span>
                          </div>
                          <span className="text-sm text-primary font-medium">89 commits</span>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.9 }}
                          viewport={{ once: true }}
                          className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-muted-foreground font-medium">ml-algorithms</span>
                            <span className="text-sm text-muted-foreground/70">Python</span>
                          </div>
                          <span className="text-sm text-primary font-medium">67 commits</span>
                        </motion.div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="transform transition-all duration-300 hover:scale-105"
                  >
                    <Card className="p-4 md:p-6 h-full transition-all duration-300 border-2 hover:border-primary/30 bg-background/80 backdrop-blur-sm shadow-[0px_20px_207px_10px_rgba(165,_39,_255,_0.48)] dark:shadow-[0px_20px_207px_10px_rgba(165,_39,_255,_0.48)] hover:shadow-[0px_20px_207px_15px_rgba(165,_39,_255,_0.6)] dark:hover:shadow-[0px_20px_207px_15px_rgba(165,_39,_255,_0.6)]">
                      <h3 className="font-semibold mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                        <span className="text-yellow-500">🧠</span>
                        LeetCode Progress
                      </h3>
                      <div className="space-y-2 md:space-y-3">
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.9 }}
                          viewport={{ once: true }}
                          className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-muted-foreground">Binary Tree Inorder</span>
                          <span className="text-orange-500 text-sm font-medium px-2 py-1 bg-orange-500/10 rounded-full">Medium</span>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 1.0 }}
                          viewport={{ once: true }}
                          className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-muted-foreground">Maximum Subarray</span>
                          <span className="text-orange-500 text-sm font-medium px-2 py-1 bg-orange-500/10 rounded-full">Medium</span>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 1.1 }}
                          viewport={{ once: true }}
                          className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-muted-foreground">Climbing Stairs</span>
                          <span className="text-green-500 text-sm font-medium px-2 py-1 bg-green-500/10 rounded-full">Easy</span>
                        </motion.div>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </WarpBackground>
        </section>

        {/* Testimonials Section */}
        <MarqueeDemo />

        {/* Footer */}
        <footer className="border-t bg-muted/50">
          <div className="container px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="space-y-3 lg:col-span-2">
                <div className="flex items-center space-x-2">
                  <DevDashLogo size="md" showText={true} />
                </div>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Built with React, Tailwind, and 💖 by devs, for devs.
                </p>
                
                {/* Bug Report and Feature Request Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <StarBorder 
                    as="a"
                    href="https://github.com/Sumeet-162/DevDashboard/issues/new?labels=bug&template=bug_report.md&title=%5BBUG%5D%3A+"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                    speed="4s"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      <Bug size={14} />
                      Report Bug
                    </div>
                  </StarBorder>
                  
                  <StarBorder 
                    as="a"
                    href="https://github.com/Sumeet-162/DevDashboard/issues/new?labels=enhancement&template=feature_request.md&title=%5BFEATURE%5D%3A+"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                    speed="5s"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      <Lightbulb size={14} />
                      Suggest Feature
                    </div>
                  </StarBorder>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm">Quick Links</h3>
                <div className="space-y-1.5 text-sm">
                  <a href="#" className="block hover:text-primary transition-colors">GitHub Repo</a>
                  <a href="#" className="block hover:text-primary transition-colors">Privacy Policy</a>
                  <a href="#" className="block hover:text-primary transition-colors">Terms of Use</a>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm">Account</h3>
                <div className="space-y-1.5 text-sm">
                  <a href="/login" className="block hover:text-primary transition-colors">Sign In</a>
                  <a href="/signup" className="block hover:text-primary transition-colors">Sign Up</a>
                  <a href="/dashboard" className="block hover:text-primary transition-colors">Dashboard</a>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm">Support</h3>
                <div className="space-y-1.5 text-sm">
                  <a href="#" className="block hover:text-primary transition-colors">Help Center</a>
                  <a href="#" className="block hover:text-primary transition-colors">Contact Us</a>
                  <a href="#" className="block hover:text-primary transition-colors">Documentation</a>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm">Theme</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Light</span>
                  <ThemeToggleSwitch />
                  <span className="text-xs">Dark</span>
                </div>
              </div>
            </div>

            <div className="border-t mt-6 pt-6 text-center text-xs text-muted-foreground">
              © 2025 DevDash. Built with React, Tailwind, and 💖 by devs, for devs.
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default DevDashLandingPage
