import { json } from '@sveltejs/kit'

import { getCategoryNames } from '$lib/utils/supabase'

import type { RequestHandler } from './$types'

export const POST: RequestHandler = async () => json(await getCategoryNames())
