"use client";

import * as React from "react";
import { Button } from "./login-2";
import { Input } from "./login-2";
import { Label } from "./login-2";
import { Separator } from "./login-2";
import { useNavigate } from "./useNavigate";
import { Moon, Sun } from "lucide-react";

const GoogleIcon = (
  props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>
) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
  </svg>
);

export default function SignupDevDash() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light') return false;
    }
    return true;
  });
  const hasMounted = React.useRef(false);
  React.useEffect(() => {
    if (!hasMounted.current) {
      document.documentElement.classList.toggle('dark', isDarkMode);
      hasMounted.current = true;
    } else {
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Here you would handle sign up logic
    navigate("/dashboard");
  };
  return (
    <div className="min-h-screen w-full bg-[#020617] relative">
      {/* Dark Radial Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(circle 500px at 50% 200px, #3e3e3e, transparent)`,
        }}
      />
      <div className="flex items-center justify-center min-h-screen relative z-10">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isDarkMode}
            onChange={toggleDarkMode}
            className="hidden"
          />
          <span className="inline-flex items-center justify-center w-10 h-6 rounded-full bg-muted border border-border transition-colors">
            <span
              className={`inline-block w-5 h-5 rounded-full bg-primary shadow transform transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`}
            >{isDarkMode ? <Moon className="w-4 h-4 mx-auto text-primary-foreground" /> : <Sun className="w-4 h-4 mx-auto text-primary-foreground" />}</span>
          </span>
        </label>
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex items-center justify-center">
            {/* DevDash Logo/Icon - Logo Only */}
            <svg
              fill="currentColor"
              height="40"
              viewBox="0 0 40 48"
              width="40"
              className="h-10 w-10 text-primary"
              aria-hidden={true}
            >
              <clipPath id="a">
                <path d="m0 0h40v48h-40z" />
              </clipPath>
              <g clipPath="url(#a)">
                <path d="m25.0887 5.05386-3.933-1.05386-3.3145 12.3696-2.9923-11.16736-3.9331 1.05386 3.233 12.0655-8.05262-8.0526-2.87919 2.8792 8.83271 8.8328-10.99975-2.9474-1.05385625 3.933 12.01860625 3.2204c-.1376-.5935-.2104-1.2119-.2104-1.8473 0-4.4976 3.646-8.1436 8.1437-8.1436 4.4976 0 8.1436 3.646 8.1436 8.1436 0 .6313-.0719 1.2459-.2078 1.8359l10.9227 2.9267 1.0538-3.933-12.0664-3.2332 11.0005-2.9476-1.0539-3.933-12.0659 3.233 8.0526-8.0526-2.8792-2.87916-8.7102 8.71026z" />
                <path d="m27.8723 26.2214c-.3372 1.4256-1.0491 2.7063-2.0259 3.7324l7.913 7.9131 2.8792-2.8792z" />
                <path d="m25.7665 30.0366c-.9886 1.0097-2.2379 1.7632-3.6389 2.1515l2.8794 10.746 3.933-1.0539z" />
                <path d="m21.9807 32.2274c-.65.1671-1.3313.2559-2.0334.2559-.7522 0-1.4806-.102-2.1721-.2929l-2.882 10.7558 3.933 1.0538z" />
                <path d="m17.6361 32.1507c-1.3796-.4076-2.6067-1.1707-3.5751-2.1833l-7.9325 7.9325 2.87919 2.8792z" />
                <path d="m13.9956 29.8973c-.9518-1.019-1.6451-2.2826-1.9751-3.6862l-10.95836 2.9363 1.05385 3.933z" />
              </g>
            </svg>
          </div>
          <h3 className="mt-6 text-2xl font-bold text-foreground">Create your DevDash account</h3>
          <p className="mt-2 text-base text-muted-foreground">
            Sign up to track your <span className="font-semibold text-primary">GitHub</span> and <span className="font-semibold text-primary">LeetCode</span> progress, and stay updated with the latest <span className="font-semibold text-primary">tech news</span>.
          </p>
          <div className="mt-8 flex flex-col items-center space-y-2">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 py-2"
              asChild
            >
              <a href="#">
                <GoogleIcon className="size-5 mr-2" aria-hidden="true" />
                <span className="text-sm font-medium">Sign up with Google</span>
              </a>
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or sign up with email
              </span>
            </div>
          </div>

          <form action="#" method="post" className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name-signup-devdash" className="text-sm font-medium text-foreground">
                Name
              </Label>
              <Input
                type="text"
                id="name-signup-devdash"
                name="name-signup-devdash"
                autoComplete="name"
                placeholder="Your Name"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="email-signup-devdash" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                type="email"
                id="email-signup-devdash"
                name="email-signup-devdash"
                autoComplete="email"
                placeholder="you@devdash.app"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="password-signup-devdash" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <Input
                type="password"
                id="password-signup-devdash"
                name="password-signup-devdash"
                autoComplete="new-password"
                placeholder="********"
                className="mt-2"
              />
            </div>
            <Button type="submit" className="mt-4 w-full py-2 font-medium">
              Create account
            </Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-primary hover:text-primary/90">
              Sign in
            </a>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
