import { z } from 'zod'

export const tupleToNumberedObject = <T extends z.ZodTypeAny[]>(items: T) =>
  z.object(
    items.reduce(
      (acc, item, index) => {
        acc[index + 1] = item
        return acc
      },
      {} as Record<number, z.ZodTypeAny>
    )
  )

export const numberedObjectToArray = <T extends Record<number, unknown>>(obj: T): unknown[] =>
  Object.entries(obj)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, value]) => value)
