import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';

class RealtimeService {
  constructor() {
    this.listeners = new Map();
  }

  // Subscribe to real-time station updates
  subscribeToStations(callback) {
    const stationsRef = collection(db, 'stations');
    const q = query(stationsRef, orderBy('lastUpdated', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(stations);
    }, (error) => {
      console.error('Error listening to stations:', error);
    });

    this.listeners.set('stations', unsubscribe);
    return unsubscribe;
  }

  // Subscribe to specific station updates
  subscribeToStation(stationId, callback) {
    const stationRef = collection(db, 'stations');
    const q = query(stationRef, where('stationId', '==', stationId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const station = snapshot.docs.length > 0 ? {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } : null;
      callback(station);
    }, (error) => {
      console.error(`Error listening to station ${stationId}:`, error);
    });

    this.listeners.set(`station-${stationId}`, unsubscribe);
    return unsubscribe;
  }

  // Subscribe to user's charging sessions
  subscribeToUserSessions(userId, callback) {
    const sessionsRef = collection(db, 'chargingSessions');
    const q = query(
      sessionsRef, 
      where('userId', '==', userId),
      orderBy('startTime', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(sessions);
    }, (error) => {
      console.error('Error listening to user sessions:', error);
    });

    this.listeners.set(`user-sessions-${userId}`, unsubscribe);
    return unsubscribe;
  }

  // Subscribe to active charging session
  subscribeToActiveSession(userId, callback) {
    const sessionsRef = collection(db, 'chargingSessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('startTime', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Return the most recent active session
      callback(activeSessions.length > 0 ? activeSessions[0] : null);
    }, (error) => {
      console.error('Error listening to active session:', error);
    });

    this.listeners.set(`active-session-${userId}`, unsubscribe);
    return unsubscribe;
  }

  // Unsubscribe from specific listener
  unsubscribe(key) {
    const unsubscribeFunc = this.listeners.get(key);
    if (unsubscribeFunc) {
      unsubscribeFunc();
      this.listeners.delete(key);
    }
  }

  // Unsubscribe from all listeners
  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }
}

export default new RealtimeService();
