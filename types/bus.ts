// Bus route types
export interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface BusRoute {
  id: number;
  name: string;
  path: {
    latitude: number;
    longitude: number;
  }[];
  stops: BusStop[];
}

// Bus location types
export interface BusLocation {
  id: string;
  latitude: number;
  longitude: number;
  heading: number;
  headingName: string;
  speed: number;
  routeId: number;
  routeName: string;
  routeShortName: string;
  nextStop: string;
  timestamp: number;
  rawData: any;
}
