import { env } from '$env/dynamic/private'

import { createClient } from '@supabase/supabase-js'

import type { RequestHandler } from './$types'

const supabase = createClient(env.SUPABASE_URL ?? '', env.SUPABASE_ANON_KEY ?? '')

export const POST: RequestHandler = async () => {
  return new Response(
    JSON.stringify(
      (await supabase
        .from('guidebook')
        .select('name')
        .then(({ data }) => {
          return data?.map((item) => item.name)
        })) as string[]
    )
  )
}
