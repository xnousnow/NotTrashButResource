import { writable, derived } from 'svelte/store'

export const inputMode = writable<'image' | 'text'>('image')

// Define a type for the input value based on the input mode
type InputValue = File | string | null

export const inputStore = writable<InputValue>(null)

export const input = derived([inputMode, inputStore], ([$inputMode, $inputStore]) => {
  if ($inputMode === 'image') {
    return $inputStore instanceof File || $inputStore === null ? $inputStore : null
  } else {
    return typeof $inputStore === 'string' || $inputStore === null ? $inputStore : null
  }
})
export const isApartment = writable(true)
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
