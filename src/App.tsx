import { useMemo, useState } from 'react'
import './App.css'

type Message = {
  id: string
  text: string
  time: string
  incoming?: boolean
}

type AppView = 'chat' | 'month' | 'day'

type CalendarEvent = {
  id: string
  day: number
  title: string
  startHour: number
  startMinute: number
  durationMinutes: number
  color: string
}

const messages: Message[] = [
  {
    id: 'm1',
    text: 'Hey, are we still on for the 3:00 product review?',
    time: '2:11 PM',
    incoming: true,
  },
  {
    id: 'm2',
    text: 'Yep. I am bringing the updated wireframes and notes.',
    time: '2:12 PM',
  },
  {
    id: 'm3',
    text: 'Perfect. Send me your latest screenshot before we start.',
    time: '2:13 PM',
    incoming: true,
  },
  {
    id: 'm4',
    text: 'Shared in the group just now. Also added dark mode tweaks.',
    time: '2:14 PM',
  },
  {
    id: 'm5',
    text: 'Looks clean. Lets do final polish after standup.',
    time: '2:15 PM',
    incoming: true,
  },
]

const monthName = 'April 2026'
const selectedDay = 24
const daysInMonth = 30
const monthStartWeekday = 3
const eventTitles = [
  'Initial Consultation',
  'Product Demo Booking',
  'Onboarding Session',
  'Renewal Discussion',
  'Support Follow-up',
  'Implementation Review',
  'Quarterly Check-in',
  'Training Appointment',
  'Contract Walkthrough',
  'Requirements Workshop',
]
const clientNames = [
  'Acme Retail',
  'Northwind Labs',
  'BrightWave Co.',
  'Orchid Dental',
  'Summit Realty',
  'Maple Legal',
  'Bluebird Cafe',
  'Peak Fitness',
]
const eventColors = ['event-blue', 'event-green', 'event-orange', 'event-purple']

function createSeededRandom(seed: number) {
  let value = seed

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

function generateRandomEvents(): CalendarEvent[] {
  const rand = createSeededRandom(20260424)
  const events: CalendarEvent[] = []

  for (let day = 1; day <= daysInMonth; day += 1) {
    const eventsPerDay = 1 + Math.floor(rand() * 3)

    for (let index = 0; index < eventsPerDay; index += 1) {
      const startHour = 8 + Math.floor(rand() * 11)
      const startMinute = rand() > 0.5 ? 30 : 0
      const durationMinutes = [30, 45, 60, 90][Math.floor(rand() * 4)]
      const appointmentType = eventTitles[Math.floor(rand() * eventTitles.length)]
      const client = clientNames[Math.floor(rand() * clientNames.length)]
      const color = eventColors[Math.floor(rand() * eventColors.length)]

      events.push({
        id: `e-${day}-${index}`,
        day,
        title: `${appointmentType} - ${client}`,
        startHour,
        startMinute,
        durationMinutes,
        color,
      })
    }
  }

  return events.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day
    if (a.startHour !== b.startHour) return a.startHour - b.startHour
    return a.startMinute - b.startMinute
  })
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  const displayMinute = minute === 0 ? '00' : `${minute}`
  return `${displayHour}:${displayMinute} ${period}`
}

function App() {
  const [view, setView] = useState<AppView>('chat')
  const events = useMemo(() => generateRandomEvents(), [])

  const selectedDayEvents = useMemo(
    () => events.filter((event) => event.day === selectedDay),
    [events]
  )

  const monthCells = useMemo(() => {
    const cells: Array<number | null> = []

    for (let index = 0; index < monthStartWeekday; index += 1) {
      cells.push(null)
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(day)
    }

    while (cells.length % 7 !== 0) {
      cells.push(null)
    }

    return cells
  }, [])

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <main className="chat-shell" aria-label="Messaging and calendar views">
      <nav className="view-switcher" aria-label="View switcher">
        <button
          type="button"
          className={`view-tab ${view === 'chat' ? 'active' : ''}`}
          onClick={() => setView('chat')}
        >
          Chat
        </button>
        <button
          type="button"
          className={`view-tab ${view === 'month' ? 'active' : ''}`}
          onClick={() => setView('month')}
        >
          Month
        </button>
        <button
          type="button"
          className={`view-tab ${view === 'day' ? 'active' : ''}`}
          onClick={() => setView('day')}
        >
          Day
        </button>
      </nav>

      <section className="phone-frame">
        {view === 'chat' && (
          <header className="chat-header" aria-label="Conversation header">
            <button type="button" className="icon-button" aria-label="Go back">
              <span aria-hidden="true">&#x2039;</span>
            </button>

            <div className="contact-avatar" aria-hidden="true">
              GB
            </div>

            <div className="contact-meta">
              <p className="contact-name">GraceSoft Business</p>
              <p className="contact-status">Typically replies in an hour</p>
            </div>

            <div className="header-actions" aria-hidden="true">
              <button type="button" className="icon-button" aria-label="Video call">
                <span>◉</span>
              </button>
              <button type="button" className="icon-button" aria-label="Call">
                <span>&#9742;</span>
              </button>
            </div>
          </header>
        )}

        {view === 'chat' && (
          <>
            <section className="chat-body" aria-label="Messages">
              <p className="date-pill">Today</p>

              <ul className="message-list" aria-live="polite">
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className={`message-row ${message.incoming ? 'incoming' : 'outgoing'}`}
                  >
                    <article className="bubble" aria-label={`${message.time} message`}>
                      <p>{message.text}</p>
                      <footer className="bubble-meta">
                        <time>{message.time}</time>
                        {!message.incoming && <span aria-label="Delivered">&#10003;&#10003;</span>}
                      </footer>
                    </article>
                  </li>
                ))}
              </ul>
            </section>

            <form
              className="composer"
              onSubmit={(event) => event.preventDefault()}
              aria-label="Send message"
            >
              <button type="button" className="composer-icon" aria-label="Attach media">
                +
              </button>

              <label className="composer-input-wrap">
                <span className="sr-only">Message</span>
                <input
                  className="composer-input"
                  type="text"
                  placeholder="Message"
                  aria-label="Type your message"
                />
              </label>

              <button type="submit" className="send-button" aria-label="Send">
                &#10148;
              </button>
            </form>
          </>
        )}

        {view === 'month' && (
          <section className="calendar-view" aria-label="Month calendar">
            <header className="calendar-topbar">
              <p className="calendar-title">{monthName}</p>
              <p className="calendar-subtitle">Client bookings this month</p>
            </header>

            <div className="month-grid" role="grid" aria-label="Monthly events grid">
              {weekdayLabels.map((weekday) => (
                <span key={weekday} className="weekday" role="columnheader">
                  {weekday}
                </span>
              ))}

              {monthCells.map((day, index) => {
                const dayEvents = day ? events.filter((event) => event.day === day).slice(0, 3) : []

                return (
                  <article
                    key={`cell-${index}`}
                    className={`month-cell ${day === selectedDay ? 'is-selected' : ''}`}
                    role="gridcell"
                    aria-label={day ? `April ${day}` : 'Empty day'}
                  >
                    {day && (
                      <>
                        <p className="month-day-number">{day}</p>
                        <ul className="month-event-list" aria-label={`Events for day ${day}`}>
                          {dayEvents.map((event) => (
                            <li key={event.id} className={`month-event-dot ${event.color}`}>
                              {event.title}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {view === 'day' && (
          <section className="calendar-view day-view" aria-label="Day calendar">
            <header className="calendar-topbar">
              <p className="calendar-title">Friday, April {selectedDay}</p>
              <p className="calendar-subtitle">Appointments booked by clients</p>
            </header>

            <ul className="day-event-list" aria-label="Events for selected day">
              {selectedDayEvents.map((event) => (
                <li key={event.id} className={`day-event-card ${event.color}`}>
                  <p className="day-event-time">
                    {formatTime(event.startHour, event.startMinute)}
                  </p>
                  <h2 className="day-event-title">{event.title}</h2>
                  <p className="day-event-meta">{event.durationMinutes} min</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
