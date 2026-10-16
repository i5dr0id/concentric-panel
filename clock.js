// Concentric Panel: a ring clock on the left edge with a calendar panel, in
// plain JavaScript. The seconds ring sweeps every frame; the minute ring rolls
// to each new minute through a CSS transition.

const STEP = 6 // degrees per unit on a 60-unit ring
const SVG = 'http://www.w3.org/2000/svg'

// Ring sizes are in design units; the dial is scaled so its outer edge spans the
// full screen height and reaches most of the way to the panel.
const MINUTES = { labelRadius: 178, tickRadius: 202 }
const SECONDS = { labelRadius: 256, tickRadius: 286 }
const OUTER_RADIUS = SECONDS.tickRadius + 22
const WIDTH_REACH = 0.36

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const IDLE_MS = 2500

const $ = (selector) => document.querySelector(selector)
const pad = (n) => String(n).padStart(2, '0')

/**
 * Builds a ring of 60 ticks and its labels. Labels counter-rotate by the ring's
 * `--turn` so they stay upright as it turns.
 */
function createRing({ labelRadius, tickRadius }, className) {
  const ring = document.createElement('div')
  ring.className = `ring ${className}`

  const size = (tickRadius + 30) * 2
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('class', 'ticks')
  svg.setAttribute('width', size)
  svg.setAttribute('height', size)
  svg.setAttribute('viewBox', `${-size / 2} ${-size / 2} ${size} ${size}`)
  svg.setAttribute('aria-hidden', 'true')

  const labels = []
  for (let v = 0; v < 60; v++) {
    const major = v % 5 === 0
    const line = document.createElementNS(SVG, 'line')
    line.setAttribute('x1', tickRadius)
    line.setAttribute('x2', tickRadius + (major ? 22 : 9))
    line.setAttribute('transform', `rotate(${-v * STEP})`)
    if (major) line.setAttribute('class', 'major')
    svg.append(line)

    const label = document.createElement('span')
    label.className = 'label'
    label.style.transform = `rotate(${-v * STEP}deg) translateX(${labelRadius}px) rotate(calc(${v * STEP}deg - var(--turn)))`
    label.style.opacity = major ? 1 : 0
    const text = document.createElement('span')
    text.textContent = pad(v)
    label.append(text)
    labels.push(label)
  }

  ring.append(svg, ...labels)
  return { el: ring, labels }
}

/** Shows multiples of 5 plus the active value; hides labels crowding it. */
function highlight(labels, active) {
  labels.forEach((label, v) => {
    const distance = Math.min(Math.abs(v - active), 60 - Math.abs(v - active))
    const isActive = v === active
    label.classList.toggle('active', isActive)
    label.style.opacity = isActive || (v % 5 === 0 && distance >= 3) ? 1 : 0
  })
}

/** Day cells for the month containing `date`, Monday first, padded with blanks. */
function monthCells(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const lead = (new Date(year, month, 1).getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1)
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((today - start) / 864e5) + 1
}

function daysInYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365
}

// --- Set up --------------------------------------------------------------------

const minutes = createRing(MINUTES, 'minutes')
const seconds = createRing(SECONDS, 'seconds')
$('.rings').append(minutes.el, seconds.el)

const dial = $('.dial')
function fit() {
  const scale = Math.max(innerHeight / 2, innerWidth * WIDTH_REACH) / OUTER_RADIUS
  dial.style.scale = scale
}
fit()
addEventListener('resize', fit)

// Rotations count from page load, starting at the current value, so angles stay
// small (epoch-based angles lose float precision) and never spin backwards.
const loaded = Date.now()
const startMinutes = Math.floor(loaded / 60000) - new Date(loaded).getMinutes()
const secondsOffset = (loaded % 60000) / 1000

// --- Seconds: every frame --------------------------------------------------------

function sweep() {
  const turn = (secondsOffset + (Date.now() - loaded) / 1000) * STEP
  seconds.el.style.setProperty('--turn', `${turn}deg`)
  requestAnimationFrame(sweep)
}
sweep()

// --- Everything else: once a second ---------------------------------------------

let shown = {}

function tick() {
  const now = new Date()
  const minute = now.getMinutes()

  if (minute !== shown.minute) {
    const turn = (Math.floor(now.getTime() / 60000) - startMinutes) * STEP
    minutes.el.style.setProperty('--turn', `${turn}deg`)
    highlight(minutes.labels, minute)
    $('.hour').textContent = pad(now.getHours())
    $('main').setAttribute('aria-label', now.toLocaleTimeString())

    const dayProgress = (now.getHours() * 60 + minute) / 1440
    $('[data-progress="day"]').style.width = `${dayProgress * 100}%`
    $('[data-label="day"]').textContent = `${Math.round(dayProgress * 100)}%`
  }

  const dateKey = now.toDateString()
  if (dateKey !== shown.date) {
    renderDate(now)
  }

  shown = { minute, date: dateKey }
  setTimeout(tick, 1000 - now.getMilliseconds())
}

function renderDate(now) {
  const monthName = now.toLocaleDateString('en-GB', { month: 'long' })
  $('.weekday').textContent = now.toLocaleDateString('en-GB', { weekday: 'long' })
  $('.full-date').textContent = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  $('.calendar').setAttribute('aria-label', `${monthName} ${now.getFullYear()}`)
  $('.calendar-title').textContent = monthName.toUpperCase()

  const grid = $('.calendar-grid')
  grid.replaceChildren(
    ...WEEKDAYS.map((d) => Object.assign(document.createElement('span'), { className: 'calendar-head', textContent: d })),
    ...monthCells(now).map((d) => {
      const cell = document.createElement('span')
      cell.textContent = d ?? ''
      if (d === now.getDate()) cell.className = 'today'
      return cell
    }),
  )

  const total = daysInYear(now.getFullYear())
  const today = dayOfYear(now)
  $('[data-progress="year"]').style.width = `${(today / total) * 100}%`
  $('[data-label="year"]').textContent = `${today}/${total}`
}

tick()

// --- Hide the cursor when idle ---------------------------------------------------

let idleTimer
function wake() {
  document.body.classList.remove('idle')
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => document.body.classList.add('idle'), IDLE_MS)
}
addEventListener('pointermove', wake)
wake()
