import { writable } from 'svelte/store'

export const image = writable<File | null>(null)
export const isApartment = writable(true)
export const didOnboarding = writable(false)
export const localStorageLoaded = writable(false)

if (typeof window !== 'undefined') {
  if (localStorage.getItem('didOnboarding') === 'true') {
    didOnboarding.set(true)
  }
  didOnboarding.subscribe(value => {
    localStorage.setItem('didOnboarding', value ? 'true' : 'false')
  })

  if (localStorage.getItem('isApartment')) {
    isApartment.set(localStorage.getItem('isApartment') === 'true')
  }
  isApartment.subscribe(value => {
    localStorage.setItem('isApartment', JSON.stringify(value))
  })

  localStorageLoaded.set(true)
}
