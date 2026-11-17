import { type FormEvent } from 'react'
import { Github, Mail } from 'lucide-react'
import logoUrl from '../logo.png'

const externalLink = { target: '_blank', rel: 'noopener noreferrer' }
const contactEmail = 'contact.vferdz@gmail.com'

function openEmailDraft(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  const name = String(form.get('name') ?? '').trim()
  const email = String(form.get('email') ?? '').trim()
  const message = String(form.get('message') ?? '').trim()
  const subject = encodeURIComponent(`Business inquiry from ${name}`)
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)
  window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
}

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <div className="site-footer-brand">
          <a href="https://github.com/iamvferdz" aria-label="VFERDZ on GitHub" {...externalLink}><img src={logoUrl} alt="" /><Github size={15} /> VFERDZ</a>
          <p>tierOne · World clocks for content creators</p>
        </div>

        <section className="site-footer-section" aria-labelledby="footer-support">
          <h2 id="footer-support">Join the channel &amp; support me</h2>
          <p>Become a member and get access to exclusive perks:</p>
          <a href="https://www.youtube.com/channel/UCrpgpFulKn-Z-VIlq6jJqHA/join" {...externalLink}>YouTube channel membership</a>
          <a href="https://www.patreon.com/cw/VFERDZ/membership" {...externalLink}>Patreon membership</a>
        </section>

        <section className="site-footer-section" aria-labelledby="footer-social">
          <h2 id="footer-social">Social media</h2>
          <a href="https://www.tiktok.com/@vf3rdz" {...externalLink}>TikTok</a>
          <a href="https://www.roblox.com/users/175329464" {...externalLink}>Roblox</a>
          <a href="https://discord.gg/jupXMjZg8J" {...externalLink}>Discord</a>
          <a href="https://www.instagram.com/iam.vferdz" {...externalLink}>Instagram</a>
          <a href="https://www.facebook.com/vf3rdz" {...externalLink}>Facebook</a>
        </section>

        <section className="site-footer-section" aria-labelledby="footer-contact">
          <h2 id="footer-contact">Contact details</h2>
          <span>Business inquiries</span>
          <a href={`mailto:${contactEmail}`}><Mail size={13} /> {contactEmail}</a>
          <details className="footer-email-compose">
            <summary>Write a business inquiry</summary>
            <form onSubmit={openEmailDraft}>
              <label>Name<input name="name" autoComplete="name" required /></label>
              <label>Your email<input name="email" type="email" autoComplete="email" required /></label>
              <label>Message<textarea name="message" rows={3} maxLength={2000} required /></label>
              <button type="submit"><Mail size={13} /> Open email draft</button>
              <small>This opens your email app; the website does not send or store your message.</small>
            </form>
          </details>
        </section>
      </div>
    </footer>
  )
}
