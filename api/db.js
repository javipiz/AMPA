
const { sql } = require('@vercel/postgres');

// This file is used by the API routes to interact with Vercel Postgres.
// You need to set up Vercel Postgres in your Vercel project dashboard.
// It will automatically provide the POSTGRES_URL environment variable.
DATABASE_PRISMA_DATABASE_URL="postgres://da8323ffa67f6f1c4e95df8cc67bd95317402faf6eefeed67ed2879a2cc228eb:sk_9VIy9ysp8nvFmC6EJL7oS@db.prisma.io:5432/postgres?sslmode=require"
DATABASE_POSTGRES_URL="postgres://da8323ffa67f6f1c4e95df8cc67bd95317402faf6eefeed67ed2879a2cc228eb:sk_9VIy9ysp8nvFmC6EJL7oS@db.prisma.io:5432/postgres?sslmode=require"
DATABASE_PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza185Vkl5OXlzcDhudkZtQzZFSkw3b1MiLCJhcGlfa2V5IjoiMDFLQjUxUVhCQ1I5UUdFMDlBTk1HRkUwQkoiLCJ0ZW5hbnRfaWQiOiJkYTgzMjNmZmE2N2Y2ZjFjNGU5NWRmOGNjNjdiZDk1MzE3NDAyZmFmNmVlZmVlZDY3ZWQyODc5YTJjYzIyOGViIiwiaW50ZXJuYWxfc2VjcmV0IjoiOTkwZWMxYzMtMTg5ZC00OTQ3LWJhNmItMjhkZTU2MWJjNmFiIn0.VvgWz0mdJc_tA7eXXs-Pzdr6oAbFB2Oav4Ti7nUKHnA"

module.exports = { sql };
