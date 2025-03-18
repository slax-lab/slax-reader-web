const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

export const getI18nLang = () => {
  return {
    en,
    zh
  }
}
