function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? ''
}

export function clockParts(date: Date, timezone: string, showSeconds = false) {
  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    ...(showSeconds ? { second: '2-digit' as const } : {}),
    hour12: true,
  }).formatToParts(date)
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).formatToParts(date)
  const hour = Number(getPart(new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date), 'hour'))

  return {
    time: `${getPart(timeParts, 'hour')}:${getPart(timeParts, 'minute')}${showSeconds ? `:${getPart(timeParts, 'second')}` : ''}`,
    period: getPart(timeParts, 'dayPeriod'),
    date: `${getPart(dateParts, 'weekday')}, ${getPart(dateParts, 'month')} ${getPart(dateParts, 'day')}`,
    hour,
  }
}

export function offsetLabel(date: Date, timezone: string) {
  const offset = getPart(new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  }).formatToParts(date), 'timeZoneName')
  return offset === 'GMT' ? 'UTC+0' : offset.replace('GMT', 'UTC')
}
