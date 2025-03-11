interface ProjectConfig {
  enName: string
  cnName: string
  root: string
}

const projects: ProjectConfig[] = [
  {
    enName: 'slax-reader-extensions',
    cnName: 'slax-reader插件',
    root: 'slax-reader-extensions'
  },
  {
    enName: 'slax-reader-dweb',
    cnName: 'slax-reader网页版',
    root: 'slax-reader-dweb'
  }
]

export default projects
