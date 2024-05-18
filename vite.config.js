/*
 * @Author: 星忆 2500798479@qq.com
 * @Date: 2024-04-14 01:19:30
 * @LastEditors: 星忆 2500798479@qq.com
 * @LastEditTime: 2024-04-19 15:22:19
 * @FilePath: \up-cloud-front\vite.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import EnhanceLog from 'vite-plugin-enhance-log'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue'],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    EnhanceLog({
      // 配置项
      // ...
      preTip:"👇👇👇👇👇👇👇👇👇👇👇👇👇👇"
    }),
    // codeInspectorPlugin({
    //   bundler: 'vite',
    // }),

  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8500',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
