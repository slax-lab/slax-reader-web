import type { GeneratedI18nStructure } from '#i18n'

export const $t = (name: keyof GeneratedI18nStructure) => {
  return i18n.t(name)
}
