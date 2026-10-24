import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  Compass,
  Download,
  FileText,
  Globe,
  Layers,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Minus,
  Monitor,
  Plus,
  Smartphone,
  TrendingUp,
  X,
} from "lucide-react"
import {
  Button,
  Field,
  Heading,
  Link,
  SelectField,
  TextAreaField,
} from "./components/ui"
import { faqs, processSteps, services } from "./content"

const pages = ["Home", "About", "Services", "Contact"] as const
type Page = typeof pages[number]
type ModalName = "downloads" | "notes" | "privacy" | null

function pageFromHash(): Page {
  return (
    pages.find((page) => `#${page.toLowerCase()}` === window.location.hash) ??
    "Home"
  )
}

function Brand({
  light = false,
  onClick,
}: {
  light?: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href="#home"
      className={`brand ${light ? "brand--light" : ""}`}
      onClick={(event) => {
        if (onClick) {
          event.preventDefault()
          onClick()
        }
      }}
      aria-label="Northline home"
    >
      <span className="brand-symbol" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        northline<span className="brand-period">.</span>
      </span>
    </Link>
  )
}

function Eyebrow({
  children,
  light = false,
}: {
  children: ReactNode
  light?: boolean
}) {
  return (
    <p className={`eyebrow ${light ? "eyebrow--light" : ""}`}>
      <span />
      {children}
    </p>
  )
}

function Photo({
  src,
  alt,
  className = "",
  label = "Image placeholder",
}: {
  src: string
  alt: string
  className?: string
  label?: string
}) {
  return (
    <div className={`photo ${className}`} data-placeholder={label}>
      <img
        src={src}
        alt={alt}
        loading={className.includes("hero") ? "eager" : "lazy"}
      />
    </div>
  )
}

const ServiceIcon = ({ index }: { index: number }) => {
  const Icon = [Compass, Layers, TrendingUp][index]
  return <Icon size={27} strokeWidth={1.35} aria-hidden="true" />
}

function ServiceCards({ onExplore }: { onExplore: (id?: string) => void }) {
  return (
    <div className="service-grid">
      {services.map((service, index) => (
        <article className="service-card" key={service.id}>
          <div className="service-card-top">
            <span className="service-icon">
              <ServiceIcon index={index} />
            </span>
            <span className="index-number">/{service.number}</span>
          </div>
          <Heading level={3}>{service.title}</Heading>
          <p>{service.description}</p>
          <Button variant="text" onClick={() => onExplore(service.id)}>
            Find your way forward <ArrowUpRight size={17} />
          </Button>
        </article>
      ))}
    </div>
  )
}

function CallToAction({ onContact }: { onContact: () => void }) {
  return (
    <section className="cta-section section-shell">
      <div className="cta-content">
        <Eyebrow light>LET’S MOVE FORWARD, TOGETHER</Eyebrow>
        <Heading>
          Your next chapter starts
          <br />
          with a conversation.
        </Heading>
        <p>No big pitch. Just good people and a fresh perspective.</p>
        <Button variant="light" onClick={onContact}>
          Let’s talk about your business <ArrowUpRight size={18} />
        </Button>
      </div>
      <div className="cta-compass" aria-hidden="true">
        <Compass />
      </div>
    </section>
  )
}

function Home({
  navigate,
  explore,
}: {
  navigate: (page: Page) => void
  explore: (id?: string) => void
}) {
  return (
    <>
      <section className="hero section-shell">
        <div className="hero-copy">
          <Eyebrow>A FRESH PERSPECTIVE FOR YOUR BUSINESS</Eyebrow>
          <Heading level={1}>
            Clarity for today.
            <br />
            Confidence for
            <br />
            <em>what’s next.</em>
          </Heading>
          <p className="hero-description">
            Good businesses don’t stand still. We help you find your direction,
            build on your strengths, and move forward with purpose.
          </p>
          <div className="hero-actions">
            <Button onClick={() => navigate("Contact")}>
              Let’s find your next step <ArrowUpRight size={18} />
            </Button>
            <Button variant="text" onClick={() => explore()}>
              Explore our services <ArrowRight size={17} />
            </Button>
          </div>
          <div className="hero-footnote">
            <span className="small-check">
              <Check size={12} strokeWidth={2} />
            </span>
            Independent thinking. Personal partnership.
          </div>
        </div>
        <div className="hero-visual">
          <Photo
            src="/images/team.jpg"
            alt="A small team collaborating around a table in a light-filled workspace"
            className="hero-photo"
            label="Team collaboration image"
          />
          <div className="hero-image-caption">
            <span>
              BIG IDEAS.
              <br />
              HUMAN CONNECTIONS.
            </span>
            <ArrowUpRight size={29} strokeWidth={1.2} />
          </div>
          <div className="perspective-card">
            <span className="perspective-icon">
              <Compass size={29} strokeWidth={1.2} />
            </span>
            <div>
              <strong>
                A little perspective.
                <br />A world of possibility.
              </strong>
              <span>THAT’S THE NORTHLINE WAY</span>
            </div>
          </div>
          <span className="image-side-label">
            A CLEARER PATH FORWARD — NORTHLINE
          </span>
        </div>
      </section>

      <section
        className="partners section-shell"
        aria-label="Illustrative partner brands"
      >
        <p>
          For ambitious businesses.
          <br />
          <strong>And the people behind them.</strong>
        </p>
        <div className="partner-logos">
          <span className="partner-evergreen">
            <Leaf size={23} />
            evergreen
          </span>
          <span className="partner-layers">
            <Layers size={23} />
            Layers
          </span>
          <span className="partner-circles">
            <span aria-hidden="true">◌</span>Circles
          </span>
          <span className="partner-goodwell">
            goodwell<span>®</span>
          </span>
        </div>
      </section>

      <section className="services-section section-shell">
        <div className="section-intro">
          <div>
            <Eyebrow>HOW WE HELP</Eyebrow>
            <Heading>
              Big-picture thinking.
              <br />
              <em>Real-world solutions.</em>
            </Heading>
          </div>
          <div className="section-intro-aside">
            <p>
              A clear strategy, a stronger presence, a better way of working.
              The right support makes all the difference.
            </p>
            <Button variant="text" onClick={() => explore()}>
              Discover our services <ArrowUpRight size={17} />
            </Button>
          </div>
        </div>
        <ServiceCards onExplore={explore} />
      </section>

      <section className="about-band">
        <div className="about-preview section-shell">
          <Photo
            src="/images/studio.jpg"
            alt="Sunlight falling across a thoughtfully designed meeting room"
            label="Our studio image"
          />
          <div className="about-preview-copy">
            <Eyebrow>A PARTNER, NOT JUST AN ADVISOR</Eyebrow>
            <Heading>
              On your side.
              <br />
              <em>Every step of the way.</em>
            </Heading>
            <p>
              Behind every business is a person with a vision. We’re here to
              understand yours — and help you bring it to life.
            </p>
            <p>
              We’re an independent team of thinkers, problem-solvers, and doers.
              No jargon. No one-size-fits-all answers. Just thoughtful work,
              honest conversations, and a genuine investment in your success.
            </p>
            <Button variant="text" onClick={() => navigate("About")}>
              A little more about us <ArrowUpRight size={17} />
            </Button>
          </div>
        </div>
      </section>

      <section className="process-section section-shell">
        <div className="process-heading">
          <Eyebrow>SIMPLE BY DESIGN</Eyebrow>
          <Heading>
            Good things start
            <br />
            with understanding.
          </Heading>
        </div>
        <div className="process-list">
          {processSteps.map((step) => (
            <div className="process-item" key={step.number}>
              <span className="index-number">{step.number}</span>
              <div>
                <Heading level={3}>{step.title}</Heading>
                <p>{step.text}</p>
              </div>
              <ArrowUpRight size={21} strokeWidth={1.2} />
            </div>
          ))}
        </div>
      </section>
      <CallToAction onContact={() => navigate("Contact")} />
    </>
  )
}

function About({ onContact }: { onContact: () => void }) {
  return (
    <>
      <section className="page-intro section-shell">
        <Eyebrow>THIS IS NORTHLINE</Eyebrow>
        <Heading level={1}>
          Good people.
          <br />
          <em>A shared sense of purpose.</em>
        </Heading>
        <p>
          We believe the best work happens when people understand each other.
          That’s where we start. Every single time.
        </p>
      </section>
      <section className="about-story section-shell">
        <Photo
          src="/images/team.jpg"
          alt="Independent professionals sharing ideas and working together"
          label="Our team image"
        />
        <div>
          <Eyebrow>INDEPENDENT IN SPIRIT. INVESTED IN YOU.</Eyebrow>
          <Heading>
            A fresh set of eyes.
            <br />A genuine commitment.
          </Heading>
          <p>
            Northline was built around a simple idea: ambitious businesses
            deserve a partner who cares as much as they do.
          </p>
          <p>
            We bring strategy, creativity, and practical thinking together to
            help you see the bigger picture — and take the next small step. We
            work alongside you, not at arm’s length.
          </p>
          <p>
            Whether you’re finding your feet, changing direction, or ready to
            grow, we make space for honest conversations and thoughtful
            solutions.
          </p>
          <div className="signature">
            Thoughtfully yours,<span>The Northline team</span>
          </div>
        </div>
      </section>
      <section className="values-section about-band">
        <div className="section-shell">
          <Eyebrow>WHAT GUIDES US</Eyebrow>
          <Heading>Our way of doing things.</Heading>
          <div className="values-grid">
            {[
              {
                title: "People before process.",
                text: "Your story, your team, and your ambitions shape everything we do.",
                icon: <Leaf />,
              },
              {
                title: "Clarity over complexity.",
                text: "We make the complicated feel simple, without losing sight of the details.",
                icon: <Compass />,
              },
              {
                title: "Progress with purpose.",
                text: "Good work isn’t just about looking ahead. It’s about moving in the right direction.",
                icon: <TrendingUp />,
              },
            ].map((value) => (
              <article key={value.title}>
                <span className="value-icon">{value.icon}</span>
                <Heading level={3}>{value.title}</Heading>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="philosophy section-shell">
        <span className="quote-mark" aria-hidden="true">
          “
        </span>
        <Heading>
          Progress isn’t always about doing more.
          <br />
          <em>Sometimes it starts with seeing things differently.</em>
        </Heading>
        <Eyebrow>THE NORTHLINE PHILOSOPHY</Eyebrow>
      </section>
      <CallToAction onContact={onContact} />
    </>
  )
}

function Services({
  selected,
  onContact,
}: {
  selected: string | null
  onContact: () => void
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    if (selected)
      requestAnimationFrame(() =>
        document
          .getElementById(`service-${selected}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      )
  }, [selected])

  return (
    <>
      <section className="page-intro section-shell">
        <Eyebrow>THOUGHTFUL SUPPORT. MEANINGFUL PROGRESS.</Eyebrow>
        <Heading level={1}>
          The right perspective.
          <br />
          <em>The right way forward.</em>
        </Heading>
        <p>
          From the big picture to the everyday details, we help connect the
          dots. Explore how we can support your next chapter.
        </p>
      </section>
      <section className="service-details section-shell">
        {services.map((service, index) => (
          <article
            className="service-detail"
            id={`service-${service.id}`}
            key={service.id}
          >
            <div className="service-detail-heading">
              <span className="service-icon">
                <ServiceIcon index={index} />
              </span>
              <span className="index-number">SERVICE / {service.number}</span>
              <Heading>{service.title}</Heading>
              <p>{service.description}</p>
              <Button variant="text" onClick={onContact}>
                Let’s talk {service.title.toLowerCase()}{" "}
                <ArrowUpRight size={17} />
              </Button>
            </div>
            <div className="service-detail-body">
              <p>{service.detail}</p>
              <ul>
                {service.points.map((point) => (
                  <li key={point}>
                    <Check size={17} />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="service-outcome">
                <span>THE WAY FORWARD</span>
                <p>{service.outcome}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
      <section className="faq-section section-shell">
        <div>
          <Eyebrow>A FEW GOOD QUESTIONS</Eyebrow>
          <Heading>A little more clarity.</Heading>
          <p>
            Still wondering about something?
            <br />
            We’re always happy to talk.
          </p>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <article
              className={`faq-item ${openFaq === index ? "is-open" : ""}`}
              key={faq.question}
            >
              <Button
                variant="text"
                aria-expanded={openFaq === index}
                aria-controls={`faq-${index}`}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                {faq.question}
                {openFaq === index ? <Minus size={18} /> : <Plus size={18} />}
              </Button>
              <div id={`faq-${index}`} hidden={openFaq !== index}>
                <p>{faq.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <CallToAction onContact={onContact} />
    </>
  )
}

function Contact() {
  const [complete, setComplete] = useState(false)
  const [sender, setSender] = useState("")

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setSender(
      String(data.get("name") ?? "")
        .trim()
        .split(" ")[0],
    )
    setComplete(true)
  }

  return (
    <>
      <section className="page-intro section-shell">
        <Eyebrow>EVERY GOOD PARTNERSHIP STARTS SOMEWHERE</Eyebrow>
        <Heading level={1}>
          Let’s talk about
          <br />
          <em>what’s next for you.</em>
        </Heading>
        <p>
          A new idea, a tricky challenge, or a question you’ve been sitting on.
          We’d love to hear it.
        </p>
      </section>
      <section className="contact-section section-shell">
        <div className="contact-info">
          <Heading>
            A conversation.
            <br />
            Not a commitment.
          </Heading>
          <p>
            Tell us a little about your business and where you’d like to go.
            We’ll take it from there, together.
          </p>
          <div className="contact-method">
            <Mail size={21} />
            <div>
              <span>DROP US A LINE</span>
              <p>hello@northline.example</p>
            </div>
          </div>
          <div className="contact-method">
            <MapPin size={21} />
            <div>
              <span>BASED IN LONDON. THINKING BEYOND.</span>
              <p>Working with ambitious people, everywhere.</p>
            </div>
          </div>
          <div className="contact-note">
            <span className="availability-dot" />
            <p>
              Good conversations take a little time.
              <br />
              <strong>We usually reply within two working days.</strong>
            </p>
          </div>
          <span className="concept-note">
            Illustrative contact details for this design concept.
          </span>
        </div>
        <div className="contact-form-card">
          {complete ? (
            <div className="form-success" role="status">
              <span>
                <CheckCheck size={32} />
              </span>
              <Eyebrow>A GREAT FIRST STEP</Eyebrow>
              <Heading>
                Thanks for saying
                <br />
                hello, {sender}.
              </Heading>
              <p>
                This is an interactive lab prototype. Your message has not been
                sent or stored — this screen demonstrates the completed form
                experience.
              </p>
              <Button variant="secondary" onClick={() => setComplete(false)}>
                Back to the form <ArrowRight size={17} />
              </Button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <Heading level={3}>A little about you.</Heading>
              <p className="form-intro">
                The first step towards something good.
              </p>
              <div className="form-grid">
                <Field
                  label="Your name"
                  id="contact-name"
                  name="name"
                  placeholder="Alex Morgan"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
                <Field
                  label="Email address"
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="alex@yourbusiness.com"
                  autoComplete="email"
                  required
                  maxLength={200}
                />
                <Field
                  label="Business name"
                  id="contact-business"
                  name="business"
                  placeholder="Your business"
                  autoComplete="organization"
                  maxLength={150}
                />
                <SelectField
                  label="How can we help?"
                  id="contact-service"
                  name="service"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a service
                  </option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                  <option value="unsure">I’m not sure yet</option>
                </SelectField>
                <TextAreaField
                  label="What’s on your mind?"
                  id="contact-message"
                  name="message"
                  placeholder="Tell us a little about your goals, ideas, or challenges…"
                  rows={4}
                  required
                  maxLength={3000}
                />
              </div>
              <div className="form-bottom">
                <p>
                  Just between us. Your details stay private.
                  <br />
                  <span>Demo only — nothing is sent or stored.</span>
                </p>
                <Button type="submit">
                  Start the conversation <ArrowUpRight size={18} />
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
      <section className="contact-photo section-shell">
        <Photo
          src="/images/studio.jpg"
          alt="An inviting, sunlit space for your next conversation"
          label="Meeting space image"
        />
        <div>
          <Eyebrow light>THERE’S ALWAYS ROOM FOR A GOOD CONVERSATION</Eyebrow>
          <Heading>Fresh coffee. Fresh thinking.</Heading>
        </div>
      </section>
    </>
  )
}

function Modal({
  name,
  close,
}: {
  name: Exclude<ModalName, null>
  close: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={close}
      onClick={(event) => {
        if (event.target === ref.current) close()
      }}
    >
      <Button
        variant="icon"
        className="modal-close"
        onClick={close}
        aria-label="Close dialog"
      >
        <X size={21} />
      </Button>
      {name === "downloads" ? (
        <>
          <span className="modal-icon">
            <Layers size={26} strokeWidth={1.4} />
          </span>
          <Eyebrow>LAB QUESTION 02 · DESIGN HANDOFF</Eyebrow>
          <Heading id="modal-title">
            Made to be
            <br />
            <em>made your own.</em>
          </Heading>
          <p>
            Your complete mockup package: four pages, desktop and mobile
            layouts, low-fidelity wireframes, and a reusable design system.
          </p>
          <ul className="download-checklist">
            <li>
              <Check size={16} />
              16 editable screen layouts + a design system page
            </li>
            <li>
              <Check size={16} />
              Figma importer with native frames, text & components
            </li>
            <li>
              <Check size={16} />
              Editable SVG layouts, images & lab answer
            </li>
          </ul>
          <Link
            href="/downloads/northline-lab-02.zip"
            download
            className="button button--primary download-main"
          >
            <Download size={18} />
            Download Figma import kit<span>ZIP</span>
          </Link>
          <div className="import-instructions">
            <strong>To get your editable .fig file</strong>
            <ol>
              <li>Unzip the kit and open a new file in Figma desktop.</li>
              <li>
                Plugins → Development → Import plugin from manifest. Select{" "}
                <code>figma-importer/manifest.json</code>.
              </li>
              <li>Run “Northline — Lab 02”. Then File → Save local copy.</li>
            </ol>
            <p>
              This kit creates the editable Figma source inside Figma. It is not
              a pre-exported .fig file.
            </p>
          </div>
        </>
      ) : name === "notes" ? (
        <>
          <Eyebrow>THE THINKING BEHIND THE DESIGN</Eyebrow>
          <Heading id="modal-title">Clear by design.</Heading>
          <p>Question 2 · CSE 3206 Web Engineering Sessional</p>
          <div className="project-notes">
            <Heading level={3}>The brief</Heading>
            <p>
              A clean, professional business website with a clear hero,
              services, About and Contact pages, responsive layouts, reusable
              components, and editable Figma deliverables.
            </p>
            <Heading level={3}>The direction</Heading>
            <p>
              Northline is an illustrative professional-services business.
              Forest green builds trust; warm ivory and terracotta bring a human
              feel. Instrument Serif gives the headlines character, while Plus
              Jakarta Sans keeps the details clear.
            </p>
            <Heading level={3}>The complete handoff</Heading>
            <p>
              Home, About, Services, and Contact at 1440px desktop and 390px
              mobile. Both low- and high-fidelity layouts, reusable Figma
              components, design tokens, and a script-ready lab answer are
              included in the download.
            </p>
            <Heading level={3}>Concept content</Heading>
            <p>
              Northline and the partner wordmarks are fictional demonstration
              brands, not real clients or endorsements. Contact details are
              illustrative; the form is a local interaction demo.
            </p>
          </div>
          <Link
            href="https://www.peopleperhour.com/freelance-jobs/technology-programming/website-development/website-design-mockup-for-a-modern-business-website-4527716"
            target="_blank"
            rel="noopener noreferrer"
            className="button button--secondary"
          >
            Read the original brief <ArrowUpRight size={16} />
          </Link>
        </>
      ) : (
        <>
          <Eyebrow>PROTOTYPE PRIVACY</Eyebrow>
          <Heading id="modal-title">Thoughtful by default.</Heading>
          <p>
            This website is a fictional business design created for Lab Question
            2. The contact form is a frontend demonstration: it does not send
            messages, store submissions, or create accounts.
          </p>
          <p>
            The photographs and public Google Fonts are supplied locally with
            the design package. Northline’s contact details and the partner
            logos are illustrative.
          </p>
        </>
      )}
    </dialog>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash)
  const [mobile, setMobile] = useState(false)
  const [wireframe, setWireframe] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<ModalName>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)

  useEffect(() => {
    const handleHash = () => {
      setPage(pageFromHash())
      setMenuOpen(false)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener("hashchange", handleHash)
    return () => window.removeEventListener("hashchange", handleHash)
  }, [])
  useEffect(() => {
    document.title = `${
      page === "Home" ? "A clearer path forward" : page
    } — Northline`
  }, [page])

  function navigate(next: Page) {
    setPage(next)
    setMenuOpen(false)
    setSelectedService(null)
    if (window.location.hash !== `#${next.toLowerCase()}`)
      window.history.pushState(null, "", `#${next.toLowerCase()}`)
    window.scrollTo({ top: 0, behavior: "instant" })
  }
  function explore(id?: string) {
    navigate("Services")
    setSelectedService(id ?? null)
  }

  return (
    <div className={`app ${mobile ? "app--mobile" : ""}`}>
      <div className="design-toolbar">
        <div className="toolbar-identity">
          <span className="toolbar-dot" />
          <span>
            NORTHLINE <span className="toolbar-divider">/</span>{" "}
            <span className="toolbar-subtitle">WEBSITE CONCEPT</span>
          </span>
          <span className="lab-badge">LAB 02</span>
        </div>
        <div className="toolbar-actions">
          <div className="device-switch" aria-label="Preview size">
            <Button
              variant="icon"
              aria-label="Desktop preview"
              aria-pressed={!mobile}
              className={!mobile ? "is-active" : ""}
              onClick={() => setMobile(false)}
            >
              <Monitor size={15} />
            </Button>
            <Button
              variant="icon"
              aria-label="Mobile preview"
              aria-pressed={mobile}
              className={mobile ? "is-active" : ""}
              onClick={() => setMobile(true)}
            >
              <Smartphone size={15} />
            </Button>
          </div>
          <span className="toolbar-separator" />
          <Button
            variant="text"
            className={`wireframe-toggle ${wireframe ? "is-active" : ""}`}
            aria-pressed={wireframe}
            onClick={() => setWireframe(!wireframe)}
          >
            <Layers size={14} />
            <span>{wireframe ? "Wireframe on" : "Wireframe"}</span>
          </Button>
          <Button
            variant="text"
            className="toolbar-download"
            onClick={() => setModal("downloads")}
          >
            <Download size={14} />
            <span>Design files</span>
            <ChevronDown size={12} />
          </Button>
        </div>
      </div>

      <div
        className={`website ${mobile ? "website--mobile" : ""} ${
          wireframe ? "is-wireframe" : ""
        }`}
      >
        <Link className="skip-link" href="#main-content">
          Skip to content
        </Link>
        <header className="site-header section-shell">
          <Brand onClick={() => navigate("Home")} />
          <nav
            className={`main-nav ${menuOpen ? "main-nav--open" : ""}`}
            aria-label="Main navigation"
          >
            {pages.map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className={page === item ? "is-current" : ""}
                aria-current={page === item ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  navigate(item)
                }}
              >
                {item}
              </Link>
            ))}
          </nav>
          <Button
            className="header-cta"
            variant="secondary"
            onClick={() => navigate("Contact")}
          >
            Let’s talk <ArrowUpRight size={17} />
          </Button>
          <Button
            variant="icon"
            className="mobile-menu-button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </Button>
        </header>
        <main id="main-content" key={page}>
          {page === "Home" ? (
            <Home navigate={navigate} explore={explore} />
          ) : page === "About" ? (
            <About onContact={() => navigate("Contact")} />
          ) : page === "Services" ? (
            <Services
              selected={selectedService}
              onContact={() => navigate("Contact")}
            />
          ) : (
            <Contact />
          )}
        </main>
        <footer className="site-footer section-shell">
          <div className="footer-top">
            <div className="footer-brand">
              <Brand onClick={() => navigate("Home")} />
              <p>
                Independent thinking.
                <br />A clearer path forward.
              </p>
            </div>
            <div className="footer-nav">
              <span className="footer-label">FIND YOUR WAY</span>
              {pages.map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={(event) => {
                    event.preventDefault()
                    navigate(item)
                  }}
                >
                  {item}
                </Link>
              ))}
            </div>
            <div className="footer-contact">
              <span className="footer-label">GOOD THINGS START WITH HELLO</span>
              <Button variant="text" onClick={() => navigate("Contact")}>
                Let’s start a conversation <ArrowUpRight size={17} />
              </Button>
              <span className="footer-location">
                <Globe size={14} />
                London, and wherever you are.
              </span>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Northline. A fictional business website concept.</p>
            <div>
              <Button variant="text" onClick={() => setModal("privacy")}>
                Privacy
              </Button>
              <Button variant="text" onClick={() => setModal("notes")}>
                <FileText size={13} />
                Project notes
              </Button>
            </div>
            <span className="footer-made">THOUGHTFULLY DESIGNED.</span>
          </div>
        </footer>
      </div>
      {modal && <Modal name={modal} close={() => setModal(null)} />}
    </div>
  )
}
