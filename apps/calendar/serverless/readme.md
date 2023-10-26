```
import { parentPort, workerData } from 'node:worker_threads'
import InProcessRunner from '../in-process-runner/index.js'

const { functionKey, handler, servicePath, timeout, codeDir } = workerData
```

```
// node_modules/.pnpm/serverless-offline@9.3.1_serverless@3.22.0/node_modules/serverless-offline/src/lambda/handler-runner/worker-thread-runner/workerThreadHelper.js

l.11
 const inProcessRunner = new InProcessRunner(
    {
      codeDir: codeDir.replace('/.build/.esbuild/.build', '/.esbuild/.build'),
      functionKey,
      handler,
      servicePath: servicePath.replace('/.build/.esbuild/.build', '/.esbuild/.build'),
      timeout,
    },
    env,
  )
```
