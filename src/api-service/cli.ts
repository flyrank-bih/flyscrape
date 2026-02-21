import { createApiService } from './server';

const service = createApiService();

service
  .start()
  .then(({ port }) => {
    console.info(`API service listening on port ${port}`);
  })
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Failed to start API service',
    );
    process.exit(1);
  });
