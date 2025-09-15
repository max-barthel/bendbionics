/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // Covers components, api, etc.
    ],
    theme: {
        extend: {},
    },
    plugins: [],
    corePlugins: {
        // Enable scrollbar utilities
    },
    // Add custom utilities
    safelist: [
        'scrollbar-hide'
    ]
}
