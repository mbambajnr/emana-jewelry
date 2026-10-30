"use client";

import { useSiteContent } from "@/components/cms/SiteContentProvider";

import HomeServices from "@/components/home/HomeServices";
import RecentlyViewed from "@/components/RecentlyViewed";
import ShopVideo from "@/components/home/ShopVideo";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ConsultationBooking from "../components/ConsultationBooking";
import LocationWidget from "../components/LocationWidget";
import RemotionHeroSection from "../components/RemotionHeroSection";
import styles from "./page.module.css";

export default function Home({ featuredProducts }: { featuredProducts: React.ReactNode }) {
  const { copy } = useSiteContent();
  const [activeStep, setActiveStep] = useState(1);

  const getStepImage = () => copy[`process.${activeStep}.image`]
  const getStepBadge = () => copy[`process.${activeStep}.label`]

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        {/* REMOTION HERO SECTION */}
        <RemotionHeroSection />

        <section className={styles.businessIntro} aria-labelledby="business-title">
          <h1 id="business-title">{copy["home.001"]}</h1>
          <p>{copy["home.002"]}</p>
          <p>{copy["home.003"]}</p>
          <div className={styles.introLinks}><Link href="/#consultation">{copy["home.004"]}</Link><Link href="/faq">{copy["home.005"]}</Link></div>
        </section>

        <section id="how-can-we-help" className={styles.quickPaths} aria-label="How can we help you?">
          <Link href="/catalog" className={styles.pathCard}>
            <span className={styles.pathNumber}>{copy["home.006"]}</span>
            <h2>{copy["home.007"]}<br />{copy["home.008"]}</h2>
            <p>{copy["home.009"]}</p>
            <span className={styles.pathAction}>{copy["home.010"]}<span aria-hidden="true">↗</span></span>
          </Link>
          <Link href="#custom-jewelry-form" className={styles.pathCard}>
            <span className={styles.pathNumber}>{copy["home.011"]}</span>
            <h2>{copy["home.012"]}<br />{copy["home.013"]}</h2>
            <p>{copy["home.014"]}</p>
            <span className={styles.pathAction}>{copy["home.015"]}<span aria-hidden="true">↗</span></span>
          </Link>
          <Link href="#services" className={styles.pathCard}>
            <span className={styles.pathNumber}>{copy["home.016"]}</span>
            <h2>{copy["home.017"]}<br />{copy["home.018"]}</h2>
            <p>{copy["home.019"]}</p>
            <span className={styles.pathAction}>{copy["home.020"]}<span aria-hidden="true">↗</span></span>
          </Link>
        </section>

        {/* TRUST & HERITAGE PILLARS BAR */}
        <section className={styles.pillarsBar}>
          <div className={styles.pillarsGrid}>
            <div className={styles.pillarItem}>
              <div className={styles.pillarIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className={styles.pillarText}>
                <h4 className={styles.pillarTitle}>{copy["home.021"]}</h4>
                <p className={styles.pillarDesc}>{copy["home.022"]}</p>
              </div>
            </div>

            <div className={styles.pillarItem}>
              <div className={styles.pillarIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className={styles.pillarText}>
                <h4 className={styles.pillarTitle}>{copy["home.023"]}</h4>
                <p className={styles.pillarDesc}>{copy["home.024"]}</p>
              </div>
            </div>

            <div className={styles.pillarItem}>
              <div className={styles.pillarIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className={styles.pillarText}>
                <h4 className={styles.pillarTitle}>{copy["home.025"]}</h4>
                <p className={styles.pillarDesc}>{copy["home.026"]}</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED PRODUCT SNIPPETS SECTION */}
        {featuredProducts}
        <RecentlyViewed />

        <ShopVideo />

        {/* BESPOKE COMMISSIONS SECTION */}
        <section id="bespoke" className={`${styles.section} ${styles.customBuilder}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionSubtitle}>{copy["home.027"]}</span>
            <h2 className={styles.sectionTitle}>{copy["home.028"]}</h2>
            <p className={styles.sectionDesc}>{copy["home.029"]}</p>
          </div>

          <div className={styles.builderContainer}>
            {/* Visual display box changing dynamically on stepper state */}
            <div className={styles.builderVisual}>
              <Image
                src={getStepImage()}
                alt={getStepBadge()}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={styles.builderVisualImg}
              />
              <div className={styles.builderVisualOverlay} />
              <div className={styles.builderBadge}>{getStepBadge()}</div>
            </div>

            {/* Stepper controls */}
            <div className={styles.builderStepper}>
              {/* Step 1 */}
              <div
                className={`${styles.stepRow} ${activeStep === 1 ? styles.stepRowActive : ""}`}
                role="button"
                tabIndex={0}
                aria-pressed={activeStep === 1}
                onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveStep(1); } }}
                onClick={() => setActiveStep(1)}
              >
                <div className={styles.stepNumber}>{copy["home.030"]}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{copy["home.031"]}</h3>
                  <p className={styles.stepDesc}>{copy["home.032"]}</p>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className={`${styles.stepRow} ${activeStep === 2 ? styles.stepRowActive : ""}`}
                role="button"
                tabIndex={0}
                aria-pressed={activeStep === 2}
                onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveStep(2); } }}
                onClick={() => setActiveStep(2)}
              >
                <div className={styles.stepNumber}>{copy["home.033"]}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{copy["home.034"]}</h3>
                  <p className={styles.stepDesc}>{copy["home.035"]}</p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className={`${styles.stepRow} ${activeStep === 3 ? styles.stepRowActive : ""}`}
                role="button"
                tabIndex={0}
                aria-pressed={activeStep === 3}
                onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveStep(3); } }}
                onClick={() => setActiveStep(3)}
              >
                <div className={styles.stepNumber}>{copy["home.036"]}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{copy["home.037"]}</h3>
                  <p className={styles.stepDesc}>{copy["home.038"]}</p>
                </div>
              </div>

              {/* Step 4 */}
              <div
                className={`${styles.stepRow} ${activeStep === 4 ? styles.stepRowActive : ""}`}
                role="button"
                tabIndex={0}
                aria-pressed={activeStep === 4}
                onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveStep(4); } }}
                onClick={() => setActiveStep(4)}
              >
                <div className={styles.stepNumber}>{copy["home.039"]}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{copy["home.040"]}</h3>
                  <p className={styles.stepDesc}>{copy["home.041"]}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ETHICAL MATERIAL SOURCING SECTION */}
        <section id="sourcing" className={`${styles.section} ${styles.rawEarth}`}>
          <div className={styles.rawEarthContainer}>
            <div className={styles.rawEarthInfo}>
              <div className={styles.sectionHeader} style={{ textAlign: "left", margin: "0" }}>
                <span className={styles.sectionSubtitle}>{copy["home.042"]}</span>
                <h2 className={styles.sectionTitle}>{copy["home.043"]}</h2>
                <p className={styles.sectionDesc}>{copy["home.044"]}</p>
              </div>

              <div className={styles.badgeGrid}>
                {/* Badge 2 */}
                <div className={`${styles.badgeCard} glass-panel`}>
                  <div className={styles.badgeIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                  </div>
                  <h3 className={styles.badgeTitle}>{copy["home.045"]}</h3>
                  <p className={styles.badgeDesc}>{copy["home.046"]}</p>
                </div>

                {/* Badge 3 */}
                <div className={`${styles.badgeCard} glass-panel`}>
                  <div className={styles.badgeIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <path d="m9 14 2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className={styles.badgeTitle}>{copy["home.047"]}</h3>
                  <p className={styles.badgeDesc}>{copy["home.048"]}</p>
                </div>

                {/* Badge 4 */}
                <div className={`${styles.badgeCard} glass-panel`}>
                  <div className={styles.badgeIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <rect x="9" y="11" width="6" height="4" rx="1" />
                      <path d="M10 11V9a2 2 0 1 1 4 0v2" />
                    </svg>
                  </div>
                  <h3 className={styles.badgeTitle}>{copy["home.049"]}</h3>
                  <p className={styles.badgeDesc}>{copy["home.050"]}</p>
                </div>
              </div>
            </div>

            <div className={styles.rawVisual}>
              <Image
                src={copy["home.image.051"]}
                alt={copy["home.imageAlt.051"]}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={styles.rawVisualImg}
              />
            </div>
          </div>
        </section>

        <HomeServices />

        {/* CONSULTATION & SERVICES BOOKING SECTION */}
        <section id="consultation" className={`${styles.section} ${styles.consultation}`}>
          <div className={styles.consultationContainer}>
            <div className={styles.consultationInfo}>
              <div className={styles.sectionHeader} style={{ textAlign: "left", margin: "0" }}>
                <span className={styles.sectionSubtitle}>{copy["home.052"]}</span>
                <h2 className={styles.sectionTitle}>{copy["home.053"]}</h2>
                <p className={styles.sectionDesc}>{copy["home.054"]}</p>
              </div>

              <div className={styles.consultationVisualContainer}>
                <Image
                  src={copy["home.image.055"]}
                  alt={copy["home.imageAlt.055"]}
                  width={500}
                  height={280}
                  className={styles.consultationVisualImg}
                />
              </div>

              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3 className={styles.featureTitle}>{copy["home.056"]}</h3>
                    <p className={styles.featureDesc}>{copy["home.057"]}</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3 className={styles.featureTitle}>{copy["home.058"]}</h3>
                    <p className={styles.featureDesc}>{copy["home.059"]}</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3 className={styles.featureTitle}>{copy["home.060"]}</h3>
                    <p className={styles.featureDesc}>{copy["home.061"]}</p>
                  </div>
                </div>
              </div>
            </div>

            <ConsultationBooking />
          </div>
        </section>

        {/* GOOGLE LOCATION WIDGET & ATELIER MAP */}
        <LocationWidget />
      </main>

      <Footer />
    </div>
  );
}
