import './tailwind.css';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  title: 'Gestão Finance · Controle Financeiro Pessoal',
  description: 'Organize receitas, despesas e metas com clareza e acompanhe sua vida financeira no Gestão Finance.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
