import { BusLocation } from '../types/bus';
import { busRoutes } from './routes';

// API endpoint for Huntsville bus locations
export const fetchBusLocation = async (routeId: number): Promise<BusLocation[]> => {
  try {
    // For the Meridian/A&M route specifically
    if (routeId === 0) {
      try {
        // Use the real API for Huntsville bus data
        const baseUrl = "https://huntsville.routematch.io/routeshout/api/v2.0/rs.vehicle.getListByRoutes";
        
        // Create URLSearchParams to handle the query parameters
        const params = new URLSearchParams({
          key: "RouteShoutAPIAdapterv2.0",
          agency: "1",
          routes: "Meridian/A&M",
          title: "{@masterRouteShortName} - Vehicle {@internalVehicleId}",
          body: "Heading {@tripDirection} on {@masterRouteLongName} at {@speed}mph",
          timeHorizon: "60",
          timeSensitive: "false",
        });
        
        // Add the templates[] parameter (special handling for array params)
        params.append("templates[]", "title");
        params.append("templates[]", "body");
        
        // Build the URL with parameters
        const url = `${baseUrl}?${params.toString()}`;
        
        // Set up headers (simplified for React Native compatibility)
        const headers = {
          "User-Agent": "Mozilla/5.0 (Linux; Android 12; sdk_gphone64_arm64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.81 Mobile Safari/537.36",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Referer": "https://huntsville.routematch.io/routeshout/stop/Alabama+A+%26+M+College?mRouteId=Meridian/A&M",
          "Accept-Language": "en-US,en;q=0.9",
        };
        
        // Make the fetch request
        console.log('Making request to:', url);
        const response = await fetch(url, { headers });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('HTTP error response:', errorText);
          throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText.substring(0, 200)}`);
        }
        
        // Get the response as text first to debug
        const responseText = await response.text();
        console.log('Raw response text (first 200 chars):', responseText.substring(0, 200));
        
        // Check if response starts with HTML
        if (responseText.trim().startsWith('<')) {
          console.error('Received HTML instead of JSON:', responseText.substring(0, 500));
          throw new Error('API returned HTML instead of JSON - possible CORS or redirect issue');
        }
        
        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Response that failed to parse:', responseText.substring(0, 500));
          throw new Error(`Failed to parse JSON response: ${parseError.message}`);
        }
        
        // Check if we have a valid response with bus data
        if (data && data.meta && data.response && Array.isArray(data.response)) {
          console.log('API Response:', JSON.stringify(data));
          
          // Process the data into our format
          const buses: BusLocation[] = data.response.map((item: any) => {
            // Parse the update time from the API
            const updateTime = item.uT ? new Date(item.uT) : new Date();
            
            return {
              id: item.vId || `meridian-${Math.random().toString(36).substring(2, 9)}`,
              latitude: item.la || 0,
              longitude: item.lo || 0,
              heading: item.h || 0, // Heading in degrees
              headingName: item.hN || 'Unknown', // Heading name (NORTH, SOUTH, etc.)
              speed: item.s || 0, // Speed
              routeId: 0,
              routeName: item.mLn || 'Meridian/A&M',
              routeShortName: item.mSn || '7',
              nextStop: item.mD || findNearestStop(item.la, item.lo),
              timestamp: updateTime.getTime(),
              rawData: item, // Store the raw data for debugging
            };
          });
          
          if (buses.length > 0) {
            return buses;
          } else {
            console.warn('No buses found in API response');
            return simulateSingleBus();
          }
        } else {
          console.warn('Invalid API response format, falling back to simulated data');
          return simulateSingleBus();
        }
      } catch (error) {
        console.error('Error fetching real bus data:', error);
        
        // Try a simpler request as fallback
        try {
          console.log('Attempting fallback request with minimal headers...');
          const fallbackBaseUrl = "https://huntsville.routematch.io/routeshout/api/v2.0/rs.vehicle.getListByRoutes";
          const fallbackUrl = `${fallbackBaseUrl}?key=RouteShoutAPIAdapterv2.0&agency=1&routes=Meridian/A%26M&timeHorizon=60&timeSensitive=false`;
          const fallbackResponse = await fetch(fallbackUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          });
          
          console.log('Fallback response status:', fallbackResponse.status);
          
          if (fallbackResponse.ok) {
            const fallbackText = await fallbackResponse.text();
            console.log('Fallback response (first 200 chars):', fallbackText.substring(0, 200));
            
            if (!fallbackText.trim().startsWith('<')) {
              const fallbackData = JSON.parse(fallbackText);
              if (fallbackData && fallbackData.response && Array.isArray(fallbackData.response)) {
                console.log('Fallback API succeeded!');
                
                // Process the fallback data the same way
                const buses: BusLocation[] = fallbackData.response.map((item: any) => {
                  const updateTime = item.uT ? new Date(item.uT) : new Date();
                  
                  return {
                    id: item.vId || `meridian-${Math.random().toString(36).substring(2, 9)}`,
                    latitude: item.la || 0,
                    longitude: item.lo || 0,
                    heading: item.h || 0,
                    headingName: item.hN || 'Unknown',
                    speed: item.s || 0,
                    routeId: 0,
                    routeName: item.mLn || 'Meridian/A&M',
                    routeShortName: item.mSn || '7',
                    nextStop: item.mD || findNearestStop(item.la, item.lo),
                    timestamp: updateTime.getTime(),
                    rawData: item,
                  };
                });
                
                return buses;
              }
            }
          }
        } catch (fallbackError) {
          console.error('Fallback request also failed:', fallbackError);
        }
        
        // Fall back to simulated data if all API attempts fail
        console.log('All API attempts failed, using simulated data');
        return simulateSingleBus();
      }
    }
    
    // Fallback to simulated data for other routes
    return simulateSingleBus();
  } catch (error) {
    console.error('Error in fetchBusLocation:', error);
    return simulateSingleBus();
  }
};

// Find the nearest bus stop to the given coordinates
const findNearestStop = (latitude: number, longitude: number): string => {
  if (!latitude || !longitude) {
    return 'Unknown location';
  }
  
  const route = busRoutes[0];
  let nearestStop = route.stops[0];
  let minDistance = Number.MAX_VALUE;
  
  for (const stop of route.stops) {
    const distance = Math.sqrt(
      Math.pow(latitude - stop.latitude, 2) + 
      Math.pow(longitude - stop.longitude, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestStop = stop;
    }
  }
  
  return nearestStop.name;
};

// Simulated API for a single bus
const simulateSingleBus = (): BusLocation[] => {
  const route = busRoutes[0];
  
  // Get a random position along the route path
  const pathIndex = Math.floor(Math.random() * (route.path.length - 1));
  const point = route.path[pathIndex];
  
  // Create a single bus
  const bus: BusLocation = {
    id: "meridian-single",
    latitude: point.latitude,
    longitude: point.longitude,
    heading: Math.random() * 360,
    headingName: 'NORTH',
    speed: 15 + Math.random() * 10,
    routeId: 0,
    routeName: 'Meridian/A&M',
    routeShortName: '7',
    nextStop: findNearestStop(point.latitude, point.longitude),
    timestamp: Date.now(),
    rawData: null,
  };
  
  return [bus];
};
