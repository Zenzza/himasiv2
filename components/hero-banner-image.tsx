"use client";

import { useState, useEffect } from "react";
import {
  DEFAULT_HERO_BANNER,
  getHeroBannerConfig,
  BANNER_UPDATE_EVENT,
  type HeroBannerConfig,
} from "@/lib/constants/banner";

interface HeroBannerImageProps {
  className?: string;
  showOverlay?: boolean;
}

export default function HeroBannerImage({
  className = "",
  showOverlay = true,
}: HeroBannerImageProps) {
  const [config, setConfig] = useState<HeroBannerConfig>(DEFAULT_HERO_BANNER);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setConfig(getHeroBannerConfig());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<HeroBannerConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        setConfig(getHeroBannerConfig());
      }
    };

    window.addEventListener(BANNER_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(BANNER_UPDATE_EVENT, handleUpdate);
  }, []);

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none ${className}`}>
      {/* 
        SISTEM RESPONSIVE HERO BANNER (DESKTOP & MOBILE BERBEDA):
        - Pada viewport Mobile (< 768px): Browser otomatis memuat 'mobileImage' (rasio portrait/vertikal)
        - Pada viewport Desktop (>= 768px): Browser otomatis memuat 'desktopImage' (rasio landscape/horizontal)
      */}
      <picture className="absolute inset-0 w-full h-full block">
        {/* Source Khusus Layar Mobile (< 768px) */}
        <source
          media="(max-width: 767px)"
          srcSet={isMounted ? config.mobileImage : DEFAULT_HERO_BANNER.mobileImage}
        />

        {/* Source Khusus Layar Tablet & Desktop (>= 768px) */}
        <source
          media="(min-width: 768px)"
          srcSet={isMounted ? config.desktopImage : DEFAULT_HERO_BANNER.desktopImage}
        />

        {/* Fallback Image Element */}
        <img
          src={isMounted ? config.desktopImage : DEFAULT_HERO_BANNER.desktopImage}
          alt={config.alt || DEFAULT_HERO_BANNER.alt}
          className={`w-full h-full object-cover ${
            config.mobilePosition || "object-center"
          } md:${config.desktopPosition || "object-[center_65%]"}`}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </picture>

      {/* Gradient Overlay: Transisi halus navbar atas (#00296E) ke bagian bawah (#FFFFFF) */}
      {showOverlay && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            background:
              "linear-gradient(180deg, #00296E 0%, rgba(0, 41, 110, 0.72) 8%, rgba(0, 41, 110, 0.22) 16%, rgba(0, 41, 110, 0.04) 24%, transparent 28%, transparent 92%, rgba(255, 255, 255, 0.75) 98%, #FFFFFF 100%)",
          }}
        />
      )}
    </div>
  );
}
