import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import type { GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';
import type { CountryRow } from '../lib/analytics';
import { asset } from '../lib/asset';
import { capColor, extrusion, sideColor, strokeColor, type LandTone } from '../lib/color';
import { flagUrl } from '../lib/flags';
import { escapeHtml, formatFull } from '../lib/format';
import type { LandFeature, PlacePoint } from '../lib/land';
import type { RegionId } from '../lib/regions';
import { degreesPast, sweepNodes, type SweepNode } from '../lib/signals';

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
  mode: 'earth' | 'engine';
  onLocks: (locks: { code: string; name: string }[]) => void;
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
  mode,
  onLocks,
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
  const onLocksRef = useRef(onLocks);
  const modeRef = useRef(mode);
  const sweepRef = useRef(0);
  const lastPick = useRef(0);
  const [sweep, setSweep] = useState(0);
  const [GlobeComp, setGlobeComp] = useState<typeof import('react-globe.gl').default | null>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const [ready, setReady] = useState(false);

  orbitRef.current = orbit;
  onOrbitRef.current = onOrbit;
  onReadyRef.current = onReady;
  onFailRef.current = onFail;
  onLocksRef.current = onLocks;
  modeRef.current = mode;

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

  useEffect(() => {
    if (!ready || !api.current) return;
    const controls = api.current.controls();
    if (mode === 'engine') {
      controls.autoRotate = false;
      api.current.pointOfView({ lat: 8, lng: 18, altitude: 2.22 }, reduced ? 0 : 900);
      return;
    }
    controls.autoRotate = orbit && !reduced;
    api.current.pointOfView(HOME, reduced ? 0 : 900);
  }, [mode, ready, reduced, orbit]);

  useEffect(() => {
    const globe = api.current;
    if (!ready || !globe || mode !== 'engine' || reduced) return;
    const scene = globe.scene();
    const group = new THREE.Group();
    const skin = new THREE.MeshBasicMaterial({
      color: 0x3dffc8,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const edge = new THREE.MeshBasicMaterial({
      color: 0xd8fff4,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const wedge = new THREE.Mesh(new THREE.SphereGeometry(101.2, 48, 32, 0, 0.58, 0.18, Math.PI - 0.36), skin);
    const blade = new THREE.Mesh(new THREE.SphereGeometry(101.6, 24, 32, 0.52, 0.045, 0.12, Math.PI - 0.24), edge);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(112, 112.7, 160),
      new THREE.MeshBasicMaterial({
        color: 0x7dffe8,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    group.add(wedge, blade, ring);
    scene.add(group);

    let frame = 0;
    let lastPublish = 0;
    const tick = (now: number) => {
      group.rotation.y += 0.0065;
      const degrees = ((group.rotation.y * 180) / Math.PI) % 360;
      const lng = (90 - degrees + 360) % 360;
      sweepRef.current = lng;
      if (now - lastPublish > 70) {
        lastPublish = now;
        setSweep(lng);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      scene.remove(group);
      wedge.geometry.dispose();
      blade.geometry.dispose();
      ring.geometry.dispose();
      skin.dispose();
      edge.dispose();
      (ring.material as THREE.Material).dispose();
    };
  }, [mode, ready, reduced]);

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

  const field = useMemo(() => (mode === 'engine' ? sweepNodes(rows, places) : []), [mode, rows, places]);

  const discovered = useMemo(() => {
    if (mode !== 'engine') return [];
    return field
      .filter((node) => node.kind === 'signal' && degreesPast(node.lng, sweep) < 130)
      .sort((a, b) => degreesPast(a.lng, sweep) - degreesPast(b.lng, sweep));
  }, [mode, field, sweep]);

  useEffect(() => {
    if (mode !== 'engine') return;
    const next = discovered.slice(0, 3).map((node) => ({ code: node.code, name: node.name }));
    onLocksRef.current(next);
  }, [mode, discovered]);

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
            if (mode === 'engine') return 0.002;
            const item = feature as LandFeature;
            const value = item.properties.iso ? (byCode.get(item.properties.iso)?.value ?? 0) : 0;
            return extrusion(value, max, toneOf(item.properties.iso) === 'hot');
          }}
          polygonCapColor={(feature) => {
            if (mode === 'engine') return 'rgba(6, 12, 22, 0.18)';
            const item = feature as LandFeature;
            const value = item.properties.iso ? (byCode.get(item.properties.iso)?.value ?? 0) : 0;
            return capColor(value, max, toneOf(item.properties.iso));
          }}
          polygonSideColor={(feature) =>
            mode === 'engine' ? 'rgba(0,0,0,0)' : sideColor(toneOf((feature as LandFeature).properties.iso))
          }
          polygonStrokeColor={(feature) =>
            mode === 'engine' ? 'rgba(121, 215, 255, 0.14)' : strokeColor(toneOf((feature as LandFeature).properties.iso))
          }
          polygonCapCurvatureResolution={4}
          polygonsTransitionDuration={reduced ? 0 : 800}
          polygonLabel={(feature) => {
            if (mode === 'engine') return '';
            const item = feature as LandFeature;
            const row = item.properties.iso ? byCode.get(item.properties.iso) : undefined;
            if (!row) return '';
            return tip(row.name, row.value);
          }}
          onPolygonHover={(feature) => {
            if (mode === 'engine') return;
            const iso = feature ? (feature as LandFeature).properties.iso : null;
            onHover(iso);
          }}
          onPolygonClick={(feature) => {
            if (mode === 'engine') return;
            const iso = (feature as LandFeature).properties.iso;
            if (iso && byCode.has(iso)) pick(iso);
          }}
          onGlobeClick={() => {
            if (performance.now() - lastPick.current < 140) return;
            onSelect(null);
          }}
          pointsData={mode === 'engine' ? field : beacons}
          pointLat={(point) => (point as Marker).lat}
          pointLng={(point) => (point as Marker).lng}
          pointAltitude={(point) =>
            mode === 'engine'
              ? 0.012
              : extrusion((point as Marker).value, max, (point as Marker).code === selected) + 0.02
          }
          pointRadius={(point) => {
            if (mode !== 'engine') {
              return (point as Marker).code === selected || (point as Marker).code === hover ? 0.62 : 0.42;
            }
            const node = point as SweepNode;
            if (node.kind === 'noise') return degreesPast(node.lng, sweep) < 14 ? 0.34 : 0.16;
            const past = degreesPast(node.lng, sweep);
            if (past < 14) return 0.78;
            if (past < 130) return 0.5;
            return 0.2;
          }}
          pointColor={(point) => {
            if (mode !== 'engine') {
              const marker = point as Marker;
              return marker.code === selected || marker.code === hover ? '#ffffff' : '#7af0ff';
            }
            const node = point as SweepNode;
            const past = reduced ? 20 : degreesPast(node.lng, sweep);
            if (node.kind === 'noise') return past < 14 ? 'rgba(255, 90, 110, 0.9)' : 'rgba(255, 64, 96, 0.28)';
            if (past < 14) return '#f4fff9';
            if (past < 130) return '#3dffc0';
            return 'rgba(61, 255, 192, 0.14)';
          }}
          pointResolution={10}
          pointsTransitionDuration={0}
          pointLabel={(point) =>
            mode === 'engine' ? '' : tip((point as Marker).name, (point as Marker).value)
          }
          onPointClick={(point) => {
            if (mode === 'engine') return;
            pick((point as Marker).code);
          }}
          onPointHover={(point) => {
            if (mode === 'engine') return;
            onHover(point ? (point as Marker).code : null);
          }}
          ringsData={mode === 'engine' ? discovered : rings}
          ringLat={(point) => (point as Marker).lat}
          ringLng={(point) => (point as Marker).lng}
          ringAltitude={(point) =>
            mode === 'engine' ? 0.014 : extrusion((point as Marker).value, max, false) + 0.012
          }
          ringColor={() => (t: number) =>
            mode === 'engine' ? `rgba(61, 255, 192, ${0.7 * (1 - t)})` : `rgba(0, 210, 255, ${0.55 * (1 - t)})`
          }
          ringMaxRadius={mode === 'engine' ? 3.2 : 4.2}
          ringPropagationSpeed={mode === 'engine' ? 2 : 1.35}
          ringRepeatPeriod={mode === 'engine' ? 1100 : 1500}
          htmlElementsData={mode === 'engine' ? discovered.slice(0, 1) : markers}
          htmlLat={(point) => (point as Marker).lat}
          htmlLng={(point) => (point as Marker).lng}
          htmlAltitude={(point) =>
            mode === 'engine'
              ? 0.04
              : extrusion((point as Marker).value, max, (point as Marker).code === selected) + 0.03
          }
          htmlElement={(point) => {
            const el = document.createElement('div');
            if (mode === 'engine') {
              const node = point as SweepNode;
              el.className = 'radar-lock';
              el.innerHTML = `<em>NEEDS UPDATE</em><strong>${escapeHtml(node.name)}</strong>`;
              return el;
            }
            const marker = point as Marker;
            el.className = 'globe-label';
            const src = flagUrl(marker.code);
            const flag = src ? `<img src="${src}" alt="" />` : '';
            el.innerHTML = `${flag}<strong>${escapeHtml(marker.name)}</strong>`;
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
