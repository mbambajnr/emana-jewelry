"use client"

import { useEffect, useState } from "react"
import { emptySocialLinks, parseSocialLinks, type SocialLinks } from "@/lib/social-links"
import styles from "./Footer.module.css"

const profiles = [
  {
    name: "Instagram",
    key: "instagram" as const,
    hosts: ["instagram.com", "www.instagram.com"],
    icon: <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" /><circle cx="17.5" cy="6.5" r="1" /></>,
  },
  {
    name: "Facebook",
    key: "facebook" as const,
    hosts: ["facebook.com", "www.facebook.com", "m.facebook.com"],
    icon: <path d="M14 22v-9h3l.5-3.5H14V7.2c0-1 .3-1.7 1.8-1.7h1.9V2.3a24 24 0 0 0-2.8-.2c-2.8 0-4.7 1.7-4.7 4.8v2.6H7V13h3.2v9z" />,
  },
  {
    name: "TikTok",
    key: "tiktok" as const,
    hosts: ["tiktok.com", "www.tiktok.com"],
    icon: <path d="M16.5 2H13v13.2a3 3 0 1 1-2.5-3v-3.5a6.5 6.5 0 1 0 6 6.5V8.5A9 9 0 0 0 22 10V6.5A5.5 5.5 0 0 1 16.5 2z" />,
  },
]

export default function FooterSocials() {
  const [links, setLinks] = useState<SocialLinks>(emptySocialLinks)
  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/social-links", { signal: controller.signal }).then(async response => {
      if (!response.ok) return
      setLinks(parseSocialLinks(await response.json()))
    }).catch(() => {})
    return () => controller.abort()
  }, [])
  return <div className={styles.socialGroup}>
    <p className={styles.socialHeading}>Find Emana on social</p>
    <div className={styles.socials} aria-label="Emana social profiles">
      {profiles.map(profile => {
        let href: string | undefined
        try {
          const url = new URL(links[profile.key])
          if (url.protocol === "https:" && profile.hosts.includes(url.hostname)) href = url.toString()
        } catch { /* A profile stays inactive until a valid URL is configured. */ }
        const contents = <><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">{profile.icon}</svg><span className={styles.socialName}>{profile.name}</span></>
        return href
          ? <a key={profile.name} href={href} target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label={`Emana on ${profile.name} (opens in a new tab)`}>{contents}</a>
          : <span key={profile.name} className={`${styles.socialIcon} ${styles.socialPending}`} aria-label={`${profile.name}: profile link coming soon`} title={`${profile.name} profile link coming soon`}>{contents}</span>
      })}
    </div>
  </div>
}
