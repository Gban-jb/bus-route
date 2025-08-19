import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { busRoutes } from '../data/routes';
import { fetchBusLocation } from '../data/busService';
import { BusLocation, BusRoute } from '../types/bus';

export default function MapScreen() {
  // System font configuration
  const systemFont = Platform.select({ 
    ios: 'System', 
    android: 'Roboto' 
  });
  
  const [selectedRoute, setSelectedRoute] = useState<BusRoute>(busRoutes[0]);
  const [busLocations, setBusLocations] = useState<BusLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
    })();
  }, []);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;
    
    const loadBusLocations = async () => {
      try {
        setLoading(true);
        const locations = await fetchBusLocation(selectedRoute.id);
        
        if (isMounted) {
          setBusLocations(locations);
          
          // Center map on first bus if available
          if (locations.length > 0 && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: locations[0].latitude,
              longitude: locations[0].longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching bus locations:', err);
          setError('Unable to fetch bus locations');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Load immediately
    loadBusLocations();
    
    // Then refresh every 15 seconds
    intervalId = setInterval(loadBusLocations, 15000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [selectedRoute]);
  
  const handleRouteChange = (route: BusRoute) => {
    setSelectedRoute(route);
  };
  
  const handleBack = () => {
    router.back();
  };

  // Get all markers for the map
  const getAllMarkers = () => {
    const markers = [];
    
    // Add stop markers
    selectedRoute.stops.forEach((stop, index) => {
      markers.push(
        <Marker
          key={`stop-${stop.id}`}
          coordinate={{
            latitude: stop.latitude,
            longitude: stop.longitude,
          }}
          title={stop.name}
          pinColor="#1C2E52"
        />
      );
    });

    // Add bus markers
    busLocations.forEach((bus, index) => {
      markers.push(
        <Marker
          key={`bus-${bus.id || index}`}
          coordinate={{
            latitude: bus.latitude,
            longitude: bus.longitude,
          }}
          title={`${bus.routeShortName} - ${bus.routeName}`}
          description={`Next stop: ${bus.nextStop} - Speed: ${Math.round(bus.speed)} mph`}
          pinColor="#F7A82F"
        />
      );
    });

    return markers;
  };
  
  // Render the map
  const renderMap = () => {
    const initialRegion = {
      latitude: selectedRoute.stops[0].latitude,
      longitude: selectedRoute.stops[0].longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

    return (
      <MapView 
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        showsTraffic={true}
        onPress={(event) => console.log('Map pressed:', event.nativeEvent.coordinate)}
        onMapReady={() => console.log('Map ready')}
      >
        {getAllMarkers()}
      </MapView>
    );
  };
  
  return (
    <SafeAreaView 
      style={[styles.container, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]} 
      edges={['left', 'right']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft color="#0092D2" size={28} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: systemFont }]}>Live Bus Tracker</Text>
        <View style={{ width: 28 }} />
      </View>
      
      {/* Route Selector */}
      <View style={styles.routeSelector}>
        <ScrollableRoutes 
          routes={busRoutes} 
          selectedRoute={selectedRoute} 
          onSelectRoute={handleRouteChange} 
        />
      </View>
      
      {/* Map View */}
      <View style={styles.mapContainer}>
        {renderMap()}
        
        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0092D2" />
          </View>
        )}
        
        {/* Error Message */}
        {error !== '' && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { fontFamily: systemFont }]}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// Scrollable Routes Component
function ScrollableRoutes({ 
  routes, 
  selectedRoute, 
  onSelectRoute 
}: { 
  routes: BusRoute[], 
  selectedRoute: BusRoute, 
  onSelectRoute: (route: BusRoute) => void 
}) {
  // System font configuration
  const systemFont = Platform.select({ 
    ios: 'System', 
    android: 'Roboto' 
  });
  return (
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.routeScrollContainer}
    >
      {routes.map(route => (
        <TouchableOpacity
          key={route.id}
          style={[
            styles.routeButton,
            selectedRoute.id === route.id && styles.selectedRouteButton
          ]}
          onPress={() => onSelectRoute(route)}
        >
          <Text 
            style={[
              styles.routeButtonText,
              selectedRoute.id === route.id && styles.selectedRouteButtonText,
              { fontFamily: systemFont }
            ]}
          >
            {route.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 4,
  },
  routeSelector: {
    marginBottom: 10,
  },
  routeScrollContainer: {
    paddingHorizontal: 12,
  },
  routeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedRouteButton: {
    backgroundColor: '#0092D2',
    borderColor: '#0092D2',
  },
  routeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedRouteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
    margin: 12,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
