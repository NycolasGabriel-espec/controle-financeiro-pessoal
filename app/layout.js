import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'CoinPulse · Controle Financeiro Pessoal',
  description: 'Acompanhe receitas e despesas com o visual elétrico do CoinPulse.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
