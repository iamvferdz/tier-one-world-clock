import { useMemo } from 'react'
import { geoCentroid, geoCircle, geoContains, geoEqualEarth, geoGraticule10, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { numericToAlpha2 } from 'i18n-iso-countries'
import world from 'world-atlas/countries-110m.json'
import { Moon, Sun } from 'lucide-react'
import { clockParts } from './lib/time'

const width = 1000
const height = 520
const projection = geoEqualEarth().fitSize([width, height], { type: 'Sphere' })
const path = geoPath(projection)
const landPath = path(feature(world, world.objects.land)) ?? ''
const countryFeatures = feature(world, world.objects.countries).features
const countryPaths = countryFeatures.map((country) => ({
  id: String(country.id ?? ''),
  countryCode: numericToAlpha2(String(country.id ?? '')),
  name: country.properties?.name ?? 'Unknown country',
  path: path(country) ?? '',
}))
const countryCentroids = new Map(countryFeatures.map((country) => [
  numericToAlpha2(String(country.id ?? '')),
  geoCentroid(country),
]))
const continentLabels = [
  { name: 'NORTH AMERICA', coordinates: [-103, 45] as [number, number] },
  { name: 'SOUTH AMERICA', coordinates: [-60, -18] as [number, number] },
  { name: 'EUROPE', coordinates: [18, 52] as [number, number] },
  { name: 'AFRICA', coordinates: [20, 1] as [number, number] },
  { name: 'ASIA', coordinates: [94, 43] as [number, number] },
  { name: 'OCEANIA', coordinates: [138, -25] as [number, number] },
  { name: 'ANTARCTICA', coordinates: [0, -78] as [number, number] },
].flatMap(({ name, coordinates }) => {
  const point = projection(coordinates)
  return point ? [{ name, point }] : []
})
const graticulePath = path(geoGraticule10()) ?? ''
const spherePath = path({ type: 'Sphere' }) ?? ''

export interface MapLocation {
  latitude: number
  longitude: number
}

export interface MapFavoriteClock {
  city: string
  countryCode: string
  location?: MapLocation
}

export function countryCodeAtLocation(location: MapLocation) {
  const country = countryFeatures.find((feature) => geoContains(feature, [location.longitude, location.latitude]))
  return country ? numericToAlpha2(String(country.id ?? '')) : undefined
}

function normalizeLongitude(longitude: number) {
  return ((longitude + 540) % 360) - 180
}

function getSubsolarPoint(date: Date) {
  const julianDate = date.getTime() / 86_400_000 + 2_440_587.5
  const days = julianDate - 2_451_545
  const centuries = days / 36_525
  const radians = Math.PI / 180
  const meanLongitude = ((280.46 + 0.9856474 * days) % 360) * radians
  const meanAnomaly = ((357.528 + 0.9856003 * days) % 360) * radians
  const eclipticLongitude = meanLongitude + (1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * radians
  const obliquity = (23.439 - 0.0000004 * days) * radians
  const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(eclipticLongitude), Math.cos(eclipticLongitude)) / radians
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude)) / radians
  const siderealTime = (280.46061837 + 360.98564736629 * days + 0.000387933 * centuries ** 2 - centuries ** 3 / 38_710_000) % 360
  return { longitude: normalizeLongitude(rightAscension - siderealTime), latitude: declination }
}

interface DayNightMapProps {
  now: Date
  compact?: boolean
  interactive?: boolean
  showSeconds?: boolean
  location?: MapLocation | null
  favoriteClocks?: MapFavoriteClock[]
  selectedCountryCode?: string
  hoveredCountryCode?: string
  onSelectCountry?: (countryCode: string) => void
  onHoverCountry?: (countryCode: string | undefined) => void
}

export default function DayNightMap({
  now,
  compact = false,
  interactive = false,
  showSeconds = false,
  location,
  favoriteClocks = [],
  selectedCountryCode,
  hoveredCountryCode,
  onSelectCountry,
  onHoverCountry,
}: DayNightMapProps) {
  const minute = Math.floor(now.getTime() / 60_000)
  const { nightPath, locationPoint, favoritePoints } = useMemo(() => {
    const sun = getSubsolarPoint(new Date(minute * 60_000))
    const nightCircle = geoCircle()
      .center([normalizeLongitude(sun.longitude + 180), -sun.latitude])
      .radius(90)
      .precision(1)()
    const fallbackCounts = new Map<string, number>()
    const favoritePoints = favoriteClocks.flatMap((favorite) => {
      let coordinates: [number, number] | undefined = favorite.location
        ? [favorite.location.longitude, favorite.location.latitude]
        : countryCentroids.get(favorite.countryCode)
      if (!coordinates) return []
      if (!favorite.location) {
        const index = fallbackCounts.get(favorite.countryCode) ?? 0
        fallbackCounts.set(favorite.countryCode, index + 1)
        if (index > 0) {
          const angle = index * 2.4
          coordinates = [
            coordinates[0] + Math.cos(angle) * 4,
            coordinates[1] + Math.sin(angle) * 3,
          ]
        }
      }
      const point = projection(coordinates)
      return point ? [{ city: favorite.city, point }] : []
    })
    return {
      nightPath: path(nightCircle) ?? '',
      locationPoint: location ? projection([location.longitude, location.latitude]) : null,
      favoritePoints,
    }
  }, [favoriteClocks, location, minute])

  return (
    <div className={`daynight-map ${compact ? 'daynight-map-compact' : ''}`}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="daynight-map-title daynight-map-description">
        <title id="daynight-map-title">Live day and night world map</title>
        <desc id="daynight-map-description">A world map with continent names and the night side shaded, updated for the current time.</desc>
        <defs>
          <linearGradient id="ocean-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#17374b" />
            <stop offset="100%" stopColor="#102335" />
          </linearGradient>
          <clipPath id="world-globe-clip"><path d={spherePath} /></clipPath>
        </defs>
        <path d={spherePath} fill="url(#ocean-gradient)" />
        <g clipPath="url(#world-globe-clip)">
          <path d={landPath} fill="#87c9a8" />
          <path d={nightPath} fill="#11192f" opacity=".82" />
          <path d={graticulePath} fill="none" stroke="#aac4ce" strokeOpacity=".2" strokeWidth=".55" />
          {countryPaths.map((country, index) => {
            const code = country.countryCode
            const active = code && (code === selectedCountryCode || code === hoveredCountryCode)
            return <path
              key={`${country.id}-${index}`}
              d={country.path}
              className={interactive ? `map-country ${active ? 'map-country-active' : ''}` : undefined}
              fill={active ? '#ffd47a66' : 'transparent'}
              stroke={active ? '#ffe09a' : '#264253'}
              strokeWidth={active ? '1.4' : '.55'}
              pointerEvents={interactive ? 'all' : undefined}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? country.name : undefined}
              aria-pressed={interactive && code ? code === selectedCountryCode : undefined}
              onMouseEnter={interactive && code ? () => onHoverCountry?.(code) : undefined}
              onMouseLeave={interactive ? () => onHoverCountry?.(undefined) : undefined}
              onClick={interactive && code ? () => onSelectCountry?.(code) : undefined}
              onKeyDown={interactive && code ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectCountry?.(code)
                }
              } : undefined}
            />
          })}
          <path d={nightPath} fill="none" stroke="#f4c078" strokeOpacity=".85" strokeWidth="1.5" pointerEvents="none" />
          {!compact && <g className="map-continent-labels" pointerEvents="none" aria-hidden="true">
            {continentLabels.map(({ name, point }) => <text key={name} x={point[0]} y={point[1]}>{name}</text>)}
          </g>}
          {favoritePoints.map(({ city, point }, index) => <g key={`${city}-${index}`} className="map-favorite-marker" aria-label={`Favorite clock: ${city}`}>
            <circle cx={point[0]} cy={point[1]} r="3.5" />
            <text x={point[0] + 7} y={point[1] - 5}>{city}</text>
            <title>{city} favorite clock location</title>
          </g>)}
          {locationPoint && <g className="user-location-marker" aria-label="Your location">
            <circle cx={locationPoint[0]} cy={locationPoint[1]} r="13" className="location-marker-halo" />
            <circle cx={locationPoint[0]} cy={locationPoint[1]} r="5" className="location-marker-dot" />
            <text x={locationPoint[0] + 9} y={locationPoint[1] - 8} className="location-marker-label">YOU</text>
          </g>}
        </g>
        <path d={spherePath} fill="none" stroke="#496274" strokeWidth="1.5" />
      </svg>
      {!compact && <div className="map-legend">
        <span><Sun size={15} /> Daylight</span>
        <span><Moon size={14} /> Night</span>
        <span className="map-live-note">Sun position and day/night boundary follow map time</span>
      </div>}
      {interactive && <div className="solar-time-ruler" aria-label="Approximate solar time by longitude">
        <div className="solar-time-ruler-heading">
          <strong>Longitude time ruler</strong>
          <span>Approximate solar time at each longitude</span>
        </div>
        <div className="solar-time-ruler-track">
          {[-12, -8, -4, 0, 4, 8, 12].map((offset) => {
            const longitude = offset * 15
            const time = clockParts(new Date(now.getTime() + offset * 3_600_000), 'UTC', showSeconds)
            const longitudeLabel = longitude === 0
              ? '0°'
              : `${Math.abs(longitude)}°${longitude < 0 ? 'W' : 'E'}`
            return <div className="solar-time-ruler-tick" key={offset}>
              <span>{longitudeLabel}</span>
              <i />
              <small>UTC{offset >= 0 ? '+' : ''}{offset}</small>
              <strong>{time.time}<em>{time.period}</em></strong>
            </div>
          })}
        </div>
      </div>}
    </div>
  )
}
