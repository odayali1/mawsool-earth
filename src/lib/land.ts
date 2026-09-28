export type LandFeature = {
  type: 'Feature';
  properties: {
    iso: string | null;
    lat: number;
    lng: number;
  };
  geometry: {
    type: string;
    coordinates: unknown;
  };
};

export type LandCollection = {
  type: 'FeatureCollection';
  features: LandFeature[];
};

export type PlacePoint = {
  lat: number;
  lng: number;
  polygon: boolean;
};
