import { useEffect, useMemo, useRef, useState } from 'react';
import { CommandDeck } from './components/CommandDeck';
import { EarthGlobe, type EarthGlobeHandle } from './components/EarthGlobe';
import { StoryPanel } from './components/StoryPanel';
import { TopBar } from './components/TopBar';
import { analyze } from './lib/analytics';
import { asset } from './lib/asset';
import extraPlaces from './lib/extra-places.json';
import type { LandCollection, LandFeature, PlacePoint } from './lib/land';
import type { RegionId } from './lib/regions';
import { phases } from './phases/registry';

export function App() {
  const [phaseId, setPhaseId] = useState(phases[0]?.id ?? '');
  const phase = phases.find((item) => item.id === phaseId) ?? phases[0];
  const stats = useMemo(() => (phase ? analyze(phase) : null), [phase]);
  const [land, setLand] = useState<LandFeature[] | null>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [bootMounted, setBootMounted] = useState(true);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<RegionId | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [orbit, setOrbit] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const globeRef = useRef<EarthGlobeHandle>(null);

  const places = useMemo(() => {
    const map = new Map<string, PlacePoint>();
    for (const [code, pair] of Object.entries(extraPlaces)) {
      map.set(code, { lat: pair[0], lng: pair[1], polygon: false });
    }
    for (const feature of land ?? []) {
      const iso = feature.properties.iso;
      if (!iso) continue;
      map.set(iso, { lat: feature.properties.lat, lng: feature.properties.lng, polygon: true });
    }
    return map;
  }, [land]);

  useEffect(() => {
    let alive = true;
    fetch(asset('geo/land.json'))
      .then((response) => {
        if (!response.ok) throw new Error('map');
        return response.json() as Promise<LandCollection>;
      })
      .then((data) => {
        if (alive) setLand(data.features);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!phase) return;
    document.title = `Mawsool Earth — ${phase.title}`;
  }, [phase]);

  useEffect(() => {
    if (globeReady || failed) return;
    const timer = window.setTimeout(() => setFailed(true), 20000);
    return () => window.clearTimeout(timer);
  }, [globeReady, failed]);

  const booted = (globeReady && land !== null) || failed;

  useEffect(() => {
    if (!booted) return;
    const timer = window.setTimeout(() => setBootMounted(false), 760);
    return () => window.clearTimeout(timer);
  }, [booted]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        if (query) setQuery('');
        else (target as HTMLInputElement).blur();
        return;
      }
      if (selected) setSelected(null);
      else if (region) setRegion(null);
      else if (query) setQuery('');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [query, region, selected]);

  function choosePhase(id: string) {
    setPhaseId(id);
    setSelected(null);
    setHover(null);
    setQuery('');
    setRegion(null);
  }

  function select(code: string | null) {
    setSelected(code);
    if (!code || !stats) return;
    setOrbit(false);
    if (code === 'unknown') return;
    const row = stats.locations.find((item) => item.code === code);
    if (row && region && row.region !== region) setRegion(null);
    const place = places.get(code);
    if (place) globeRef.current?.focus(place.lat, place.lng);
  }

  function hoverTo(code: string | null) {
    setHover((current) => (current === code ? current : code));
  }

  if (!phase || !stats) {
    return <p className="fatal">No analytics phase is loaded yet.</p>;
  }

  return (
    <div className="app">
      <div className="globe-layer">
        {land && (
          <EarthGlobe
            land={land}
            places={places}
            rows={stats.locations}
            max={stats.leader.value}
            noun={phase.noun}
            hover={hover}
            selected={selected}
            region={region}
            orbit={orbit}
            globeRef={globeRef}
            onHover={hoverTo}
            onSelect={select}
            onOrbit={setOrbit}
            onReady={() => setGlobeReady(true)}
            onFail={() => setFailed(true)}
          />
        )}
        {failed && !globeReady && (
          <p className="globe-fallback">The planet view needs WebGL. The country figures are still here.</p>
        )}
      </div>
      <div className="vignette" />
      <div className="hud">
        <TopBar
          phases={phases}
          phase={phase}
          total={stats.total}
          orbit={orbit}
          onPhase={choosePhase}
          onOrbit={setOrbit}
        />
        <div className="columns">
          <CommandDeck
            phase={phase}
            stats={stats}
            query={query}
            region={region}
            hover={hover}
            selected={selected}
            onQuery={setQuery}
            onRegion={setRegion}
            onHover={hoverTo}
            onSelect={select}
          />
          <StoryPanel
            phase={phase}
            stats={stats}
            selected={selected}
            region={region}
            places={places}
            onSelect={select}
            onRegion={setRegion}
          />
        </div>
      </div>
      {bootMounted && (
        <div className={booted ? 'boot is-done' : 'boot'} role="status">
          <img src={asset('brand/logo-on-dark.svg')} alt="Mawsool" />
          <p className="eyebrow">Earth Analytics</p>
          <h2>{phase.title}</h2>
          {failed && !globeReady ? (
            <p className="boot-note">Showing the records without the globe.</p>
          ) : (
            <div className="boot-bar" aria-hidden="true">
              <i />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
