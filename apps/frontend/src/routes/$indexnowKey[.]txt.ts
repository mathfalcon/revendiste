import {createFileRoute} from '@tanstack/react-router';

// Serves the IndexNow ownership verification file at /{INDEXNOW_KEY}.txt
// See: https://www.indexnow.org/documentation
export const Route = createFileRoute('/$indexnowKey.txt')({
  server: {
    handlers: {
      GET: async ({params}) => {
        // INDEXNOW_KEY is the key only; TanStack passes the route param with a `.txt` suffix.
        const key = process.env.INDEXNOW_KEY?.trim();
        const raw = params['indexnowKey.txt'];
        const requestedKey = String(raw ?? '')
          .replace(/\.txt$/i, '')
          .trim();

        if (!key || requestedKey !== key) {
          return new Response('Not found', {status: 404});
        }

        return new Response(key, {
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      },
    },
  },
});
