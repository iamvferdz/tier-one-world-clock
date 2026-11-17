import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Clock3, Globe2, Heart, LocateFixed, Map as MapIcon, Moon, Plus, Star, Sun, Sunrise, Sunset, Timer, X } from 'lucide-react'
import { getAllCountries, getCountryForTimezone, getTimezonesForCountry, type Country } from 'countries-and-timezones'
import { cities, type ClockCity } from './data'
import DayNightMap, { countryCodeAtLocation, type MapLocation } from './DayNightMap'
import { clockParts, offsetLabel } from './lib/time'
import logoUrl from '../logo.png'
import SiteFooter from './SiteFooter'
import UploadTimePage, { type UploadMarketFavorite } from './UploadTimePage'

const countries = Object.values(getAllCountries()).sort((a, b) => a.name.localeCompare(b.name))
const countryById = new Map<string, Country>(countries.map((country): [string, Country] => [country.id, country]))

function countryFlag(countryCode: string) {
  return String.fromCodePoint(...Array.from(countryCode.toUpperCase(), (character) => 127397 + character.charCodeAt(0)))
}

function cityFromTimezone(timezone: string, country: Country): ClockCity {
  const parts = timezone.split('/')
  const city = (parts.pop() ?? timezone).replace(/_/g, ' ')
  return { code: timezone, name: country.name, city, timezone, flag: countryFlag(country.id) }
}

function loadShowSeconds() {
  try {
    return localStorage.getItem('tierone.showSeconds') === 'true'
  } catch (error) {
    console.error('Could not load the time display preference.', error)
    return false
  }
}

function loadTheme(): 'dark' | 'light' {
  try {
    return localStorage.getItem('tierone.theme') === 'light' ? 'light' : 'dark'
  } catch (error) {
    console.error('Could not load the color theme preference.', error)
    return 'dark'
  }
}

function loadStoredList<T>(key: string, isValid: (value: unknown) => value is T): T[] {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return []
    const value: unknown = JSON.parse(stored)
    return Array.isArray(value) ? value.filter(isValid) : []
  } catch (error) {
    console.error(`Could not load saved clocks (${key}).`, error)
    return []
  }
}

function timeOfDay(hour: number) {
  if (hour < 5 || hour >= 21) return { label: 'Night', Icon: Moon, className: 'night' }
  if (hour < 12) return { label: 'Morning', Icon: Sunrise, className: 'morning' }
  if (hour < 17) return { label: 'Afternoon', Icon: Sun, className: 'afternoon' }
  return { label: 'Evening', Icon: Sunset, className: 'evening' }
}

function App() {
  const [page, setPage] = useState<'clock' | 'map' | 'upload'>('clock')
  const [now, setNow] = useState(() => new Date())
  const [selectedMapTime, setSelectedMapTime] = useState<Date | null>(null)
  const [showSeconds, setShowSeconds] = useState(loadShowSeconds)
  const [theme, setTheme] = useState<'dark' | 'light'>(loadTheme)
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const localCountry = getCountryForTimezone(localTimezone)
  const [addedClocks, setAddedClocks] = useState(() => loadStoredList<{ countryId: string; timezone: string }>(
    'tierone.addedClocks',
    (value): value is { countryId: string; timezone: string } => {
      if (typeof value !== 'object' || value === null || !('countryId' in value) || !('timezone' in value) || typeof value.countryId !== 'string' || typeof value.timezone !== 'string') return false
      return countryById.get(value.countryId)?.timezones.some((timezone) => String(timezone) === value.timezone) ?? false
    },
  ))
  const [favoriteTimezones, setFavoriteTimezones] = useState(() => loadStoredList<string>(
    'tierone.favoriteTimezones',
    (value): value is string => typeof value === 'string',
  ))
  const [uploadFavorites, setUploadFavorites] = useState<UploadMarketFavorite[]>(() => loadStoredList<UploadMarketFavorite>(
    'tierone.uploadFavorites',
    (value): value is UploadMarketFavorite => {
      if (typeof value !== 'object' || value === null || !('countryId' in value) || !('timezone' in value) || typeof value.countryId !== 'string' || typeof value.timezone !== 'string') return false
      return countryById.get(value.countryId)?.timezones.some((timezone) => String(timezone) === value.timezone) ?? false
    },
  ))
  const [showAddClock, setShowAddClock] = useState(false)
  const [selectedCountryId, setSelectedCountryId] = useState('')
  const [selectedTimezone, setSelectedTimezone] = useState('')
  const [mapCountryId, setMapCountryId] = useState(localCountry?.id ?? '')
  const [mapTimezone, setMapTimezone] = useState(localCountry?.timezones.some((timezone) => String(timezone) === localTimezone)
    ? localTimezone
    : String(localCountry?.timezones[0] ?? ''))
  const [hoveredMapCountryId, setHoveredMapCountryId] = useState<string>()
  const [location, setLocation] = useState<MapLocation | null>(null)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'located' | 'error'>('idle')
  const [locationError, setLocationError] = useState('')
  const [storageError, setStorageError] = useState('')
  const displayedMapTime = selectedMapTime ?? now
  const mapTimeParts = clockParts(displayedMapTime, 'UTC', showSeconds)
  const mapTimelineValue = displayedMapTime.getUTCHours() * 60 + displayedMapTime.getUTCMinutes()
  const localCity = localTimezone.split('/').pop()?.replace(/_/g, ' ') ?? localTimezone
  const localTime = clockParts(now, localTimezone, showSeconds)
  const clocks = useMemo(() => [
    ...cities,
    ...addedClocks.flatMap(({ countryId, timezone }) => {
      const country = countryById.get(countryId)
      return country ? [cityFromTimezone(timezone, country)] : []
    }),
  ], [addedClocks])
  const selectedCountry = countryById.get(selectedCountryId)
  const countryTimezones = selectedCountry ? getTimezonesForCountry(selectedCountry.id) ?? [] : []
  const selectedClockExists = clocks.some((city) => city.timezone === selectedTimezone)
  const favoriteClocks = clocks.filter((city) => favoriteTimezones.includes(city.timezone))
  const mapFavoriteClocks = favoriteClocks.map((city) => ({
    city: city.city,
    countryCode: getCountryForTimezone(city.timezone)?.id ?? '',
    location: city.location,
  }))
  const mapCountry = countryById.get(mapCountryId)
  const mapCountryTimezones = mapCountry ? getTimezonesForCountry(mapCountry.id) ?? [] : []
  const previewCountry = countryById.get(hoveredMapCountryId ?? mapCountryId)
  const previewTimezone = previewCountry?.id === mapCountryId && mapTimezone
    ? mapTimezone
    : String(previewCountry?.timezones[0] ?? localTimezone)
  const previewTime = clockParts(displayedMapTime, previewTimezone, showSeconds)
  const previewDayPart = timeOfDay(previewTime.hour)
  const PreviewDayPartIcon = previewDayPart.Icon
  const ThemeIcon = theme === 'dark' ? Sun : Moon

  const addClock = () => {
    if (!selectedCountry || !selectedTimezone || selectedClockExists) return
    setAddedClocks((current) => [...current, { countryId: selectedCountry.id, timezone: selectedTimezone }])
    setShowAddClock(false)
    setSelectedCountryId('')
    setSelectedTimezone('')
  }

  useEffect(() => {
    if (showSeconds) {
      const interval = window.setInterval(() => setNow(new Date()), 1_000)
      return () => window.clearInterval(interval)
    }
    let interval: number | undefined
    const timer = window.setTimeout(() => {
      setNow(new Date())
      interval = window.setInterval(() => setNow(new Date()), 60_000)
    }, 60_000 - (Date.now() % 60_000))
    return () => {
      window.clearTimeout(timer)
      if (interval !== undefined) window.clearInterval(interval)
    }
  }, [showSeconds])
  useEffect(() => {
    try {
      localStorage.setItem('tierone.addedClocks', JSON.stringify(addedClocks))
      localStorage.setItem('tierone.favoriteTimezones', JSON.stringify(favoriteTimezones))
      localStorage.setItem('tierone.uploadFavorites', JSON.stringify(uploadFavorites))
      localStorage.setItem('tierone.showSeconds', String(showSeconds))
      localStorage.setItem('tierone.theme', theme)
      setStorageError('')
    } catch (error) {
      console.error('Could not save your clock preferences in this browser.', error)
      setStorageError('Your clock changes could not be saved in this browser.')
    }
  }, [addedClocks, favoriteTimezones, uploadFavorites, showSeconds, theme])

  const toggleFavorite = (timezone: string) => {
    setFavoriteTimezones((current) => current.includes(timezone)
      ? current.filter((value) => value !== timezone)
      : [...current, timezone])
  }
  const toggleUploadFavorite = (countryId: string, timezone: string) => {
    setUploadFavorites((current) => current.some((favorite) => favorite.countryId === countryId && favorite.timezone === timezone)
      ? current.filter((favorite) => favorite.countryId !== countryId || favorite.timezone !== timezone)
      : [...current, { countryId, timezone }])
  }
  const removeClock = (timezone: string) => {
    setAddedClocks((current) => current.filter((clock) => clock.timezone !== timezone))
    setFavoriteTimezones((current) => current.filter((value) => value !== timezone))
  }
  const selectMapCountry = (countryId: string) => {
    const country = countryById.get(countryId)
    if (!country) return
    const zones = getTimezonesForCountry(country.id) ?? []
    setMapCountryId(country.id)
    setMapTimezone(String(zones.find((timezone) => String(timezone.name) === localTimezone)?.name ?? zones[0]?.name ?? ''))
    setHoveredMapCountryId(undefined)
  }
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      setLocationError('Location access is not available in this browser.')
      return
    }
    setLocationStatus('requesting')
    setLocationError('')
    navigator.geolocation.getCurrentPosition((position) => {
      const currentLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude }
      setLocation(currentLocation)
      setLocationStatus('located')
      setLocationError('')
      const countryId = countryCodeAtLocation(currentLocation)
      if (countryId) selectMapCountry(countryId)
    }, (error) => {
      setLocationStatus('error')
      setLocationError(error.code === error.PERMISSION_DENIED
        ? 'Location permission was denied. You can still select any country on the map.'
        : error.code === error.POSITION_UNAVAILABLE
          ? 'Your location is unavailable right now. Please try again later.'
          : 'Location lookup timed out. Please try again.')
    }, { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 })
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <header className="site-header">
        <div className="brand-group">
          <a className="brand" href="/" aria-label="tierOne home">
            <span className="brand-mark"><img src={logoUrl} alt="" /></span>
            <span className="brand-name">tier<span>One</span></span>
          </a>
          <span className="live-indicator" aria-label="Live"><i /> Live</span>
        </div>
        <nav className="site-nav" aria-label="Main navigation">
          <button type="button" className={page === 'clock' ? 'active' : ''} aria-label="World Clock" aria-current={page === 'clock' ? 'page' : undefined} onClick={() => setPage('clock')}><Clock3 size={15} /><span className="nav-label-full">World Clock</span><span className="nav-label-short">Clock</span></button>
          <button type="button" className={page === 'map' ? 'active' : ''} aria-label="Day & Night Map" aria-current={page === 'map' ? 'page' : undefined} onClick={() => setPage('map')}><MapIcon size={15} /><span className="nav-label-full">Day &amp; Night</span><span className="nav-label-short">Map</span></button>
          <button type="button" className={page === 'upload' ? 'active' : ''} aria-label="Best Time to Upload" aria-current={page === 'upload' ? 'page' : undefined} onClick={() => setPage('upload')}><CalendarClock size={15} /><span className="nav-label-full">Best Time to Upload</span><span className="nav-label-short">Upload</span></button>
        </nav>
        <div className="header-controls">
          <button className="seconds-toggle" type="button" aria-label={showSeconds ? 'Hide seconds' : 'Show seconds'} aria-pressed={showSeconds} onClick={() => setShowSeconds((value) => !value)}>
            <Timer size={14} /> Seconds <span>{showSeconds ? 'On' : 'Off'}</span>
          </button>
          <button className="theme-toggle" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'light'} onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')}>
            <ThemeIcon size={15} /> <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>

      <main className={`page-wrap ${page === 'map' ? 'map-page' : ''}`}>
        {storageError && <p className="storage-error" role="alert">{storageError}</p>}
        {page === 'clock' ? <>
        <section className="page-title">
          <div className="eyebrow"><Globe2 size={14} /> CREATOR MARKETS</div>
          <h1>World Clock</h1>
          <p>Live local times across key Tier 1 content markets.</p>
        </section>

        <section className="local-time-card" aria-label="Your local time">
          <div>
            <span className="feature-label">YOUR LOCAL TIME</span>
            <div className={`local-time${showSeconds ? ' with-seconds' : ''}`}>{localTime.time}<small>{localTime.period}</small></div>
            <p>{localCity} <span>·</span> {localTimezone}</p>
          </div>
          <div className="local-date">
            <span>{localTime.date}</span>
            <strong>{offsetLabel(now, localTimezone)}</strong>
          </div>
          <Clock3 className="feature-decoration" size={140} aria-hidden="true" />
        </section>

        <section className="map-preview-card">
          <div className="map-preview-heading">
            <div><span className="eyebrow"><Sun size={13} /> LIVE MAP</span><h2>Day &amp; night around the world</h2><p>See which parts of the world are in daylight right now.</p></div>
            <button type="button" onClick={() => setPage('map')}><MapIcon size={15} /> Open full map</button>
          </div>
          <DayNightMap now={now} compact location={location} favoriteClocks={mapFavoriteClocks} />
        </section>

        <section className="section-heading">
          <div>
            <h2>Tier 1 markets</h2>
            <p>United States, United Kingdom, Canada, Australia, New Zealand, and Germany.</p>
          </div>
          <span className="live-tag"><i /> LIVE</span>
        </section>

        <div className="add-clock-area">
          <button className="add-clock-button" type="button" aria-expanded={showAddClock} onClick={() => setShowAddClock((open) => !open)}>
            {showAddClock ? <X size={16} /> : <Plus size={16} />}
            {showAddClock ? 'Close' : 'Add a clock'}
          </button>
          {showAddClock && <div className="add-clock-panel">
            <label htmlFor="country-select">Choose a country</label>
            <select id="country-select" autoFocus value={selectedCountryId} onChange={(event) => {
              const nextCountry = countryById.get(event.target.value)
              setSelectedCountryId(event.target.value)
              setSelectedTimezone(nextCountry ? (getTimezonesForCountry(nextCountry.id)?.[0]?.name ?? '') : '')
            }}>
              <option value="">Select a country</option>
              {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
            </select>
            {selectedCountry && <div className="country-clock-picker">
              {countryTimezones.length > 0
                ? <>
                  <label htmlFor="timezone-select">{countryTimezones.length > 1 ? 'Choose a city / time zone' : 'Time zone'}</label>
                  <select id="timezone-select" value={selectedTimezone} onChange={(event) => setSelectedTimezone(event.target.value)}>
                    {countryTimezones.map((timezone) => <option key={timezone.name} value={timezone.name}>{timezone.name.split('/').pop()?.replace(/_/g, ' ')} · {timezone.name}</option>)}
                  </select>
                </>
                : <p className="picker-note">No time zone is listed for this country in the current data.</p>}
              {selectedClockExists && <p className="picker-note">This time zone is already on your clock list.</p>}
              <button className="confirm-add-clock" type="button" onClick={addClock} disabled={!selectedTimezone || selectedClockExists}>
                <Plus size={15} /> Add {selectedCountry.name}
              </button>
            </div>}
          </div>}
        </div>

        <section className="favorites-section">
          <div className="section-heading">
            <div><h2><Star size={16} /> Favorites</h2><p>Your starred clocks, saved in this browser.</p></div>
            {favoriteClocks.length > 0 && <span className="favorite-count">{favoriteClocks.length}</span>}
          </div>
          {favoriteClocks.length > 0
            ? <section className="world-clock-grid" aria-label="Favorite clocks">
              {favoriteClocks.map((city) => <ClockTile key={`favorite-${city.code}`} city={city} now={now} showSeconds={showSeconds} favorite onToggleFavorite={() => toggleFavorite(city.timezone)} removable={addedClocks.some((clock) => clock.timezone === city.timezone)} onRemove={() => removeClock(city.timezone)} />)}
            </section>
            : <p className="favorites-empty"><Heart size={16} /> Star any clock to keep it handy here.</p>}
        </section>

        <section className="world-clock-grid" aria-label="World clocks">
          {clocks.map((city) => <ClockTile key={city.code} city={city} now={now} showSeconds={showSeconds} favorite={favoriteTimezones.includes(city.timezone)} onToggleFavorite={() => toggleFavorite(city.timezone)} removable={addedClocks.some((clock) => clock.timezone === city.timezone)} onRemove={() => removeClock(city.timezone)} />)}
        </section>

        </> : page === 'map' ? <section className="daynight-page-content">
          <section className="page-title">
            <div className="eyebrow"><Globe2 size={14} /> LIVE SOLAR VIEW</div>
            <h1>Day &amp; Night Map</h1>
            <p>A live view of daylight and nighttime across the whole world.</p>
          </section>
          <div className="map-top-bar">
            <div className="map-local-time">
              <span className="map-panel-eyebrow"><Clock3 size={14} /> YOUR LOCAL TIME</span>
              <strong className={showSeconds ? 'with-seconds' : undefined}>{localTime.time}<small>{localTime.period}</small></strong>
              <span>{localCity} · {localTimezone}</span>
              <em>{location ? 'Exact location marked' : 'Approximate country from your device time zone'}</em>
            </div>
            <div className="map-location-control">
              <button type="button" className={locationStatus === 'located' ? 'location-button location-button-active' : 'location-button'} onClick={requestUserLocation} disabled={locationStatus === 'requesting'}>
                <LocateFixed size={16} />
                {locationStatus === 'requesting' ? 'Finding your location…' : locationStatus === 'located' ? 'Update my location' : 'Show my location'}
              </button>
              <p>{locationError || 'Your browser will ask permission. Location stays on this device and is not saved.'}</p>
            </div>
          </div>
          <section className="map-timeline-panel" aria-label="Map time controls">
            <div className="map-timeline-heading">
              <div>
                <span className="map-panel-eyebrow"><Clock3 size={14} /> MAP TIME · UTC</span>
                <strong>{mapTimeParts.time}<small>{mapTimeParts.period}</small></strong>
                <span>{mapTimeParts.date}</span>
              </div>
              <button type="button" className="map-live-button" disabled={selectedMapTime === null} onClick={() => setSelectedMapTime(null)}>
                {selectedMapTime === null ? 'LIVE' : 'Return to live'}
              </button>
            </div>
            <label className="map-timeline-control">
              <input
                type="range"
                aria-label="Select map time in UTC"
                min="0"
                max="1439"
                step="1"
                value={mapTimelineValue}
                aria-valuetext={`${mapTimeParts.time} ${mapTimeParts.period} UTC`}
                onChange={(event) => {
                  const minutes = Number(event.target.value)
                  const selectedTime = new Date(displayedMapTime)
                  selectedTime.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
                  setSelectedMapTime(selectedTime)
                }}
              />
              <span className="map-timeline-ticks" aria-hidden="true">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
              </span>
            </label>
            <p className="map-timeline-help">Drag the ruler to preview daylight and night at another UTC time.</p>
          </section>
          <div className="map-explorer-layout">
            <aside className="map-country-panel" aria-live="polite">
              <span className="map-panel-eyebrow"><Globe2 size={14} /> {hoveredMapCountryId ? 'COUNTRY PREVIEW' : location && mapCountry ? 'YOUR LOCATION' : 'SELECTED COUNTRY'}</span>
              {previewCountry ? <>
                <div className="map-country-title"><span>{countryFlag(previewCountry.id)}</span><div><h2>{previewCountry.name}</h2><p>{previewTimezone.split('/')[0] || 'Local region'} region</p></div></div>
                {!hoveredMapCountryId && mapCountryTimezones.length > 1 && <label className="map-timezone-select">Time zone
                  <select value={mapTimezone} onChange={(event) => setMapTimezone(event.target.value)}>
                    {mapCountryTimezones.map((timezone) => <option key={timezone.name} value={timezone.name}>{timezone.name.split('/').pop()?.replace(/_/g, ' ')} · {timezone.name}</option>)}
                  </select>
                </label>}
                <div className="map-country-time">
                  <span><PreviewDayPartIcon size={16} /> {previewDayPart.label}</span>
                  <strong className={showSeconds ? 'with-seconds' : undefined}>{previewTime.time}<small>{previewTime.period}</small></strong>
                  <p>{previewTime.date} <i>·</i> {offsetLabel(displayedMapTime, previewTimezone)}</p>
                </div>
              </> : <p className="map-country-empty">Hover over or select a country on the map to see its local time.</p>}
              {location && <p className="location-confirmation"><LocateFixed size={13} /> Your current position is marked on the map.</p>}
            </aside>
            <section className="daynight-map-card" aria-label="Interactive world map showing daylight and night areas">
              <DayNightMap
                now={displayedMapTime}
                interactive
                showSeconds={showSeconds}
                location={location}
                favoriteClocks={mapFavoriteClocks}
                selectedCountryCode={mapCountryId}
                hoveredCountryCode={hoveredMapCountryId}
                onSelectCountry={selectMapCountry}
                onHoverCountry={setHoveredMapCountryId}
              />
            </section>
          </div>
        </section> : <UploadTimePage now={now} showSeconds={showSeconds} favorites={uploadFavorites} onToggleFavorite={toggleUploadFavorite} />}
      </main>
      <SiteFooter />
    </div>
  )
}

function ClockTile({ city, now, showSeconds, favorite, onToggleFavorite, removable, onRemove }: { city: ClockCity; now: Date; showSeconds: boolean; favorite: boolean; onToggleFavorite: () => void; removable: boolean; onRemove: () => void }) {
  const time = clockParts(now, city.timezone, showSeconds)
  const minute = Number(time.time.split(':')[1])
  const hourAngle = ((time.hour % 12) + minute / 60) * 30
  const dayPart = timeOfDay(time.hour)
  const DayPartIcon = dayPart.Icon

  return (
    <article className="clock-tile">
      <div className="clock-tile-top">
        <span className="city-flag" aria-hidden="true">{city.flag}</span>
        <span className="clock-day">{time.date}</span>
        <span className={`daypart-badge daypart-${dayPart.className}`}><DayPartIcon size={14} aria-hidden="true" />{dayPart.label}</span>
        <button className={`favorite-clock ${favorite ? 'is-favorite' : ''}`} type="button" aria-label={`${favorite ? 'Remove' : 'Add'} ${city.city} ${favorite ? 'from' : 'to'} favorites`} aria-pressed={favorite} onClick={onToggleFavorite}>
          <Heart size={15} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        {removable && <button className="remove-clock" type="button" aria-label={`Remove ${city.city} clock`} onClick={onRemove}><X size={14} /></button>}
      </div>
      <div className="clock-visual">
        <div className="analog-clock" aria-hidden="true">
          <i className="clock-hand hour-hand" style={{ transform: `translateX(-50%) rotate(${hourAngle}deg)` }} />
          <i className="clock-hand minute-hand" style={{ transform: `translateX(-50%) rotate(${minute * 6}deg)` }} />
          <i className="clock-pin" />
        </div>
        <div className={`digital-time${showSeconds ? ' with-seconds' : ''}`}>{time.time}<small>{time.period}</small></div>
      </div>
      <div className="clock-tile-bottom">
        <div><strong>{city.city}</strong><span>{city.name}</span></div>
        <span className="offset-badge">{offsetLabel(now, city.timezone)}</span>
      </div>
    </article>
  )
}

export default App
