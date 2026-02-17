import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'src',
    envDir: '..',
    publicDir: '../public',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    }
});
