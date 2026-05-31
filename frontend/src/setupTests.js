// frontend/src/setupTests.js
import '@testing-library/jest-dom';
 
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer:    () => null,
  Marker:       ({ children }) => <div>{children}</div>,
  Polyline:     () => null,
  Popup:        ({ children }) => <div>{children}</div>,
  useMap:       () => ({}),
  useMapEvents: () => ({}),
}));

jest.mock('leaflet', () => ({
  icon:    () => ({}),
  divIcon: () => ({}),
  latLng:  () => ({}),
}));