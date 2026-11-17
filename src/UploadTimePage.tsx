import { useState } from 'react'
import { CalendarClock, Info, Star } from 'lucide-react'
import { getAllCountries, getCountryForTimezone, getTimezonesForCountry } from 'countries-and-timezones'
import { cities } from './data'
import { clockParts } from './lib/time'

interface UploadTimePageProps {
  now: Date
  showSeconds: boolean
  favorites: UploadMarketFavorite[]
  onToggleFavorite: (countryId: string, timezone: string) => void
}

export interface UploadMarketFavorite {
  countryId: string
  timezone: string
}

const countries = Object.values(getAllCountries())
  .filter((country) => country.timezones.length > 0)
  .sort((a, b) => a.name.localeCompare(b.name))
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const localCountry = getCountryForTimezone(localTimezone)

function formatHour(hour: number) {
  const displayHour = hour % 12 || 12
  return `${displayHour}${hour < 12 ? 'AM' : 'PM'}`
}

export default function UploadTimePage({ now, showSeconds, favorites, onToggleFavorite }: UploadTimePageProps) {
  const [countryId, setCountryId] = useState<string>(localCountry?.id ?? 'US')
  const [timezone, setTimezone] = useState(localTimezone)
  const [day, setDay] = useState(() => new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: localTimezone }).format(now))
  const selectedCountry = countries.find((country) => country.id === countryId) ?? countries[0]
  const timezones = getTimezonesForCountry(selectedCountry.id) ?? []
  const selectedTimezone = timezones.some((zone) => zone.name === timezone)
    ? timezone
    : timezones[0]?.name ?? 'UTC'
  const isWeekend = day === 'Saturday' || day === 'Sunday'
  const startHour = isWeekend ? 10 : 17
  const endHour = isWeekend ? 13 : 21
  const currentTime = clockParts(now, selectedTimezone, showSeconds)
  const userLocalTime = clockParts(now, localTimezone, showSeconds)
  const isFavorite = favorites.some((favorite) => favorite.countryId === selectedCountry.id && favorite.timezone === selectedTimezone)
  const windowLabel = `${formatHour(startHour)}–${formatHour(endHour)}`

  return (
    <section className="upload-time-page">
      <section className="page-title">
        <div className="eyebrow"><CalendarClock size={14} /> CREATOR GUIDE</div>
        <h1>Best Time to Upload</h1>
        <p>Explore a rough time window by country and day—not a personalized recommendation.</p>
      </section>

      <aside className="upload-time-warning" role="note">
        <Info size={18} aria-hidden="true" />
        <div>
          <strong>These times are not accurate predictions.</strong>
          <p>They are generic, unverified starting points. Your audience may be active at different times.</p>
        </div>
      </aside>

      <section className="upload-time-section" aria-labelledby="upload-chart-title">
        <div className="section-heading">
          <div>
            <h2 id="upload-chart-title">Suggested upload window</h2>
            <p>Choose a country and day. Times are shown in the selected time zone.</p>
          </div>
        </div>
        <div className="upload-schedule-controls">
          <label>
            <span>Country</span>
            <select value={countryId} onChange={(event) => {
              const nextCountryId = event.target.value
              const nextTimezones = getTimezonesForCountry(nextCountryId) ?? []
              setCountryId(nextCountryId)
              setTimezone(nextTimezones.find((zone) => zone.name === localTimezone)?.name ?? nextTimezones[0]?.name ?? 'UTC')
            }}>
              {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
            </select>
          </label>
          <label>
            <span>Time zone / city</span>
            <select value={selectedTimezone} onChange={(event) => setTimezone(event.target.value)}>
              {timezones.map((zone) => <option key={zone.name} value={zone.name}>{zone.name.split('/').pop()?.replace(/_/g, ' ')} · {zone.name}</option>)}
            </select>
          </label>
          <label>
            <span>Day of week</span>
            <select value={day} onChange={(event) => setDay(event.target.value)}>
              {days.map((dayName) => <option key={dayName} value={dayName}>{dayName}</option>)}
            </select>
          </label>
        </div>

        <div className="upload-saved-favorites">
          <div className="upload-saved-favorites-heading">
            <strong>Favorite markets</strong>
            {!favorites.length && <span>Save a country and time zone with the star for quick access.</span>}
          </div>
          {favorites.length > 0 && <div className="upload-saved-favorite-list">
            {favorites.map((favorite) => {
              const favoriteCountry = countries.find((country) => country.id === favorite.countryId)
              if (!favoriteCountry) return null
              const city = favorite.timezone.split('/').pop()?.replace(/_/g, ' ') ?? favorite.timezone
              return <button
                type="button"
                key={`${favorite.countryId}-${favorite.timezone}`}
                onClick={() => {
                  setCountryId(favorite.countryId)
                  setTimezone(favorite.timezone)
                }}
                aria-label={`Use favorite ${favoriteCountry.name}, ${city}`}
              >
                <Star size={12} fill="currentColor" /> {favoriteCountry.name} · {city}
              </button>
            })}
          </div>}
        </div>

        <div className="upload-chart-card">
          <div className="upload-chart-heading">
            <div className="upload-chart-market">
              <strong>{day} · {selectedCountry.name}</strong>
              <span>{selectedTimezone}</span>
              <button
                type="button"
                className="upload-favorite-toggle"
                aria-pressed={isFavorite}
                aria-label={`${isFavorite ? 'Remove' : 'Save'} ${selectedCountry.name}, ${selectedTimezone} ${isFavorite ? 'from' : 'to'} favorites`}
                onClick={() => onToggleFavorite(selectedCountry.id, selectedTimezone)}
              >
                <Star size={13} fill={isFavorite ? 'currentColor' : 'none'} />
                {isFavorite ? 'Favorited' : 'Add to favorites'}
              </button>
            </div>
            <div className="upload-chart-times">
              <div className="upload-chart-time">
                <span>Selected country time</span>
                <strong className={showSeconds ? 'with-seconds' : undefined}>{currentTime.time}<small>{currentTime.period}</small></strong>
              </div>
              <div className="upload-chart-time">
                <span>Your current local time</span>
                <strong className={showSeconds ? 'with-seconds' : undefined}>{userLocalTime.time}<small>{userLocalTime.period}</small></strong>
              </div>
            </div>
          </div>
          <div className="upload-hour-chart" role="img" aria-label={`${day} suggested upload window for ${selectedCountry.name}: ${windowLabel} ${selectedTimezone}. This is a general heuristic, not audience analytics.`}>
            <div className="upload-hour-cells" aria-hidden="true">
              {Array.from({ length: 24 }, (_, hour) => {
                const inWindow = hour >= startHour && hour < endHour
                return <span className={inWindow ? 'upload-hour-cell upload-hour-cell-active' : 'upload-hour-cell'} key={hour} title={`${formatHour(hour)}${inWindow ? ' · suggested window' : ''}`} />
              })}
            </div>
            <div className="upload-hour-axis" aria-hidden="true">
              <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
            </div>
          </div>
          <div className="upload-chart-legend">
            <span><i /> Suggested window: {windowLabel}</span>
            <span>Local time · heuristic only</span>
          </div>
        </div>
        <p className="upload-window-note">The selected country changes the clock/time zone, and the selected day switches between a weekday and weekend rule. These hours are not calculated from country-level viewer data.</p>
      </section>

      <section className="upload-time-section" aria-labelledby="market-times-title">
        <div className="section-heading">
          <div>
            <h2 id="market-times-title">Current Tier 1 market times</h2>
            <p>Live reference clocks for key creator markets.</p>
          </div>
        </div>
        <div className="upload-market-grid">
          {cities.map((city) => {
            const time = clockParts(now, city.timezone, showSeconds)
            return <article className="upload-market-card" key={city.code}>
              <span className="upload-market-flag" aria-hidden="true">{city.flag}</span>
              <div className="upload-market-name">
                <strong>{city.city}</strong>
                <span>{city.name}</span>
              </div>
              <div className={`upload-market-clock${showSeconds ? ' with-seconds' : ''}`}>
                {time.time}<small>{time.period}</small>
              </div>
            </article>
          })}
        </div>
      </section>

      <section className="upload-data-source" aria-labelledby="upload-source-title">
        <h2 id="upload-source-title">Sources and accuracy</h2>
        <p><strong>This chart:</strong> its weekday/weekend windows are manually chosen rules of thumb, not sourced audience statistics. The app does not fetch YouTube API data, channel analytics, or viewer history.</p>
        <p><strong>For your channel's audience activity:</strong> YouTube Studio → Analytics → Audience includes “When your viewers are on YouTube,” based on the last 28 days. It can inform planning, but is not a universal best-time formula and is not connected to this chart.</p>
        <a href="https://support.google.com/youtube/answer/9314416?hl=en" target="_blank" rel="noopener noreferrer">YouTube Help: Understand your YouTube audience ↗</a>
        <p><strong>Live clock times:</strong> calculated in your browser using IANA time-zone rules through <code>Intl.DateTimeFormat</code>.</p>
      </section>
    </section>
  )
}
