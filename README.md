# Rush Hour Planner

This web app is a one page, simple tool to check when it is a best time to drive on a set route. When a driver want's to simply check when there's lowest traffic on a route they're taking, they can imput it here and they'll get a prediction on the next 24h, next day etc

The way this is achieved is by using Google Directions API which provides a forecast drive time for a given hour. So we have an API which checks 24 predictions and finds the lowest drive time.

There are also Google Maps API calls to get autocomplete in address fields and a map render.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key_here
VITE_GOOGLE_MAPS_API_KEY=your_frontend_google_maps_api_key_here
GOOGLE_DIRECTIONS_API_KEY=your_backend_google_directions_api_key_here
UPSTASH_REDIS_REST_URL=your_upstash_rest_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token_here
FORECAST_SHADOW_SAMPLE_RATE=0
FORECAST_CACHE_VERSION=v1
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.


TODO:

* EV charging