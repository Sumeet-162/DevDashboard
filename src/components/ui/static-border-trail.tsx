"use client";

import React from "react";

type StaticBorderTrailProps = {
  style?: React.CSSProperties;
  size?: number;
  className?: string;
  children?: React.ReactNode;
};

export function StaticBorderTrail({
  style,
  size = 60,
  className = "",
  children,
  ...props
}: StaticBorderTrailProps) {
  return (
    <div className={`relative ${className}`} {...props}>
      <div
        className="absolute inset-0 rounded-md pointer-events-none"
        style={{
          padding: "2px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "xor",
          WebkitMaskComposite: "xor",
          borderRadius: "inherit",
          ...style,
        }}
      />
      {children}
    </div>
  );
}
