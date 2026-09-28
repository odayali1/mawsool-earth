import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import type { GlobeMethods } from 'react-globe.gl';
import type { CountryRow } from '../lib/analytics';
import { asset } from '../lib/asset';
import { capColor, extrusion, sideColor, strokeColor, type LandTone } from '../lib/color';
import { escapeHtml, formatFull } from '../lib/format';
import type { LandFeature, PlacePoint } from '../lib/land';
import type { RegionId } from '../lib/regions';

export type EarthGlobeHandle = {
  focus: (lat: number, lng: number) => void;
};

type Marker = CountryRow & { lat: number; lng: number };

type Props = {
  land: LandFeature[];
  places: Map<string, PlacePoint>;
  rows: CountryRow[];
  max: number;
  noun: string;
  hover: string | null;
  selected: string | null;
  region: RegionId | null;
  orbit: boolean;
  globeRef: Ref<EarthGlobeHandle>;
  onHover: (code: string | null) => void;
  onSelect: (code: string | null) => void;
  onOrbit: (on: boolean) => void;
  onReady: () => void;
  onFail: () => void;
};

const HOME = { lat: 28, lng: -96, altitude: 2.12 };

export function EarthGlobe({
  land,
  places,
  rows,
  max,
  noun,
  hover,
  selected,
  region,
  orbit,
  globeRef,
  onHover,
  onSelect,
  onOrbit,
  onReady,
  onFail,
}: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const api = useRef<GlobeMethods | null>(null);
  const orbitRef = useRef(orbit);
  const onOrbitRef = useRef(onOrbit);
  const onReadyRef = useRef(onReady);
  const onFailRef = useRef(onFail);
  const lastPick = useRef(0);
  const [GlobeComp, setGlobeComp] = useState<typeof import('react-globe.gl').default | null>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const [ready, setReady] = useState(false);

  orbitRef.current = orbit;
  onOrbitRef.current = onOrbit;
  onReadyRef.current = onReady;
  onFailRef.current = onFail;

  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    let alive = true;
    import('react-globe.gl')
      .then((mod) => {
        if (alive) setGlobeComp(() => mod.default);
      })
      .catch(() => onFailRef.current());
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setSize({ w: Math.max(1, rect.width), h: Math.max(1, rect.height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controls = api.current?.controls();
    if (controls) controls.autoRotate = orbit && !reduced;
  }, [orbit, ready, reduced]);

  useEffect(() => {
    const onVisibility = () => {
      const globe = api.current;
      if (!globe) return;
      if (document.hidden) globe.pauseAnimation();
      else globe.resumeAnimation();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useImperativeHandle(globeRef, () => ({
    focus(lat: number, lng: number) {
      api.current?.pointOfView({ lat, lng, altitude: 1.92 }, reduced ? 0 : 1300);
    },
  }));

  const byCode = useMemo(() => new Map(rows.map((row) => [row.code, row])), [rows]);

  const toneOf = (iso: string | null): LandTone => {
    if (!iso) return 'empty';
    const row = byCode.get(iso);
    if (!row) return region ? 'dim' : 'empty';
    if (region && row.region !== region) return 'dim';
    if (iso === selected || iso === hover) return 'hot';
    return 'idle';
  };

  const markers = useMemo(() => {
    const visible = rows.filter((row) => !region || row.region === region);
    const chosen = new Map<string, CountryRow>();
    for (const row of visible.slice(0, 4)) chosen.set(row.code, row);
    if (selected) {
      const row = byCode.get(selected);
      if (row) chosen.set(row.code, row);
    }
    const placed: Marker[] = [];
    for (const row of chosen.values()) {
      const place = places.get(row.code);
      if (!place) continue;
      placed.push({ ...row, lat: place.lat, lng: place.lng });
    }
    return placed;
  }, [rows, region, selected, places, byCode]);

  const beacons = useMemo(() => {
    const placed: Marker[] = [];
    for (const row of rows) {
      const place = places.get(row.code);
      if (!place || place.polygon) continue;
      if (region && row.region !== region) continue;
      placed.push({ ...row, lat: place.lat, lng: place.lng });
    }
    return placed;
  }, [rows, places, region]);

  const rings = useMemo(() => {
    if (selected) return markers.filter((marker) => marker.code === selected);
    return markers.slice(0, 3);
  }, [markers, selected]);

  function tip(name: string, value: number) {
    return `<div class="earth-tip"><b>${escapeHtml(name)}</b><span>${escapeHtml(formatFull(value))} ${escapeHtml(noun)}</span></div>`;
  }

  function pick(code: string) {
    lastPick.current = performance.now();
    onSelect(code);
  }

  function boot(instance: GlobeMethods | null) {
    if (!instance) return;
    const controls = instance.controls();
    controls.autoRotate = orbitRef.current && !reduced;
    controls.autoRotateSpeed = 0.36;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.zoomSpeed = 0.55;
    controls.minDistance = 150;
    controls.maxDistance = 820;
    let armed = false;
    window.setTimeout(() => {
      armed = true;
    }, 700);
    controls.addEventListener('start', () => {
      if (armed) onOrbitRef.current(false);
    });
    instance.renderer()?.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    instance.pointOfView(HOME, 0);
    setReady(true);
    onReadyRef.current();
  }

  const GlobeView = GlobeComp;

  return (
    <div className="globe-holder" ref={holder}>
      {GlobeView && (
        <GlobeView
          ref={api as never}
          width={size.w}
          height={size.h}
          backgroundColor="#04050c"
          backgroundImageUrl={asset('textures/night-sky.png')}
          globeImageUrl={asset('textures/earth-night.jpg')}
          bumpImageUrl={asset('textures/earth-topology.png')}
          showAtmosphere
          atmosphereColor="#79d7ff"
          atmosphereAltitude={0.18}
          rendererConfig={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          polygonsData={land}
          polygonGeoJsonGeometry={(feature) => (feature as LandFeature).geometry as never}
          polygonAltitude={(feature) => {
            const item = feature as LandFeature;
            const value = item.properties.iso ? (byCode.get(item.properties.iso)?.value ?? 0) : 0;
            return extrusion(value, max, toneOf(item.properties.iso) === 'hot');
          }}
          polygonCapColor={(feature) => {
            const item = feature as LandFeature;
            const value = item.properties.iso ? (byCode.get(item.properties.iso)?.value ?? 0) : 0;
            return capColor(value, max, toneOf(item.properties.iso));
          }}
          polygonSideColor={(feature) => sideColor(toneOf((feature as LandFeature).properties.iso))}
          polygonStrokeColor={(feature) => strokeColor(toneOf((feature as LandFeature).properties.iso))}
          polygonCapCurvatureResolution={4}
          polygonsTransitionDuration={reduced ? 0 : 800}
          polygonLabel={(feature) => {
            const item = feature as LandFeature;
            const row = item.properties.iso ? byCode.get(item.properties.iso) : undefined;
            if (!row) return '';
            return tip(row.name, row.value);
          }}
          onPolygonHover={(feature) => {
            const iso = feature ? (feature as LandFeature).properties.iso : null;
            onHover(iso);
          }}
          onPolygonClick={(feature) => {
            const iso = (feature as LandFeature).properties.iso;
            if (iso && byCode.has(iso)) pick(iso);
          }}
          onGlobeClick={() => {
            if (performance.now() - lastPick.current < 140) return;
            onSelect(null);
          }}
          pointsData={beacons}
          pointLat={(point) => (point as Marker).lat}
          pointLng={(point) => (point as Marker).lng}
          pointAltitude={(point) => extrusion((point as Marker).value, max, (point as Marker).code === selected) + 0.02}
          pointRadius={(point) => ((point as Marker).code === selected || (point as Marker).code === hover ? 0.62 : 0.42)}
          pointColor={(point) => {
            const marker = point as Marker;
            return marker.code === selected || marker.code === hover ? '#ffffff' : '#7af0ff';
          }}
          pointResolution={10}
          pointsTransitionDuration={reduced ? 0 : 600}
          pointLabel={(point) => tip((point as Marker).name, (point as Marker).value)}
          onPointClick={(point) => pick((point as Marker).code)}
          onPointHover={(point) => onHover(point ? (point as Marker).code : null)}
          ringsData={rings}
          ringLat={(point) => (point as Marker).lat}
          ringLng={(point) => (point as Marker).lng}
          ringAltitude={(point) => extrusion((point as Marker).value, max, false) + 0.012}
          ringColor={() => (t: number) => `rgba(0, 210, 255, ${0.55 * (1 - t)})`}
          ringMaxRadius={4.2}
          ringPropagationSpeed={1.35}
          ringRepeatPeriod={1500}
          htmlElementsData={markers}
          htmlLat={(point) => (point as Marker).lat}
          htmlLng={(point) => (point as Marker).lng}
          htmlAltitude={(point) => extrusion((point as Marker).value, max, (point as Marker).code === selected) + 0.03}
          htmlElement={(point) => {
            const marker = point as Marker;
            const el = document.createElement('div');
            el.className = 'globe-label';
            el.innerHTML = `<em>${escapeHtml(marker.code)}</em><strong>${escapeHtml(marker.name)}</strong>`;
            return el;
          }}
          onGlobeReady={() => {
            let tries = 0;
            const start = () => {
              if (api.current) {
                boot(api.current);
                return;
              }
              if (tries < 12) {
                tries += 1;
                requestAnimationFrame(start);
              } else onFailRef.current();
            };
            start();
          }}
        />
      )}
    </div>
  );
}
