import { defineConfig } from 'vite';

export default defineConfig({
    root: 'src',
    base: '/benbenquete_app/',
    envDir: '..',
    publicDir: '../public',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    }
});
