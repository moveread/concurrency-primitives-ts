import * as E from 'fp-ts/Either'

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

export function RetriedQueue<Action, L, R>(
  run: (action: Action) => AsyncEither<L, R>
): QueueT<Action, L, R> {
  let queue: Item<Action, L, R>[] = []
  let working = false

  async function worker(idx: number) {
    if (working || idx >= queue.length)
      return

    working = true
    const { action, ...item } = queue[idx]
    if (item.status === 'succeeded') // shouldn't happen, duh
      return worker(idx + 1)
    
    const r = await run(action)
    if (E.isLeft(r)) {
      queue[idx] = { action, status: 'failed', error: r.left }
      return
    }

    queue[idx] = { action, status: 'succeeded', result: r.right }
    setTimeout(() => worker(idx + 1), 0)
  }

  function enqueue(action: Action) {
    queue.push({ status: 'fresh', action })
    const idx = queue.findIndex(action => action.status !== 'succeeded')
    worker(idx)
  }

  return { queue, enqueue, retry: worker }
}