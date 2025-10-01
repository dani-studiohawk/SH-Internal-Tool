import CryptoJS from 'crypto-js'

// Use a fixed key for client-side encryption (not perfect but better than plain text)
// In production, this could be derived from session data
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'SH_Internal_Tool_2024_Secure_Key_For_Client_Data'

/**
 * Securely store data in sessionStorage with encryption
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 */
export function secureStore(key, data) {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      ENCRYPTION_KEY
    ).toString()
    sessionStorage.setItem(key, encrypted)
  } catch (error) {
    console.error('Failed to securely store data:', error)
    // Fallback to memory storage for critical errors
    if (typeof window !== 'undefined') {
      window.__secureStorage = window.__secureStorage || {}
      window.__secureStorage[key] = data
    }
  }
}

/**
 * Securely retrieve data from sessionStorage with decryption
 * @param {string} key - Storage key
 * @returns {any} Decrypted data or null
 */
export function secureRetrieve(key) {
  try {
    const encrypted = sessionStorage.getItem(key)
    if (!encrypted) {
      // Check memory fallback
      if (typeof window !== 'undefined' && window.__secureStorage) {
        return window.__secureStorage[key] || null
      }
      return null
    }
    
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY)
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
  } catch (error) {
    console.error('Failed to securely retrieve data:', error)
    // Clear corrupted data
    sessionStorage.removeItem(key)
    return null
  }
}

/**
 * Remove securely stored data
 * @param {string} key - Storage key
 */
export function secureRemove(key) {
  try {
    sessionStorage.removeItem(key)
    if (typeof window !== 'undefined' && window.__secureStorage) {
      delete window.__secureStorage[key]
    }
  } catch (error) {
    console.error('Failed to remove secure data:', error)
  }
}

/**
 * Clear all secure storage (use on logout)
 */
export function secureClearAll() {
  try {
    // Clear all sessionStorage
    sessionStorage.clear()
    
    // Clear memory fallback
    if (typeof window !== 'undefined') {
      delete window.__secureStorage
    }
    
    // Clear any remaining localStorage items that might contain sensitive data
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.includes('client') || 
          key.includes('trend') || 
          key.includes('story') || 
          key.includes('idea') ||
          key.includes('saved')
        )) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  } catch (error) {
    console.error('Failed to clear secure storage:', error)
  }
}

/**
 * Migrate data from localStorage to secure sessionStorage
 * @param {string} key - Storage key
 */
export function migrateFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key)
    if (data) {
      const parsedData = JSON.parse(data)
      secureStore(key, parsedData)
      localStorage.removeItem(key)
      return parsedData
    }
  } catch (error) {
    console.error('Failed to migrate from localStorage:', error)
  }
  return null
}

/**
 * Check if browser supports secure storage
 */
export function isSecureStorageAvailable() {
  try {
    return typeof window !== 'undefined' && window.sessionStorage
  } catch {
    return false
  }
}