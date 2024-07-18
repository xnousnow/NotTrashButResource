import { writable } from 'svelte/store'

export const image = writable<File | null>(null)
export const isApartment = writable<boolean>(false)
