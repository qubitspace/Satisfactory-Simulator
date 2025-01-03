const path = require('path')
const typescript = require('esbuild-plugin-typescript')

require("esbuild").build({
    entryPoints: ["app/javascript/application.js"],
    bundle: true,
    outdir: path.join(process.cwd(), "app/assets/builds"),
    absWorkingDir: path.join(process.cwd()),
    watch: process.argv.includes("--watch"),
    plugins: [typescript()],
}).catch(() => process.exit(1))