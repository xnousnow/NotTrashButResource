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
        result.data?.map(({ name, guide, tips, category }) => ({
          name,
          guide: guide.split('\n'),
          tips: tips?.split('\n'),
          category
        })) ?? []
    )
