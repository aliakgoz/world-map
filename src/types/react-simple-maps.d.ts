// src/react-simple-maps.d.ts
declare module "react-simple-maps" {
  import * as React from "react";

  export const ComposableMap: React.FC<any>;
  export const Geographies: React.FC<any>;
  export const Geography: React.FC<any>;
  export const ZoomableGroup: React.FC<any>;

  // ---- Marker tipi ----
  export interface MarkerProps {
    coordinates: [number, number];
    children?: React.ReactNode;
    style?: any; // istersen sonradan sıkılaştırırız
  }

  export const Marker: React.FC<MarkerProps>;
}
