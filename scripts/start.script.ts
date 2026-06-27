import projects from '../configs/cmd'

import { bold, cyan, magentaBright, red } from 'colorette'
import { execaCommand } from 'execa'
import * as readline from 'node:readline'

function startProject(prd: string) {
  const project = projects.find(v => v.enName == prd)
  if (!project) {
    throw new Error(`>>> 未找到项目：${bold(red(prd))}`)
  }
  console.log(`>>> 当前项目：${bold(magentaBright(project.enName))}`)
  const cmd = `pnpm --F @apps/${project.enName} run dev `
  const envVars = { selectedProject: project.enName, product: prd }
  execaCommand(cmd, { stdio: 'inherit', env: envVars })
}

// 支持命令行参数：pnpm dev dweb / pnpm dev extensions / pnpm dev slax-reader-dweb
const arg = process.argv[2]
if (arg) {
  const matched = projects.find(
    p => p.enName === arg || p.enName.replace('slax-reader-', '') === arg
  )
  if (!matched) {
    const names = projects.map(p => `${p.enName.replace('slax-reader-', '')} (${p.cnName})`).join(', ')
    console.error(`>>> 未知项目 "${arg}"，可用：${names}`)
    process.exit(1)
  }
  startProject(matched.enName)
} else {
  // 用 readline 实现简单的数字选择，兼容所有终端
  console.log('要启动的项目：')
  projects.forEach((p, i) => {
    console.log(`  ${cyan(String(i + 1))}. ${p.cnName}`)
  })
  console.log(`  (默认: 1. ${projects[0].cnName})`)

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  rl.question('请输入序号: ', answer => {
    rl.close()
    const idx = answer.trim() === '' ? 0 : parseInt(answer.trim(), 10) - 1
    const project = projects[idx]
    if (!project) {
      console.error(`>>> 无效序号 "${answer.trim()}"，请输入 1-${projects.length}`)
      process.exit(1)
    }
    startProject(project.enName)
  })
}
