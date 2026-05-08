import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#161616',
        paper: '#f8f4ec',
        panel: '#fffdfa',
        teal: '#006d77',
        coral: '#e85d4f',
        amber: '#d99a2b',
        violet: '#6046a6'
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif'
        ],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace']
      },
      boxShadow: {
        soft: '0 24px 80px rgba(22, 22, 22, 0.12)'
      }
    }
  },
  plugins: []
} satisfies Config;
