export type QueueT<Action> = {
  enqueue(action: Action): void
  queue: readonly Action[]
}
/** A dead-simple queue */
export function SimpleQueue<Action>(
  run: (action: Action) => Promise<void>
): QueueT<Action> {

  let queue: Action[] = []
  let working = false

  async function worker() {
    if (working || queue.length === 0)
      return

    working = true
    const [action] = queue.splice(0, 1)
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