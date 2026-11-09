"use client";

import React from "react";
import { IconContext } from "@phosphor-icons/react";

interface PhosphorIconProviderProps {
  children: React.ReactNode;
}

export function PhosphorIconProvider({ children }: PhosphorIconProviderProps) {
  return (
    <IconContext.Provider value={{ weight: "regular", mirrored: false }}>
      {children}
    </IconContext.Provider>
  );
}

export default PhosphorIconProvider;
