import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import Icons from 'unplugin-icons/vite'

export default defineConfig({
  plugins: [
    sveltekit(),
    Icons({
      compiler: 'svelte'
    })
  ],
  resolve: {
    alias: {
      $components: '/src/components',
      $lib: '/src/lib',
      $routes: '/src/routes',
      $api: '/src/routes/api'
    }
  }
})
