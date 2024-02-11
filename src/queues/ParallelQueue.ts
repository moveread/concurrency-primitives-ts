import * as R from 'ramda'

export type Split<Action> = { now: Action[], later: Action[] }

export function aggregatePop<Action>(
  queue: Action[], aggregate: (fst: Action, snd: Action) => Split<Action>
): Split<Action> {

  function f(split: Split<Action>, curr: Action): Split<Action> {
    const last = split.now[split.now.length-1]
    const { now, later }: Split<Action> = last
      ? aggregate(last, curr)
      : { now: [curr], later: [] }

    return { now: [...split.now, ...now], later: [...split.later, ...later] }
  }

  return queue.reduce(f, { now: [], later: [] })
}

export type QueueT<Action> = {
  enqueue(action: Action): void
  queue: readonly Action[]
}

/** Queue where actions are aggregated and run concurrently  */
export function ParallelQueue<Action>(
  run: (action: Action, curr: QueueT<Action>) => Promise<boolean>,
  aggregate: (fst: Action, snd: Action) => Split<Action>
): QueueT<Action> {

  let queue: Action[] = []
  let working = false

  function enqueue(action: Action) {
    queue.push(action)
    worker()
  }

  async function worker() {
    if (working || queue.length === 0)
      return

    working = true
    const { now, later } = aggregatePop(queue, aggregate)
    queue = later
    const results = await Promise.all(now.map(action => run(action, { enqueue, queue })))
    const failed = R.zip(now, results)
      .filter(([_, succeded]) => !succeded)
      .map(([action]) => action)
    queue.unshift(...failed)
    working = false

    if (failed.length === 0)
      setTimeout(worker, 0)
  }


  return { enqueue, queue }
}