export interface ClockCity {
  code: string
  name: string
  city: string
  timezone: string
  flag: string
  location?: { latitude: number; longitude: number }
}

export const cities: ClockCity[] = [
  { code: 'US-NY', name: 'United States', city: 'New York', timezone: 'America/New_York', flag: '🇺🇸', location: { latitude: 40.7128, longitude: -74.006 } },
  { code: 'US-LA', name: 'United States', city: 'Los Angeles', timezone: 'America/Los_Angeles', flag: '🇺🇸', location: { latitude: 34.0522, longitude: -118.2437 } },
  { code: 'GB', name: 'United Kingdom', city: 'London', timezone: 'Europe/London', flag: '🇬🇧', location: { latitude: 51.5072, longitude: -0.1276 } },
  { code: 'CA-TO', name: 'Canada', city: 'Toronto', timezone: 'America/Toronto', flag: '🇨🇦', location: { latitude: 43.6532, longitude: -79.3832 } },
  { code: 'CA-VA', name: 'Canada', city: 'Vancouver', timezone: 'America/Vancouver', flag: '🇨🇦', location: { latitude: 49.2827, longitude: -123.1207 } },
  { code: 'AU', name: 'Australia', city: 'Sydney', timezone: 'Australia/Sydney', flag: '🇦🇺', location: { latitude: -33.8688, longitude: 151.2093 } },
  { code: 'NZ', name: 'New Zealand', city: 'Auckland', timezone: 'Pacific/Auckland', flag: '🇳🇿', location: { latitude: -36.8509, longitude: 174.7645 } },
  { code: 'DE', name: 'Germany', city: 'Berlin', timezone: 'Europe/Berlin', flag: '🇩🇪', location: { latitude: 52.52, longitude: 13.405 } },
]
