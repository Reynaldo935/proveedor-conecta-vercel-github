# Task: Fix Map Component for ProveedorConecta Nicaragua - Dual Google Maps / Leaflet Approach

## Agent: Main Developer
## Task ID: map-dual-approach

## Summary

Refactored the map component at `/home/z/my-project/src/components/map/map-view.tsx` to support a dual approach:
1. **Google Maps** via `@vis.gl/react-google-maps` when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
2. **Leaflet (OpenStreetMap + Esri Satellite)** as fallback when no API key is available

## Files Created/Modified

### Created
1. **`.env.local`** - Environment variables for Google Maps API key and Map ID (both empty by default, so Leaflet is used)
2. **`src/components/map/map-data.ts`** - Shared types (`Vendor`, `SampleVendor`, `MapInnerHandle`), constants (`NICARAGUA_CENTER`, `NICARAGUA_DEFAULT_ZOOM`, `CITY_COORDS`), sample vendor data, and helper function (`isVendor`)
3. **`src/components/map/google-map-inner.tsx`** - Google Maps implementation using `@vis.gl/react-google-maps` with `APIProvider`, `Map`, `AdvancedMarker`, `Pin`, `InfoWindow`, and `useMap` hook
4. **`src/components/map/leaflet-map-inner.tsx`** - Enhanced Leaflet implementation with OSM tiles + Esri World Imagery satellite tiles + Esri Reference Overlay labels

### Modified
5. **`src/components/map/map-view.tsx`** - Complete rewrite with:
   - Dynamic imports for both map components (ssr: false)
   - API key detection via `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Runtime fallback from Google Maps to Leaflet on error
   - Provider badge in header showing active map provider
   - All existing features preserved (search, department filter, vendor info panel, framer-motion animations)

## Architecture

```
MapView (main component)
├── Checks NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
├── GoogleMapInner (dynamic import, ssr: false)
│   ├── APIProvider (Google Maps wrapper)
│   ├── Map (with satellite/roadmap toggle)
│   ├── MapController (uses useMap() for imperative control)
│   ├── AdvancedMarker + Pin (department & vendor markers)
│   ├── InfoWindow (selected marker info popup)
│   └── onError → falls back to Leaflet
└── LeafletMapInner (dynamic import, ssr: false)
    ├── Leaflet map (imperative)
    ├── OSM tile layer (default)
    ├── Esri World Imagery (satellite toggle)
    ├── Esri Reference Overlay (labels on satellite)
    └── Custom divIcon markers (dept + vendor)
```

## Key Features
- Satellite view toggle on both map types
- 17 department markers with popups/InfoWindows
- 35 sample vendor markers across all departments
- flyTo() imperative control via forwardRef/useImperativeHandle
- Runtime Google Maps → Leaflet fallback on API error
- Provider indicator badge in header and on map
- Mobile responsive (h-[400px] sm:h-[500px])
- All shadcn/ui components preserved (Button, Card, Input, Badge, Select, Avatar, Skeleton)

## Lint Status
✅ All ESLint checks pass (0 errors, 0 warnings)
