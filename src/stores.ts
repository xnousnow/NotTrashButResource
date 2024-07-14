import { writable } from 'svelte/store'

export const image = writable<File | null>(null)
