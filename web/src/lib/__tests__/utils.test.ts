import { cn, getIntlLocale } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge tailwind classes correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4') // tailwind-merge in action
      expect(cn('text-red-500', false && 'text-blue-500', 'text-center')).toBe('text-red-500 text-center') // clsx in action
    })
  })

  describe('getIntlLocale', () => {
    it('should return correct intl locale maps', () => {
      expect(getIntlLocale('pt')).toBe('pt-BR')
      expect(getIntlLocale('en')).toBe('en-US')
      expect(getIntlLocale('es')).toBe('es-ES')
      expect(getIntlLocale('fr')).toBe('fr-FR')
      expect(getIntlLocale('ja')).toBe('ja-JP')
    })

    it('should return unchanged locale if not mapped', () => {
      expect(getIntlLocale('de')).toBe('de')
      expect(getIntlLocale('it')).toBe('it')
    })
  })
})
