import { useEffect } from 'react'

/**
 * Holder skjermen våken så lenge nettbrettet står i strøm — for kiosk-bruk i
 * klubbhuset. Bruker Screen Wake Lock API mens appen er synlig.
 *
 * Hvis Battery Status API finnes (Chrome på Android) holdes skjermen kun våken
 * når enheten lader, slik at den fortsatt kan gå i dvale på batteri. Mangler
 * batteri-API antar vi at den står i strøm (kiosk) og holder den alltid våken.
 *
 * Wake Lock frigjøres automatisk av nettleseren når fanen skjules, så vi
 * re-akkvirerer på `visibilitychange`.
 */
interface BatteryLike {
  charging: boolean
  addEventListener(type: 'chargingchange', listener: () => void): void
  removeEventListener(type: 'chargingchange', listener: () => void): void
}

interface NavigatorWithBattery {
  getBattery?: () => Promise<BatteryLike>
}

export function useKeepAwake() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let battery: BatteryLike | null = null
    let cancelled = false

    async function acquire() {
      if (cancelled || sentinel || document.visibilityState !== 'visible') return
      try {
        sentinel = await navigator.wakeLock.request('screen')
        sentinel.addEventListener('release', () => { sentinel = null })
      } catch {
        // f.eks. nektet eller fanen ble skjult i mellomtiden
      }
    }

    async function release() {
      if (!sentinel) return
      try {
        await sentinel.release()
      } catch {
        /* allerede frigjort */
      }
      sentinel = null
    }

    // Kun lås når enheten lader (hvis vi kan vite det), ellers anta strøm.
    function shouldKeepAwake() {
      return battery ? battery.charging : true
    }

    async function sync() {
      if (shouldKeepAwake()) {
        await acquire()
      } else {
        await release()
      }
    }

    async function init() {
      const nav = navigator as Navigator & NavigatorWithBattery
      if (nav.getBattery) {
        try {
          battery = await nav.getBattery()
          if (!cancelled) battery.addEventListener('chargingchange', sync)
        } catch {
          /* batteri-API utilgjengelig */
        }
      }
      document.addEventListener('visibilitychange', sync)
      sync()
    }

    init()

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', sync)
      battery?.removeEventListener('chargingchange', sync)
      release()
    }
  }, [])
}
