import { useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Message = {
  id: string
  text: string
  time: string
  incoming?: boolean
  deleted?: boolean
}

type AppView = 'chat' | 'month' | 'day' | 'contact'

type CalendarEvent = {
  id: string
  day: number
  title: string
  startHour: number
  startMinute: number
  durationMinutes: number
  color: string
}

type Slot = {
  day: number
  hour: number
  minute: number
}

type BookingState = {
  stage: 'idle' | 'awaiting-date-time' | 'awaiting-slot-confirmation'
  suggestedSlots: Slot[]
}

const initialMessages: Message[] = [
  {
    id: 'm1',
    text: 'Hi! Welcome to GraceSoft Business. Ask us anything or type a booking request.',
    time: '2:11 PM',
    incoming: true,
  },
  {
    id: 'm2',
    text: 'I want to book an appointment.',
    time: '2:12 PM',
  },
  {
    id: 'm3',
    text: 'Happy to help. Please share your preferred date and time.',
    time: '2:13 PM',
    incoming: true,
  },
]

const monthName = 'April 2026'
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
const faqItems = [
  {
    keys: ['hours', 'open', 'closing', 'working'],
    answer: 'Our business hours are Mon to Fri, 9:00 AM to 5:00 PM.',
  },
  {
    keys: ['service', 'offer', 'do you do', 'what do you do'],
    answer:
      'We help clients with onboarding, implementation reviews, training, and support follow-ups.',
  },
  {
    keys: ['price', 'cost', 'quote', 'pricing'],
    answer: 'Pricing depends on scope. Share your needs and we can provide a tailored quote.',
  },
  {
    keys: ['location', 'where', 'address'],
    answer: 'We provide virtual consultations and in-office sessions by appointment.',
  },
]
const positiveSignals = ['great', 'awesome', 'thanks', 'thank you', 'good job', 'excellent']
const negativeSignals = ['bad', 'slow', 'poor', 'unhappy', 'disappointed', 'frustrated']
const inappropriateSignals = ['idiot', 'stupid', 'dumb', 'hate you', 'shut up']

const workingHourStart = 9
const workingHourEnd = 17
const appointmentDuration = 60

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

function slotToMinutes(hour: number, minute: number): number {
  return hour * 60 + minute
}

function isWithinWorkingHours(slot: Slot, durationMinutes: number): boolean {
  const start = slotToMinutes(slot.hour, slot.minute)
  const workStart = workingHourStart * 60
  const workEnd = workingHourEnd * 60
  return start >= workStart && start + durationMinutes <= workEnd
}

function isSlotAvailable(events: CalendarEvent[], slot: Slot, durationMinutes: number): boolean {
  const requestedStart = slotToMinutes(slot.hour, slot.minute)
  const requestedEnd = requestedStart + durationMinutes

  return !events
    .filter((event) => event.day === slot.day)
    .some((event) => {
      const eventStart = slotToMinutes(event.startHour, event.startMinute)
      const eventEnd = eventStart + event.durationMinutes
      return requestedStart < eventEnd && requestedEnd > eventStart
    })
}

function parseDateTime(text: string): Slot | null {
  const normalized = text.toLowerCase()

  const dateMatch = normalized.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/)
  const dayFromDate = dateMatch ? Number(dateMatch[1]) : null
  const monthFromDate = dateMatch ? Number(dateMatch[2]) : null

  const dayMonthNameMatch = normalized.match(/\b(\d{1,2})\s*(apr|april)\b/)
  const day = dayFromDate ?? (dayMonthNameMatch ? Number(dayMonthNameMatch[1]) : null)

  if (!day || day < 1 || day > daysInMonth) {
    return null
  }

  if (dateMatch && monthFromDate && monthFromDate !== 4) {
    return null
  }

  const time12hMatch = normalized.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/)
  const time24hMatch = normalized.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)

  if (time12hMatch) {
    const baseHour = Number(time12hMatch[1])
    const minute = time12hMatch[2] ? Number(time12hMatch[2]) : 0
    const meridiem = time12hMatch[3]
    const hour = (baseHour % 12) + (meridiem === 'pm' ? 12 : 0)
    return { day, hour, minute }
  }

  if (time24hMatch) {
    return {
      day,
      hour: Number(time24hMatch[1]),
      minute: Number(time24hMatch[2]),
    }
  }

  return null
}

function formatSlot(slot: Slot): string {
  return `${slot.day} Apr 2026, ${formatTime(slot.hour, slot.minute)}`
}

function getThreeAlternativeSlots(events: CalendarEvent[], preferredDay: number): Slot[] {
  const alternatives: Slot[] = []

  for (let dayOffset = 0; dayOffset < daysInMonth && alternatives.length < 3; dayOffset += 1) {
    const day = ((preferredDay + dayOffset - 1) % daysInMonth) + 1

    for (
      let minutes = workingHourStart * 60;
      minutes <= workingHourEnd * 60 - appointmentDuration;
      minutes += 30
    ) {
      const slot = { day, hour: Math.floor(minutes / 60), minute: minutes % 60 }

      if (isSlotAvailable(events, slot, appointmentDuration)) {
        alternatives.push(slot)
      }

      if (alternatives.length === 3) {
        return alternatives
      }
    }
  }

  return alternatives
}

function createAppointmentEvent(slot: Slot, id: string): CalendarEvent {
  const client = clientNames[Math.floor(Math.random() * clientNames.length)]
  const color = eventColors[Math.floor(Math.random() * eventColors.length)]

  return {
    id,
    day: slot.day,
    title: `Client Appointment - ${client}`,
    startHour: slot.hour,
    startMinute: slot.minute,
    durationMinutes: appointmentDuration,
    color,
  }
}

function processSlotRequest(
  events: CalendarEvent[],
  slot: Slot,
  messageId: string
): { replies: string[]; nextEvents: CalendarEvent[]; nextBooking: BookingState } {
  if (!isWithinWorkingHours(slot, appointmentDuration)) {
    return {
      replies: [
        'That time is outside our working hours (9:00 AM to 5:00 PM). Please choose another slot within business hours.',
      ],
      nextEvents: events,
      nextBooking: { stage: 'awaiting-date-time', suggestedSlots: [] },
    }
  }

  if (isSlotAvailable(events, slot, appointmentDuration)) {
    const bookedEvent = createAppointmentEvent(slot, messageId)

    return {
      replies: [
        `Booked successfully for ${formatSlot(slot)}. We have sent a confirmation to your WhatsApp thread.`,
      ],
      nextEvents: [...events, bookedEvent],
      nextBooking: { stage: 'idle', suggestedSlots: [] },
    }
  }

  const alternatives = getThreeAlternativeSlots(events, slot.day)
  const suggestionsText = alternatives
    .map((item, index) => `${index + 1}) ${formatSlot(item)}`)
    .join('  ')

  return {
    replies: [
      'That slot is already taken. Here are 3 available options:',
      suggestionsText,
      'Reply with 1, 2, or 3, or share your preferred date/time (preferred slot takes precedence).',
    ],
    nextEvents: events,
    nextBooking: { stage: 'awaiting-slot-confirmation', suggestedSlots: alternatives },
  }
}

function App() {
  const [view, setView] = useState<AppView>('chat')
  const [events, setEvents] = useState<CalendarEvent[]>(() => generateRandomEvents())
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [draftMessage, setDraftMessage] = useState('')
  const [bookingState, setBookingState] = useState<BookingState>({
    stage: 'idle',
    suggestedSlots: [],
  })
  const [selectedDay, setSelectedDay] = useState(24)
  const messageCounter = useRef(1000)

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

  const createMessage = (text: string, incoming = false, deleted = false): Message => {
    messageCounter.current += 1

    return {
      id: `m-${messageCounter.current}`,
      text,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      incoming,
      deleted,
    }
  }

  const submitCustomerMessage = (rawText: string) => {
    const text = rawText.trim()

    if (!text) {
      return
    }

    const normalized = text.toLowerCase()
    const isInappropriate = inappropriateSignals.some((signal) => normalized.includes(signal))

    if (isInappropriate) {
      setMessages((prev) => [...prev, createMessage('message deleted', false, true)])
      setDraftMessage('')
      return
    }

    let nextEvents = [...events]
    let nextBooking = { ...bookingState }
    const botReplies: string[] = []

    if (bookingState.stage === 'awaiting-slot-confirmation') {
      const preferredSlot = parseDateTime(normalized)
      const selectedIndexMatch = normalized.match(/\b([1-3])\b/)

      if (preferredSlot) {
        const result = processSlotRequest(nextEvents, preferredSlot, `e-live-${Date.now()}`)
        botReplies.push(...result.replies)
        nextEvents = result.nextEvents
        nextBooking = result.nextBooking
        setSelectedDay(preferredSlot.day)
      } else if (selectedIndexMatch) {
        const index = Number(selectedIndexMatch[1]) - 1
        const pickedSlot = bookingState.suggestedSlots[index]

        if (!pickedSlot) {
          botReplies.push('Please choose 1, 2, or 3, or share your preferred date/time.')
        } else {
          const result = processSlotRequest(nextEvents, pickedSlot, `e-live-${Date.now()}`)
          botReplies.push(...result.replies)
          nextEvents = result.nextEvents
          nextBooking = result.nextBooking
          setSelectedDay(pickedSlot.day)
        }
      } else {
        botReplies.push('Please confirm one of the suggested slots (1 to 3) or share a preferred slot.')
      }
    } else if (bookingState.stage === 'awaiting-date-time') {
      const slot = parseDateTime(normalized)

      if (!slot) {
        botReplies.push(
          'Please share a date/time like "24 Apr 2026 2:30 PM" or "24/4 14:30" so I can check availability.'
        )
      } else {
        const result = processSlotRequest(nextEvents, slot, `e-live-${Date.now()}`)
        botReplies.push(...result.replies)
        nextEvents = result.nextEvents
        nextBooking = result.nextBooking
        setSelectedDay(slot.day)
      }
    } else if (normalized.includes('book') || normalized.includes('appointment') || normalized.includes('schedule')) {
      const slot = parseDateTime(normalized)

      if (!slot) {
        botReplies.push(
          'Sure, please share your preferred date and time first so I can check calendar availability.'
        )
        nextBooking = { stage: 'awaiting-date-time', suggestedSlots: [] }
      } else {
        const result = processSlotRequest(nextEvents, slot, `e-live-${Date.now()}`)
        botReplies.push(...result.replies)
        nextEvents = result.nextEvents
        nextBooking = result.nextBooking
        setSelectedDay(slot.day)
      }
    } else if (negativeSignals.some((signal) => normalized.includes(signal))) {
      const followUpSlot = getThreeAlternativeSlots(nextEvents, selectedDay)[0]

      if (followUpSlot) {
        nextEvents = [
          ...nextEvents,
          {
            ...createAppointmentEvent(followUpSlot, `e-followup-${Date.now()}`),
            title: 'Feedback Follow-up Call',
          },
        ]
        setSelectedDay(followUpSlot.day)
      }

      botReplies.push(
        'Thank you for the constructive feedback. We have scheduled a follow-up so our team can improve your experience.'
      )
    } else if (positiveSignals.some((signal) => normalized.includes(signal))) {
      botReplies.push(
        'Thank you for the kind feedback. If possible, would you mind leaving us a Google review? It helps our business a lot.'
      )
    } else {
      const matchedFaq = faqItems.find((item) =>
        item.keys.some((key) => normalized.includes(key))
      )

      if (matchedFaq) {
        botReplies.push(matchedFaq.answer)
      } else if (normalized.includes('?')) {
        botReplies.push(
          'Happy to help. Ask about hours, pricing, services, location, bookings, or feedback and I will guide you.'
        )
      } else {
        botReplies.push(
          'Thanks for reaching out. Ask a question, book an appointment, or share feedback and I can assist right away.'
        )
      }
    }

    setMessages((prev) => {
      const outgoing = createMessage(text)
      const incoming = botReplies.map((reply) => createMessage(reply, true))
      return [...prev, outgoing, ...incoming]
    })
    setEvents(nextEvents)
    setBookingState(nextBooking)
    setDraftMessage('')
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    submitCustomerMessage(draftMessage)
  }

  const runScenario = (
    scenario:
      | 'faq'
      | 'book-missing-time'
      | 'book-with-time'
      | 'book-unavailable'
      | 'positive-feedback'
      | 'negative-feedback'
      | 'inappropriate'
  ) => {
    if (scenario === 'faq') {
      submitCustomerMessage('What are your working hours and services?')
      return
    }

    if (scenario === 'book-missing-time') {
      submitCustomerMessage('I want to book an appointment.')
      return
    }

    if (scenario === 'book-with-time') {
      submitCustomerMessage('Can I book on 26 Apr 2026 at 11:00 AM?')
      return
    }

    if (scenario === 'book-unavailable') {
      const occupied = events[0]

      if (occupied) {
        submitCustomerMessage(
          `Please schedule me on ${occupied.day} Apr 2026 at ${formatTime(
            occupied.startHour,
            occupied.startMinute
          )}`
        )
      }
      return
    }

    if (scenario === 'positive-feedback') {
      submitCustomerMessage('Great service, thank you for the smooth support.')
      return
    }

    if (scenario === 'negative-feedback') {
      submitCustomerMessage('I am disappointed with the slow response yesterday.')
      return
    }

    submitCustomerMessage('You are stupid')
  }

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
        <button
          type="button"
          className={`view-tab ${view === 'contact' ? 'active' : ''}`}
          onClick={() => setView('contact')}
        >
          Contact
        </button>
      </nav>

      <section className="scenario-widget" aria-label="Scenario simulator">
        <p className="scenario-title">Quick Scenario Tester</p>
        <div className="scenario-chip-list">
          <button type="button" className="scenario-chip" onClick={() => runScenario('faq')}>
            FAQ Enquiry
          </button>
          <button
            type="button"
            className="scenario-chip"
            onClick={() => runScenario('book-missing-time')}
          >
            Book (No Date/Time)
          </button>
          <button
            type="button"
            className="scenario-chip"
            onClick={() => runScenario('book-with-time')}
          >
            Book (With Slot)
          </button>
          <button
            type="button"
            className="scenario-chip"
            onClick={() => runScenario('book-unavailable')}
          >
            Book (Unavailable)
          </button>
        </div>
      </section>

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
                      <p className={message.deleted ? 'deleted-text' : ''}>{message.text}</p>
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
              onSubmit={handleSubmit}
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
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
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
                  <button
                    type="button"
                    key={`cell-${index}`}
                    className={`month-cell ${day === selectedDay ? 'is-selected' : ''}`}
                    role="gridcell"
                    aria-label={day ? `April ${day}` : 'Empty day'}
                    onClick={() => {
                      if (day) {
                        setSelectedDay(day)
                        setView('day')
                      }
                    }}
                    disabled={!day}
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
                  </button>
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

        {view === 'contact' && (
          <section className="contact-view" aria-label="Contact form view">
            <iframe
              src="https://capture.gracesoft.dev/form/frm_fb7f4e12d58ce1ba6f385654e421df72?surface=none"
              title="GraceSoft contact form"
              className="contact-iframe"
            />
          </section>
        )}
      </section>
    </main>
  )
}

export default App
