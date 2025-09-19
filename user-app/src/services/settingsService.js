import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from './firebase'

class SettingsService {
  constructor() {
    this.pricePerKwh = 3500 // Default price in VND
    this.listeners = new Map()
  }

  // Lấy giá điện hiện tại
  async getPricePerKwh() {
    try {
      const priceDoc = await getDoc(doc(db, 'setting', 'pricePerKwh'))
      if (priceDoc.exists()) {
        const data = priceDoc.data()
        this.pricePerKwh = data.value || 3500
        return this.pricePerKwh
      }
      return this.pricePerKwh
    } catch (error) {
      console.error('Error getting price per kWh:', error)
      return this.pricePerKwh
    }
  }

  // Lắng nghe thay đổi giá điện real-time
  listenToPriceChanges(callback) {
    const priceDocRef = doc(db, 'setting', 'pricePerKwh')
    
    const unsubscribe = onSnapshot(priceDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const newPrice = data.value || 3500
        this.pricePerKwh = newPrice
        if (callback) callback(newPrice)
      }
    }, (error) => {
      console.error('Error listening to price changes:', error)
    })

    return unsubscribe
  }

  // Lấy cấu hình chung
  async getConfiguration(key) {
    try {
      const configDoc = await getDoc(doc(db, 'setting', key))
      if (configDoc.exists()) {
        return configDoc.data().value
      }
      return null
    } catch (error) {
      console.error(`Error getting configuration ${key}:`, error)
      return null
    }
  }

  // Lắng nghe thay đổi cấu hình
  listenToConfiguration(key, callback) {
    const configDocRef = doc(db, 'setting', key)
    
    const unsubscribe = onSnapshot(configDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        if (callback) callback(data.value)
      }
    }, (error) => {
      console.error(`Error listening to configuration ${key}:`, error)
    })

    return unsubscribe
  }

  // Dọn dẹp listeners
  cleanup() {
    for (const [key, unsubscribe] of this.listeners) {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
    this.listeners.clear()
  }
}

export const settingsService = new SettingsService()
export default settingsService
