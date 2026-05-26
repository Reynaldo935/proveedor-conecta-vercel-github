# Task: Rewrite map-view.tsx to use Google Maps

## Summary
Successfully rewrote `/home/z/my-project/src/components/map/map-view.tsx` from Leaflet to Google Maps using `@react-google-maps/api`.

## Key Changes
1. **Replaced Leaflet with Google Maps**: Swapped `leaflet` imports for `@react-google-maps/api` (GoogleMap, LoadScript, Marker, InfoWindow)
2. **Map Controls**: Configured all required controls:
   - `mapTypeControl: true` with roadmap, satellite, hybrid, terrain options
   - `zoomControl: true`
   - `streetViewControl: true`
   - `fullscreenControl: true`
3. **Center on Nicaragua**: lat: 12.8654, lng: -85.2072, zoom: 7
4. **Sample Vendors**: Preserved all 35 SAMPLE_VENDORS with markers and InfoWindow on click
5. **Department Filter**: All 17 Nicaragua departments with fly-to navigation via `panTo`/`setZoom`
6. **Search**: Search by department name (exact and partial match)
7. **API Key Handling**: 
   - Reads `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` from env
   - If missing, shows fallback UI with input field to paste API key temporarily
   - If invalid, shows error with retry option
8. **Architecture**: Split into `MapView` (outer, handles state/UI) and `MapInner` (inner, rendered inside LoadScript to safely use `google.maps.*` constructors)
9. **"Volver" button**: Navigates back to "home" view

## Technical Decisions
- Moved `mapOptions`, `vendorIcon`, `deptIcon` into `MapInner` component because they reference `google.maps.*` constructors that only exist after the Google Maps script loads
- Used SVG data URIs for custom marker icons
- Used `panTo`/`setZoom` instead of `flyTo` (Leaflet) for department navigation
- Component is dynamically imported with `ssr: false` in page.tsx (pre-existing)

## Verification
- ESLint: Passes with no errors
- TypeScript: No type errors in map-view.tsx
- Dev server: Running cleanly on port 3000
