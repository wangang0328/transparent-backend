// 将 env 拷贝到 dist目录下
const fse = require('fs-extra')
const path = require('path')

const targetPath = path.join(process.cwd(), 'dist/env')
const sourcePath = path.join(process.cwd(), 'env')
fse.ensureDir(targetPath)
fse.copy(sourcePath, targetPath)