export type QueueT<Action> = {
  enqueue(action: Action): void
  queue: readonly Action[]
}

/** Queue where all enqueued actions are merged into one before execution */
export function MergingQueue<Action>(
  run: (action: Action) => Promise<void>,
  merge: (fst: Action, snd: Action) => Action
): QueueT<Action> {

  let queue: Action[] = []
  let working = false

  async function worker() {
    if (working || queue.length === 0)
      return

    working = true
    const actions = queue.splice(0)
    const action = actions.reduce(merge)
    await run(action)
    working = false

    setTimeout(worker, 0)
  }

  function enqueue(action: Action) {
    queue.push(action)
    worker()
  }

  return { enqueue, queue }
}