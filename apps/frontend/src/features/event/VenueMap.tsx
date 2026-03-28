import {useCallback, useState} from 'react';
import maplibregl from 'maplibre-gl';
import {
  Map,
  useMap,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
} from '~/components/ui/map';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  MapPin,
  Maximize2,
  Locate,
  Loader2,
  Navigation,
  Plus,
  Minus,
} from 'lucide-react';
import {cn} from '~/lib/utils';

interface VenueMapProps {
  latitude: number;
  longitude: number;
  venueName: string | null;
  venueAddress: string | null;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export const VenueMap = ({
  latitude,
  longitude,
  venueName,
  venueAddress,
  expanded,
  onExpandedChange,
}: VenueMapProps) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const center: [number, number] = [longitude, latitude];

  return (
    <>
      {/* Compact preview — non-interactive, click to expand */}
      <div className='relative group'>
        <button
          type='button'
          onClick={() => onExpandedChange(true)}
          className='w-full rounded-lg overflow-hidden border border-border h-[160px] md:h-[200px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
          aria-label='Ampliar mapa'
        >
          <Map center={center} zoom={15} interactive={false} attributionControl={false}>
            <MapMarker longitude={longitude} latitude={latitude}>
              <MarkerContent>
                <div className='size-4 rounded-full bg-primary border-2 border-white shadow-lg' />
              </MarkerContent>
              {venueName && <MarkerTooltip>{venueName}</MarkerTooltip>}
            </MapMarker>
          </Map>
        </button>
        <div className='absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm border border-border text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'>
          <Maximize2 className='w-3 h-3' />
          <span>Ampliar</span>
        </div>
      </div>

      {/* Expanded dialog with full interactive map */}
      <Dialog open={expanded} onOpenChange={onExpandedChange}>
        <DialogContent className='sm:max-w-2xl p-0 overflow-hidden'>
          <DialogHeader className='p-4 pb-2'>
            <DialogTitle className='flex items-center gap-2'>
              <MapPin className='w-5 h-5' />
              {venueName ?? 'Ubicación'}
            </DialogTitle>
            {venueAddress && (
              <p className='text-sm text-muted-foreground'>{venueAddress}</p>
            )}
          </DialogHeader>
          <div className='h-[60vh] md:h-[70vh]'>
            <Map center={center} zoom={15} attributionControl={false}>
              <ExpandedMapControls
                venueLng={longitude}
                venueLat={latitude}
                onUserLocationChange={setUserLocation}
              />
              <MapMarker longitude={longitude} latitude={latitude}>
                <MarkerContent>
                  <div className='size-5 rounded-full bg-primary border-2 border-white shadow-lg' />
                </MarkerContent>
                {venueName && <MarkerTooltip>{venueName}</MarkerTooltip>}
              </MapMarker>
              {userLocation && (
                <MapMarker
                  longitude={userLocation[0]}
                  latitude={userLocation[1]}
                >
                  <MarkerContent>
                    <div className='size-3 rounded-full bg-blue-500 border-2 border-white shadow-lg ring-4 ring-blue-500/20' />
                  </MarkerContent>
                  <MarkerTooltip>Tu ubicación</MarkerTooltip>
                </MapMarker>
              )}
            </Map>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// --- Expanded map controls (locate cycle + zoom) ---

type LocateState = 'idle' | 'locating' | 'both' | 'user' | 'venue';

function ExpandedMapControls({
  venueLng,
  venueLat,
  onUserLocationChange,
}: {
  venueLng: number;
  venueLat: number;
  onUserLocationChange: (coords: [number, number]) => void;
}) {
  const {map} = useMap();
  const [locateState, setLocateState] = useState<LocateState>('idle');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  const handleLocate = useCallback(() => {
    if (!map) return;

    if (locateState === 'idle' || locateState === 'venue' || !userCoords) {
      // Get location (or re-use cached) and fit both points
      if (userCoords) {
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([venueLng, venueLat]);
        bounds.extend(userCoords);
        map.fitBounds(bounds, {padding: 60, maxZoom: 15});
        setLocateState('both');
        return;
      }

      setLocateState('locating');
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords: [number, number] = [
            pos.coords.longitude,
            pos.coords.latitude,
          ];
          setUserCoords(coords);
          onUserLocationChange(coords);

          const bounds = new maplibregl.LngLatBounds();
          bounds.extend([venueLng, venueLat]);
          bounds.extend(coords);
          map.fitBounds(bounds, {padding: 60, maxZoom: 15});
          setLocateState('both');
        },
        () => setLocateState('idle'),
      );
    } else if (locateState === 'both') {
      // Zoom to user location
      map.flyTo({center: userCoords, zoom: 15, duration: 800});
      setLocateState('user');
    } else if (locateState === 'user') {
      // Zoom back to venue
      map.flyTo({center: [venueLng, venueLat], zoom: 15, duration: 800});
      setLocateState('venue');
    }
  }, [map, locateState, userCoords, venueLng, venueLat, onUserLocationChange]);

  const handleZoomIn = useCallback(() => {
    map?.zoomTo(map.getZoom() + 1, {duration: 300});
  }, [map]);

  const handleZoomOut = useCallback(() => {
    map?.zoomTo(map.getZoom() - 1, {duration: 300});
  }, [map]);

  const locateIcon = (() => {
    switch (locateState) {
      case 'locating':
        return <Loader2 className='size-4 animate-spin' />;
      case 'both':
        return <Navigation className='size-4' />;
      case 'user':
        return <MapPin className='size-4' />;
      default:
        return <Locate className='size-4' />;
    }
  })();

  return (
    <div className='absolute bottom-10 right-2 z-10 flex flex-col gap-1.5'>
      <ControlGroup>
        <ControlButton
          onClick={handleLocate}
          label='Mostrar mi ubicación'
          disabled={locateState === 'locating'}
        >
          {locateIcon}
        </ControlButton>
      </ControlGroup>
      <ControlGroup>
        <ControlButton onClick={handleZoomIn} label='Acercar'>
          <Plus className='size-4' />
        </ControlButton>
        <ControlButton onClick={handleZoomOut} label='Alejar'>
          <Minus className='size-4' />
        </ControlButton>
      </ControlGroup>
    </div>
  );
}

// --- Reusable control primitives (matching mapcn MapControls style) ---

function ControlGroup({children}: {children: React.ReactNode}) {
  return (
    <div className='border-border bg-background [&>button:not(:last-child)]:border-border flex flex-col overflow-hidden rounded-md border shadow-sm [&>button:not(:last-child)]:border-b'>
      {children}
    </div>
  );
}

function ControlButton({
  onClick,
  label,
  children,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'hover:bg-accent dark:hover:bg-accent/40 flex size-8 items-center justify-center transition-colors',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
      )}
    >
      {children}
    </button>
  );
}
