import React from "react";

type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "label"
  | "caption"
  | "button";

type TypographyColor =
  | "primary"
  | "secondary"
  | "neutral"
  | "blue"
  | "gray"
  | "white";

interface TypographyProps {
  variant: TypographyVariant;
  color?: TypographyColor;
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  htmlFor?: string;
}

function Typography({
  variant,
  color = "neutral",
  children,
  className = "",
  as,
  htmlFor,
}: TypographyProps) {
  const baseClasses = "tracking-tight";

  const variantClasses = {
    h1: "text-3xl font-bold",
    h2: "text-2xl font-semibold",
    h3: "text-xl font-semibold",
    body: "text-base font-normal",
    label: "text-sm font-medium",
    caption: "text-xs font-normal",
    button: "text-sm font-medium",
  };

  const colorClasses = {
    primary: "text-neutral-800",
    secondary: "text-neutral-600",
    neutral: "text-neutral-700",
    blue: "text-blue-600",
    gray: "text-gray-500",
    white: "text-white",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${colorClasses[color]} ${className}`;

  const Component = as || (variant.startsWith("h") ? variant : "span");

  return (
    <Component className={classes} htmlFor={htmlFor}>
      {children}
    </Component>
  );
}

export default Typography;
