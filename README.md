# Best Time to Drive

A simple Vue 3 web application that displays traffic forecasts for routes using Google Maps, helping you find the optimal time to travel.

## Features

- **Interactive Google Maps**: Select routes with autocomplete and draggable directions
- **24-Hour Traffic Forecast**: Visual timeline showing journey times throughout the day
- **Smart Insights**: Find the best time to leave and see potential time savings
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Google Maps Setup

Before running the app, you need to set up Google Maps API:

1. **Get a Google Maps API Key**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API  
     - Directions API
     - Geocoding API
   - Create credentials (API Key)

2. **Configure the API Key**:
   - Copy the `.env` file and add your API key:
   ```bash
   VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
   ```

3. **Set up API Key Restrictions** (Recommended):
   - In Google Cloud Console, restrict your API key to your domain
   - For development, add `http://localhost:5173/*` to HTTP referrers
   - Set up billing alerts to monitor usage

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your Google Maps API key in the `.env` file (see above)

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## How to Use

1. **Enter Locations**: Use the "From" and "To" fields with autocomplete suggestions
2. **Calculate Route**: Click the button to generate the route and display it on the map
3. **View Forecast**: See the 24-hour traffic timeline chart below the map
4. **Analyze Results**: Check the insights for optimal departure times and potential time savings
5. **Interactive Map**: Drag the route on the map to explore alternative paths

## Environment Variables

Create a `.env` file in the root directory with:

```bash
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

**Important**: Never commit real API keys to version control. The `.env` file is gitignored by default.

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## API Usage Notes

- The app uses Google Maps APIs which have usage limits and costs
- Monitor your API usage in the Google Cloud Console
- Consider implementing API key restrictions for security
- Traffic data accuracy depends on Google's traffic information

## Troubleshooting

### "Google Maps API key not configured" Error
- Make sure you have a `.env` file in the root directory
- Verify the API key is set: `VITE_GOOGLE_MAPS_API_KEY=your_key_here`
- Restart the development server after changing the `.env` file

### "InvalidKeyMapError" 
- Check that your API key is valid in Google Cloud Console
- Ensure billing is enabled for your Google Cloud project
- Verify all required APIs are enabled (Maps JavaScript, Places, Directions, Geocoding) 