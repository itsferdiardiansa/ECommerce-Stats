'use client';
import React from 'react';
import { ActiveThemeProvider } from '../ActiveTheme';

// Clerk authentication disabled
export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        {children}
      </ActiveThemeProvider>
    </>
  );
}
