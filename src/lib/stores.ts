import { writable } from 'svelte/store'

export const image = writable<File | null>(null)
export const isApartment = writable(true)
export const inputMode = writable<'image' | 'text'>('image')
export const localStorageLoaded = writable(false)

if (typeof window !== 'undefined') {
  const storedIsApartment = localStorage.getItem('isApartment')
  if (storedIsApartment) isApartment.set(JSON.parse(storedIsApartment))
  isApartment.subscribe((value) => localStorage.setItem('isApartment', JSON.stringify(value)))

  const storedInputMode = localStorage.getItem('inputMode')
  if (storedInputMode) inputMode.set(JSON.parse(storedInputMode))
  inputMode.subscribe((value) => localStorage.setItem('inputMode', JSON.stringify(value)))

  localStorageLoaded.set(true)
}
