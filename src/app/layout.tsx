import type { Metadata } from 'next';
import './styles.css';
export const metadata: Metadata = { title: 'Contratto in Due Minuti', description: 'Contratti di viaggio da PDF, in pochi minuti.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="it"><body>{children}</body></html>; }
