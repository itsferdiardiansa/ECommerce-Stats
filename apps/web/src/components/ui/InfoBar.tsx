import * as React from 'react';

export interface InfobarContent {
  message: string;
  type?: 'info' | 'warning' | 'error';
}

export function InfobarProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
