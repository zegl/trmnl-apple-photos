# Apple Photos Worker

This worker processes tasks related to Apple Photos integration.

## Development

To run the worker in development mode:

```bash
npm run start:worker
```

This uses `tsx` to run the TypeScript files directly.

## Production

For production, you should pre-compile the worker to JavaScript:

```bash
# Compile only the worker
npm run build:worker:only

# Or compile everything (Next.js app + worker)
npm run build
```

To run the compiled worker:

```bash
npm run start:worker:prod
```

## Environment Variables

Make sure to set the necessary environment variables before running the worker. 