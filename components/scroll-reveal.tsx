"use client";

import { useEffect, useRef, useState, ReactNode, ElementType } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number; // Delay in milliseconds (e.g. 100, 200)
  direction?: "up" | "down" | "left" | "right" | "zoom" | "card-pop" | "none";
  distance?: number; // Distance in pixels (default: 40)
  duration?: number; // Duration in milliseconds (default: 650)
  threshold?: number; // Observer threshold (default: 0.08)
  rootMargin?: string; // Intersection observer rootMargin (default: "0px 0px -40px 0px")
  once?: boolean; // Once true, never animates again once shown (default: true)
  as?: ElementType; // HTML element tag to render (default: "div")
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 40,
  duration = 650,
  threshold = 0.08,
  rootMargin = "0px 0px -40px 0px",
  once = true,
  as: Component = "div",
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Fallback if IntersectionObserver is unavailable
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once]);

  const getTransform = () => {
    if (isVisible) return "translate3d(0, 0, 0) scale(1)";
    switch (direction) {
      case "card-pop":
        return `translate3d(0, ${distance * 0.75}px, 0) scale(0.92)`;
      case "up":
        return `translate3d(0, ${distance}px, 0) scale(0.99)`;
      case "down":
        return `translate3d(0, -${distance}px, 0) scale(0.99)`;
      case "left":
        return `translate3d(${distance}px, 0, 0) scale(0.99)`;
      case "right":
        return `translate3d(-${distance}px, 0, 0) scale(0.99)`;
      case "zoom":
        return "translate3d(0, 0, 0) scale(0.92)";
      case "none":
      default:
        return "none";
    }
  };

  const getTimingFunction = () => {
    if (direction === "card-pop") {
      return "cubic-bezier(0.34, 1.35, 0.64, 1)"; // Energetic spring pop for cards
    }
    return "cubic-bezier(0.16, 1, 0.3, 1)";
  };

  return (
    <Component
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: getTimingFunction(),
        transitionDelay: `${delay}ms`,
        willChange: isVisible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </Component>
  );
}
