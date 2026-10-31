"use client"

import { useSiteContent } from "@/components/cms/SiteContentProvider";

import React, { useState } from "react"
import styles from "./LocationWidget.module.css"

export default function LocationWidget() {
  const { copy } = useSiteContent();
  const [copied, setCopied] = useState(false)
  const addressText = "Emana Jewelry, Justmoh Ave, Takoradi, Ghana"
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`
  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressText)}`
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(addressText)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(addressText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <section id="atelier-location" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.subtitle}>{copy["store.001"]}</span>
          <h2 className={styles.title}>{copy["store.002"]}</h2>
          <p className={styles.description}>{copy["store.003"]}</p>
        </div>

        <div className={styles.grid}>
          {/* Atelier Details Card */}
          <div className={styles.infoCard}>
            <div className={styles.badge}>
              <span className={styles.pulseDot} />
              Our Takoradi Shop
            </div>

            <div className={styles.addressBlock}>
              <div className={styles.iconCircle}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <h3 className={styles.venueName}>Emana Jewelry</h3>
                <p className={styles.venueAddress}>Justmoh Ave, Takoradi</p>
                <p className={styles.venueRegion}>Western Region, Ghana</p>
              </div>
            </div>

            <div className={styles.hoursBlock}>
              <h4 className={styles.blockTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Opening Hours
              </h4>
              <ul className={styles.hoursList}>
                <li>
                  <span>Monday – Friday</span>
                  <strong>9:00 AM – 6:00 PM</strong>
                </li>
                <li>
                  <span>Saturday</span>
                  <strong>9:00 AM – 6:00 PM</strong>
                </li>
                <li>
                  <span>Sunday</span>
                  <em>By VIP Appointment</em>
                </li>
              </ul>
            </div>

            <div className={styles.actions}>
              <a
                href={mapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.directionsBtn}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                Get Directions
              </a>

              <button
                type="button"
                onClick={handleCopy}
                className={styles.copyBtn}
                aria-label="Copy address"
              >
                {copied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy Address
                  </>
                )}
              </button>
            </div>

            <div className={styles.conciergeNote}>
              <p>
                <strong>Visiting from outside Takoradi?</strong> Private consultations or airport transport coordination can be arranged directly via our{" "}
                <a
                  href={`https://wa.me/233242186590?text=${encodeURIComponent("Hi Emana Jewelry, I am planning a visit to your Takoradi shop on Justmoh Ave and would like assistance.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.waLink}
                >
                  Chat With Us on WhatsApp (+233 24 218 6590)
                </a>.
              </p>
            </div>
          </div>

          {/* Google Maps Embed Widget */}
          <div className={styles.mapCard}>
            <div className={styles.mapFrameWrapper}>
              <iframe
                title="Emana Jewelry Takoradi Location Map"
                src={embedUrl}
                className={styles.mapIframe}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className={styles.mapFooter}>
              <div className={styles.mapLabel}>
                <span className={styles.pinIcon}>📍</span>
                <span>Emana Jewelry &bull; Justmoh Ave, Takoradi, Ghana</span>
              </div>
              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.openMapsLink}
              >
                Open in Google Maps &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
