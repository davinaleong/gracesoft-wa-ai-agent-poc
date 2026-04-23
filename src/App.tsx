import './App.css'

type Message = {
  id: string
  text: string
  time: string
  incoming?: boolean
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

function App() {
  return (
    <main className="chat-shell" aria-label="WhatsApp like chat screen">
      <section className="phone-frame">
        <header className="chat-header" aria-label="Conversation header">
          <button type="button" className="icon-button" aria-label="Go back">
            <span aria-hidden="true">&#x2039;</span>
          </button>

          <div className="contact-avatar" aria-hidden="true">
            GN
          </div>

          <div className="contact-meta">
            <p className="contact-name">Grace N.</p>
            <p className="contact-status">online</p>
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
      </section>
    </main>
  )
}

export default App
