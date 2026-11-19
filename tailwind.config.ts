import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#E8590C',
        brand2: '#F26B1D',
        soft: '#FFEBDB',
        ink: '#3A2A1E',
        muted: '#7A6558',
        line: '#F1D9C4',
        cream: '#FDF7F2',
        gold: '#D99A14',
        good: '#1E8C4F',
        danger: '#A4421D',
        verify: '#1D9BF0',
      },
      fontFamily: { sans: ['"Hind Siliguri"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'] },
      boxShadow: {
        card: '0 4px 18px rgba(232,89,12,0.10)',
        float: '0 10px 30px rgba(232,89,12,0.22)',
      },
    },
  },
  plugins: [],
};
export default config;
