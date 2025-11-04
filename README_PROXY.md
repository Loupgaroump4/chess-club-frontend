Development note:
This frontend uses fetch to /api/proxy/... as a simple convention.
When developing locally, you can set up a proxy (e.g. with Next.js rewrites) or run the frontend with:
  NEXT_PUBLIC_API_URL=http://localhost:5000

Then replace fetch('/api/proxy/xyz') with fetch(process.env.NEXT_PUBLIC_API_URL + '/xyz')
