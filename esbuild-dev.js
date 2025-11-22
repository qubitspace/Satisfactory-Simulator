const esbuild = require('esbuild')
const typescript = require('esbuild-plugin-typescript')

esbuild.build({
    entryPoints: ['app/javascript/simulation/config.ts'],
    bundle: true,
    outfile: 'app/assets/builds/application.js',
    sourcemap: true,
    watch: {
        onRebuild(error) {
            if (error) console.error('Build failed:', error)
            else console.log('Build succeeded')
        },
    },
    plugins: [typescript()],
    loader: { '.ts': 'ts' }
})