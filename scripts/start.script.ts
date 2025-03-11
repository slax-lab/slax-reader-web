import projects from '../configs/cmd'

import { bold, magentaBright, red } from 'colorette'
import { execaCommand } from 'execa'
import inquirer from 'inquirer'

inquirer
  .prompt([
    {
      type: 'list',
      message: '要启动的项目：',
      name: 'mono', // 存储答案的字段
      default: projects[0].enName, // 默认启动项
      choices: projects.map(p => {
        // 选择
        return { name: p.cnName, value: p.enName }
      })
    }
  ])
  .then(({ mono: prd }) => {
    const project = projects.find(v => v.enName == prd)
    if (!project) {
      throw new Error(`>>> 未找到项目：${bold(red(prd))}`)
    }

    console.log(`>>> 当前项目：${bold(magentaBright(project.enName))}`)

    const cmd = `pnpm --F @apps/${project.enName} run dev `
    const envVars = {
      selectedProject: project.enName,
      product: prd
    }

    execaCommand(cmd, { stdio: 'inherit', env: envVars })
  })
  .catch(err => {
    console.log('error', err)
  })
