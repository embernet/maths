/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"STIX Two Text"', '"Latin Modern Roman"', 'Georgia', 'serif'],
      },
      colors: {
        primary: '#1a3a52',
        accent:  '#a77b3f',
      },
      maxWidth: {
        prose: '70ch',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            fontFamily: theme('fontFamily.serif').join(', '),
            fontSize: '1.125rem',   /* 18px base */
            lineHeight: '1.75',
            color: '#1a1a1a',
            maxWidth: '70ch',
            a: { color: theme('colors.primary'), textDecoration: 'underline' },
            'h1,h2,h3,h4': {
              fontFamily: theme('fontFamily.serif').join(', '),
              color: theme('colors.primary'),
            },
            code: {
              backgroundColor: '#f3f4f6',
              borderRadius: '0.25rem',
              padding: '0.1em 0.3em',
              fontFamily: 'ui-monospace, monospace',
            },
            'code::before': { content: '""' },
            'code::after':  { content: '""' },
          },
        },
        lg: {
          css: { fontSize: '1.1875rem' },  /* ~19px on wider screens */
        },
      }),
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@tailwindcss/typography'),
  ],
};
