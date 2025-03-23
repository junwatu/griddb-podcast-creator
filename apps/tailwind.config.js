/** @type {import('tailwindcss').Config} */
export default {
    theme: {
      extend: {
        typography: {
          DEFAULT: {
            css: {
              color: '#333',
              a: {
                color: '#3182ce',
                '&:hover': {
                  color: '#2c5282',
                },
              },
            },
          },
        },
      },
    },
    plugins: [
      require('@tailwindcss/typography'),
    ],
  };
  