# Rush Hour Planner

This web app is a one page, simple tool to check when it is a best time to drive on a set route. When a driver want's to simply check when there's lowest traffic on a route they're taking, they can imput it here and they'll get a prediction on the next 24h, next day etc

The way this is achieved is by using the TomTom Routing API (with `departAt` + traffic prediction) which provides forecast drive times. The server API samples ~8-15 times across 24h using adaptive sampling + interpolation + caching for efficiency (cheaper than full queries). 

The client still uses Google Maps JS API for interactive map, autocomplete, route visualization, and traffic layer.

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

Get your:
- TomTom API key from https://developer.tomtom.com/ (for traffic forecasts - main cost driver)
- OpenAI API key from https://platform.openai.com/api-keys (for parking suggestions)
- (Optional) Google Maps API key (still used for client-side map)

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
* Alternative routes