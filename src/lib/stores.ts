import { writable } from 'svelte/store'

export type aiInputType = { image: File | null; isApartment: boolean }

export const aiInput = writable<aiInputType | null>({
  image: null,
  isApartment: true
})
