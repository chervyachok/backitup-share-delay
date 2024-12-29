import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

let production = process.env.NODE_ENV === 'production';
production = true


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: [
        //'assert',
        'buffer',
        'crypto',
        //'util',
        //'vm',
        'stream'
      ],
      // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
      //exclude: [
      //  'http', // Excludes the polyfill for `http` and `node:http`.
      //],
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
      // Override the default polyfills for specific modules.
      //overrides: {
      //  // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
      //  fs: 'memfs',
      //},
      // Whether to polyfill `node:` protocol imports.
      //protocolImports: true,
    }),
    vue()
  ],
  define: {
    API_URL: JSON.stringify(production ? 'https://buckitupss.appdev.pp.ua/api' : 'http://localhost:3950/api'),
    IS_PRODUCTION: production,
    API_SURL: JSON.stringify(production ? 'https://buckitupss.appdev.pp.ua' : 'http://localhost:3950'), //http://192.168.100.28:3900 https://d1ca-2a01-c844-251d-5100-fa2f-930b-157d-3af1.ngrok-free.app

    API_SPATH: JSON.stringify('/api'),
    TM_BOT: JSON.stringify(production ? 'BuckitUpDemoBot' : 'BuckitUpLocalBot'),
    //"process.browser": JSON.stringify(true),
  },
  //resolve: {
  //  alias: {
  //    crypto: 'crypto-browserify',
  //    stream: 'stream-browserify',
  //    //assert: 'assert',
  //    //process: 'process',
  //    buffer: 'buffer',      
  //    //util: 'util',
  //  },
  //},
  //optimizeDeps: {
  //  esbuildOptions: {
  //    define: {
  //      global: 'globalThis',
  //    },
  //    plugins: [
  //      NodeGlobalsPolyfillPlugin({
  //        process: true,
  //        buffer: true,
  //        //Buffer: true,
  //      }),
  //      //NodeModulesPolyfillPlugin(),
  //    ],
  //  },
  //},
  build: {
    //rollupOptions: {
    //  plugins: [rollupNodePolyFill()],
    //},
    //commonjsOptions: {
    //  include: ['node_modules/**/*.js']
    //},
    
    rollupOptions: {
        onwarn(warning, warn) {
          if (
            warning.message.includes('PURE') || 
            warning.message.includes('has been externalized')           
          ) return;          
          warn(warning); // Let Rollup handle other warnings normally
        },
        //plugins: [
        //  //rollupNodePolyFill(),
        //  inject({
        //    process: 'process',
        //    Buffer: ['buffer/','Buffer'],
        //  }),
        //],
    },
  },
})
