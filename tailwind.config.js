/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,js}",
        "./*.html"
    ],
    theme: {
        extend: {
            colors: {
                'brand': '#00B4D8', // Light blue/cyan
                'brand-dark': '#0077B6', // Darker blue
                'ink': '#03045E', // Very dark blue/black for text
                'accent': '#FF006E', // Pink/red for CTAs
                'surface': '#CAF0F8', // Light background
                'card': '#FFFFFF', // White card background
            },
            fontFamily: {
                'sans': ['Inter', 'sans-serif'], // Or similar modern font
                'display': ['Outfit', 'sans-serif'], // For headers if desired
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            }
        },
    },
    plugins: [],
}
