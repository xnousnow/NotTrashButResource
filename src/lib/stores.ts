import { writable } from 'svelte/store'

export const image = writable<File | null>(null)
export const didOnboarding = writable(false)

if (typeof window !== 'undefined') {
  if (localStorage.getItem('didOnboarding')) {
    didOnboarding.set(true)
  }

  didOnboarding.subscribe(value => {
    localStorage.setItem('didOnboarding', value ? 'true' : 'false')
  })
}
