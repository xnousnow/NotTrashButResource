import type { RequestBase } from '$routes/api/guide/types'
import { writable, derived } from 'svelte/store'

export const inputMode = writable<'image' | 'text'>('image')

type InputValue = File | string | null

export const inputStore = writable<InputValue>(null)

export const input = derived([inputMode, inputStore], ([$inputMode, $inputStore]) => {
  if ($inputMode === 'image') {
    return $inputStore instanceof File || $inputStore === null ? $inputStore : null
  } else {
    return typeof $inputStore === 'string' || $inputStore === null ? $inputStore : null
  }
})
export const options = writable<RequestBase['options']>({
  residenceType: 'apartment'
})
export const localStorageLoaded = writable(false)

if (typeof window !== 'undefined') {
  const storedOptions = localStorage.getItem('options')
  if (storedOptions) options.set(JSON.parse(storedOptions))
  options.subscribe((value) => localStorage.setItem('options', JSON.stringify(value)))

  const storedInputMode = localStorage.getItem('inputMode')
  if (storedInputMode) inputMode.set(JSON.parse(storedInputMode))
  inputMode.subscribe((value) => localStorage.setItem('inputMode', JSON.stringify(value)))

  localStorageLoaded.set(true)
}
