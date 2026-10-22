import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'SDD Navigator · Traceability dashboard', description: 'Specification coverage, code annotations, and implementation tasks.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
