import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { WebSocketProvider } from '@/components/WebSocketProvider';

export const metadata: Metadata = {
  title: 'SureBet — Arbitragem Esportiva',
  description: 'Encontre oportunidades de arbitragem em tempo real no mercado de apostas esportivas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ds-bg text-ds-white font-body antialiased min-h-screen">
        <WebSocketProvider>
          <Navbar />
          <main className="pt-14">{children}</main>
        </WebSocketProvider>
        {/* Disclaimer legal */}
        <footer className="border-t border-ds-border py-6 px-6 mt-12">
          <p className="font-body text-[12px] text-ds-white-40 max-w-3xl mx-auto text-center leading-relaxed">
            ⚠ Este sistema é uma ferramenta de análise. Apostas envolvem risco financeiro.
            Verifique sempre as odds diretamente na casa de apostas antes de realizar qualquer operação.
            O sistema não realiza apostas automaticamente — apenas identifica e calcula oportunidades.
          </p>
        </footer>
      </body>
    </html>
  );
}
