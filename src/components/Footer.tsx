"use client"

import { useSiteContent } from "@/components/cms/SiteContentProvider";

import { businessInformation, displayOpeningHours } from "@/lib/business-information";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import FooterSocials from "./FooterSocials";
import styles from "./Footer.module.css";

export default function Footer() {
  const { copy } = useSiteContent();
  const business = businessInformation(copy);
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brandCol}>
          <div className={styles.logoContainer}>
              <Image
                src="/logo.png"
                alt="Emana Jewelry Logo"
                width={220}
                height={60}
                className={styles.logoImg}
              />
          </div>
          <p className={styles.desc}>{copy["footer.001"]}</p>
          <FooterSocials />
        </div>

        <div>
          <h3 className={styles.heading}>Collections</h3>
          <ul className={styles.list}>
            <li><Link href="/catalog" className={styles.link}>All Jewelry</Link></li>
            <li><Link href="/collections/rings" className={styles.link}>Signet &amp; Solitaire Rings</Link></li>
            <li><Link href="/collections/necklaces" className={styles.link}>Necklaces &amp; Pendants</Link></li>
            <li><Link href="/collections/luxury" className={styles.link}>Diamond &amp; Gemstone Pieces</Link></li>
            <li><Link href="/collections/mens" className={styles.link}>Men&apos;s Jewelry</Link></li>
          </ul>
        </div>

        <div>
          <h3 className={styles.heading}>About Emana</h3>
          <ul className={styles.list}>
            <li><Link href="/#custom-jewelry-form" className={styles.link}>Custom Jewelry</Link></li>
            <li><Link href="/#sourcing" className={styles.link}>Materials Chosen With Care</Link></li>
            <li><Link href="/#services" className={styles.link}>Cleaning &amp; Repairs</Link></li>
            <li><Link href="/services" className={styles.link}>All Jewelry Services</Link></li>
            <li><Link href="/#consultation" className={styles.link}>Private Consultation</Link></li>
            <li><Link href="/#atelier-location" className={styles.link}>Takoradi Store &amp; Map</Link></li>
            <li><a href={business.whatsapp} target="_blank" rel="noopener noreferrer" className={styles.link}>Chat With Us on WhatsApp</a></li>
          </ul>
        </div>

        <div>
          <h3 className={styles.heading}>Contact</h3>
          <ul className={styles.list}>
            <li>
              <a
                href={business.map}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Our shop: {business.address}
              </a>
            </li>
            <li>
              <a href={`mailto:${business.email}`} className={styles.link}>
                {business.email}
              </a>
            </li>
            <li>
              <a
                href={business.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                WhatsApp: {business.phone}
              </a>
            </li>
            <li>Monday–Friday: {displayOpeningHours(business.weekdays)}<br />Saturday: {displayOpeningHours(business.saturday)}</li>
          </ul>

        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.credits}>
          <span>&copy; 2026 Emana Jewelry. All rights reserved.</span>
          <a href="https://wa.me/233539490469" target="_blank" rel="noopener noreferrer" className={`${styles.link} ${styles.developerCredit}`}>Developed By Bali-Can Limited<span className={styles.srOnly}> — contact on WhatsApp (opens in a new tab)</span></a>
        </div>
        <div className={styles.bottomLinks}>
          <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
          <Link href="/terms" className={styles.link}>Terms of Service</Link>
          <Link href="/ethical-sourcing" className={styles.link}>Ethical Sourcing Policy</Link>
          <Link href="/faq" className={styles.link}>FAQ</Link>
        </div>
      </div>
    </footer>
  );
}
