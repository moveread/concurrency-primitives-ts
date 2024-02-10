# Concurrency Primitives

> Simple, functional concurrency primitives

## Usage

```typescript
type Action = {
  action: 'greet'
  name: string
} | {
  action: 'farewell'
  when: string
}

async function run(action: Action) {
  switch (action.action) {
    case 'greet':
      console.log(`Hi, ${action.name}!`)
      break
    case 'farewell':
      console.log(`See you ${when}!`)
      break
  }
}

const { enqueue, queue } = Queue(run)

enqueue({ action: 'greet', name: 'Bobby' })
enqueue({ action: 'farewell', when: 'in 1992' })
```
