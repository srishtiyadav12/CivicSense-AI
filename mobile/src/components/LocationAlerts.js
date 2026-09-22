import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';

export const LocationAlerts = ({ onNearbyComplaints }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const locationWatcherRef = useRef(null);

  useEffect(() => {
    startLocationTracking();
    return () => {
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
      }
    };
  }, []);

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission denied');
      return;
    }

    locationWatcherRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 15000,
        distanceInterval: 50,
      },
      async (newLocation) => {
        setLocation(newLocation);
        await checkNearbyComplaints(newLocation);
      }
    );
  };

  const checkNearbyComplaints = async (loc) => {
    try {
      const response = await fetch(
  `http://10.252.196.169:5000/api/nearby?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}&radius=500`,
        {
          headers: {
            'Authorization': `Bearer ${user?.token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.complaints.length > 0) {
          onNearbyComplaints(data.complaints);
        }
      }
    } catch (error) {
      console.error('Error checking nearby complaints:', error);
    }
  };

  return null;
};