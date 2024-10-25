import { env } from '$env/dynamic/private'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(env.SUPABASE_URL ?? '', env.SUPABASE_ANON_KEY ?? '')

export const getCategoryNames = async () => {
  return (await supabase
    .from('guidebook')
    .select('name')
    .then(({ data }) => {
      return data?.map((item) => item.name)
    })) as string[]
}

export const getGuides = async (queries: string[]) =>
  supabase
    .from('guidebook')
    .select('*')
    .in('name', queries)
    .then(
      (result) =>
        result.data?.map(({ name, guide, tips }) => ({
          name: name as string,
          steps: guide.split('\n') as string[],
          tips: tips?.split('\n') as string[] | undefined
        })) ?? []
    )

export type RetrievedGuide = Awaited<ReturnType<typeof getGuides>>[number]
