import * as E from 'fp-ts/Either'
import * as R from 'ramda'
import { useCallback, useRef, useState } from 'react'

export type AsyncEither<L, R> = Promise<E.Either<L, R>>

export type Item<Action, L, R> = {
  action: Action
} & ({
  status: 'fresh'
} | {
  status: 'failed'
  error: L
} | {
  status: 'succeeded'
  result: R
})

export type QueueT<Action, L, R> = {
  enqueue(action: Action)
  retry(idx: number)
  queue: readonly Item<Action, L, R>[]
}

export function useRetriedQueue<Action, L, R>(
  run: (action: Action) => AsyncEither<L, R>
): QueueT<Action, L, R> {

  const [queue, setQueue] = useState<Item<Action, L, R>[]>([])
  const working = useRef(false)

  const worker = useCallback(async (idx: number) => {
    if (working.current || idx >= queue.length)
      return

    working.current = true
    const { action, ...item } = queue[idx]
    if (item.status === 'succeeded') // shouldn't happen, duh
      return worker(idx + 1)
    
    const r = await run(action)
    if (E.isLeft(r)) {
      setQueue(q => R.update(idx, { action, status: 'failed', error: r.left }, q))
      return
    }

    setQueue(q => R.update(idx, { action, status: 'succeeded', result: r.right }, q))
    setTimeout(() => worker(idx + 1), 0)
  }, [queue, run, setQueue])

  function enqueue(action: Action) {
    queue.push({ status: 'fresh', action })
    const idx = queue.findIndex(action => action.status !== 'succeeded')
    worker(idx)
  }

  return { queue, enqueue, retry: worker }
}
