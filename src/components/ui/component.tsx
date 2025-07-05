"use client"

import React, { useState, useEffect } from 'react'
import { motion, useAnimation, useInView, easeOut } from 'framer-motion'
import { 
  Github, 
  Code, 
  BarChart3, 
  Newspaper, 
  Settings, 
  Star, 
  Users, 
  Calendar,
  Moon,
  Sun,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { HeroSection } from "@/components/ui/hero-section";
import { Icons } from "@/components/ui/icons";

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
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
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

// Get Started Button Component
const GetStartedButton: React.FC = () => {
  return (
    <Button className="group relative overflow-hidden" size="lg">
      <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">
        Launch Dashboard
      </span>
      <i className="absolute right-1 top-1 bottom-1 rounded-sm z-10 grid w-1/4 place-items-center transition-all duration-500 bg-primary-foreground/15 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95 text-black-500">
        <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
      </i>
    </Button>
  )
}

// Testimonials Component
interface Testimonial {
  id: number
  name: string
  role: string
  company: string
  content: string
  rating: number
  avatar: string
}

interface TestimonialsSectionProps {
  title?: string
  subtitle?: string
  testimonials?: Testimonial[]
  autoRotateInterval?: number
  showVerifiedBadge?: boolean
  trustedCompanies?: string[]
  trustedCompaniesTitle?: string
  className?: string
}

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  title = "❤️ Loved by Developers",
  subtitle = "See what others are saying about DevPulse",
  testimonials = [
    {
      id: 1,
      name: "Priya",
      role: "SWE Intern",
      company: "TechCorp",
      content: "The ultimate GitHub + LeetCode combo I never knew I needed.",
      rating: 5,
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    },
    {
      id: 2,
      name: "James",
      role: "Full Stack Dev",
      company: "StartupXYZ",
      content: "Clean UI, real-time insights, and no clutter. Love it!",
      rating: 5,
      avatar: "https://randomuser.me/api/portraits/men/44.jpg",
    }
  ],
  autoRotateInterval = 6000,
  showVerifiedBadge = true,
  trustedCompanies = [],
  trustedCompaniesTitle = "Trusted by teams at these companies and more",
  className,
}) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRef = React.useRef(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })
  const controls = useAnimation()

  useEffect(() => {
    if (autoRotateInterval <= 0 || testimonials.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, autoRotateInterval)

    return () => clearInterval(interval)
  }, [testimonials.length, autoRotateInterval])

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: easeOut,
      },
    },
  }

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className={cn("py-16 md:py-32 relative overflow-hidden flex justify-center", className)}
    >
      <div className="container items-center px-4 md:px-6">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="text-center mb-12 space-y-4"
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {title}
          </motion.h2>
          <motion.p variants={itemVariants} className="text-muted-foreground max-w-[700px] mx-auto md:text-xl/relaxed">
            {subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="max-w-4xl mx-auto"
        >
          <div className="relative h-[320px] md:h-[280px]">
            {testimonials.map((testimonial, index) => (
              <Card
                key={testimonial.id}
                className={cn(
                  "absolute inset-0 transition-all duration-500 border",
                  index === activeIndex
                    ? "opacity-100 translate-x-0 shadow-lg"
                    : "opacity-0 translate-x-[100px] pointer-events-none",
                )}
              >
                <CardContent className="p-6 md:p-8 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 border-2 border-primary/10 rounded-full bg-muted flex items-center justify-center">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role}, {testimonial.company}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </div>

                  <div className="my-4 h-px bg-border"></div>

                  <p className="flex-1 italic text-base/relaxed">"{testimonial.content}"</p>

                  {showVerifiedBadge && (
                    <div className="mt-4 text-xs text-right text-muted-foreground">Verified Customer</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center mt-8 gap-2">
            {testimonials.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors cursor-pointer",
                  index === activeIndex ? "bg-primary" : "bg-muted-foreground/20",
                )}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </motion.div>

        {trustedCompanies.length > 0 && (
          <motion.div variants={itemVariants} className="mt-20 pt-10 border-t">
            <h3 className="text-sm font-medium text-muted-foreground text-center mb-8">{trustedCompaniesTitle}</h3>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
              {trustedCompanies.map((company) => (
                <div key={company} className="text-2xl font-semibold text-muted-foreground/50">
                  {company}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
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
      className="relative inline-flex gap-2 items-center py-[3px] text-xs text-muted-foreground select-none"
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

// Main DevPulse Landing Page Component
const DevPulseLandingPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const features = [
    {
      icon: <Github className="h-8 w-8 text-primary" />,
      title: "🧠 GitHub Insights",
      description: "Track your commits, contributions, and top repositories visually."
    },
    {
      icon: <Code className="h-8 w-8 text-primary" />,
      title: "📊 LeetCode Tracker",
      description: "View your solved problems, difficulty breakdown, and recent activity."
    },
    {
      icon: <Newspaper className="h-8 w-8 text-primary" />,
      title: "📰 Dev News Feed",
      description: "Stay updated with top programming articles and community trends."
    },
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: "🎛️ Modular Dashboard",
      description: "Add, remove, and rearrange widgets to suit your coding goals."
    }
  ]

  const steps = [
    {
      title: "Connect Accounts",
      description: "Sign in with GitHub and LeetCode securely.",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Customize Widgets",
      description: "Choose what to see on your dashboard — from stats to articles.",
      icon: <Settings className="h-6 w-6" />
    },
    {
      title: "Track & Improve",
      description: "Monitor your growth, streaks, and stay on top of your dev game.",
      icon: <BarChart3 className="h-6 w-6" />
    }
  ]

  return (
    <div className={`min-h-screen bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">DevPulse</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How It Works</a>
            <a href="#demo" className="text-sm font-medium hover:text-primary transition-colors">Demo</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Toggle checked={isDarkMode} onChange={toggleDarkMode}>
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Toggle>
            
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
              <a href="#features" className="block py-2 text-sm font-medium hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="block py-2 text-sm font-medium hover:text-primary transition-colors">How It Works</a>
              <a href="#demo" className="block py-2 text-sm font-medium hover:text-primary transition-colors">Demo</a>
              <a href="#testimonials" className="block py-2 text-sm font-medium hover:text-primary transition-colors">Testimonials</a>
            </nav>
          </motion.div>
        )}
      </motion.header>

      <main>
        {/* Hero Section */}
        <div className="mt-0 pt-0">
          <HeroSection
            title="Track your coding journey. Visualize your progress."
            description="DevPulse brings your GitHub and LeetCode stats together in one beautiful dashboard. Stay motivated, monitor your growth, and celebrate your achievements—all in one place."
            actions={[
              {
                text: "Get Started",
                href: "/login",
                variant: "default",
              },
            ]}
            image={{
              light: "https://www.launchuicomponents.com/app-light.png",
              dark: "https://www.launchuicomponents.com/app-dark.png",
              alt: "DevPulse Dashboard Preview",
            }}
          />
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🔥 Powerful Features for Every Developer
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to track your coding journey and stay motivated.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    {feature.icon}
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container px-4 py-24 bg-muted/50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🚀 How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in just three simple steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Demo Preview Section */}
        <section id="demo" className="container px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🎯 See Your Progress, Visualized
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Clean mockup showing your coding journey at a glance.
            </p>
          </motion.div>

          <div className="relative mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Streak Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Streak</span>
                    <span className="font-bold text-primary">15 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longest Streak</span>
                    <span className="font-bold">42 days</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Most Active Repos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>awesome-project</span>
                    <span className="text-sm text-muted-foreground">23 commits</span>
                  </div>
                  <div className="flex justify-between">
                    <span>web-app</span>
                    <span className="text-sm text-muted-foreground">18 commits</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Recent LeetCode Solves</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Two Sum</span>
                    <span className="text-green-500 text-sm">Easy</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid Parentheses</span>
                    <span className="text-green-500 text-sm">Easy</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Footer */}
        <footer className="border-t bg-muted/50">
          <div className="container px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <span className="font-bold text-xl">DevPulse</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Built with React, Tailwind, and 💖 by devs, for devs.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Quick Links</h3>
                <div className="space-y-2 text-sm">
                  <a href="#" className="block hover:text-primary transition-colors">GitHub Repo</a>
                  <a href="#" className="block hover:text-primary transition-colors">Privacy Policy</a>
                  <a href="#" className="block hover:text-primary transition-colors">Terms of Use</a>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Support</h3>
                <div className="space-y-2 text-sm">
                  <a href="#" className="block hover:text-primary transition-colors">Support</a>
                  <a href="#" className="block hover:text-primary transition-colors">Contact Us</a>
                  <a href="#" className="block hover:text-primary transition-colors">Documentation</a>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Theme</h3>
                <Toggle checked={isDarkMode} onChange={toggleDarkMode}>
                  {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </Toggle>
              </div>
            </div>

            <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
              © 2025 DevPulse. Built with React, Tailwind, and 💖 by devs, for devs.
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default DevPulseLandingPage
