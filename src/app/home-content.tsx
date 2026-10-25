"use client";

import RecentlyViewed from "@/components/RecentlyViewed";
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
  const [activeStep, setActiveStep] = useState(1);

  // Dynamic visual for the bespoke commission stepper
  const getStepImage = () => {
    switch (activeStep) {
      case 1:
        return "/bespoke_drafting.jpg";
      case 2:
        return "/gold_signet_ring.jpg";
      case 3:
        return "/gemstones_sourcing.jpg";
      case 4:
        return "/hero_gold_necklace.jpg";
      default:
        return "/bespoke_drafting.jpg";
    }
  };

  const getStepBadge = () => {
    switch (activeStep) {
      case 1:
        return "Step 1: Your Idea";
      case 2:
        return "Step 2: Your Design";
      case 3:
        return "Step 3: Materials and Stones";
      case 4:
        return "Step 4: Making and Delivery";
      default:
        return "Step 1: Your Idea";
    }
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        {/* REMOTION HERO SECTION */}
        <RemotionHeroSection />

        <section className={styles.businessIntro} aria-labelledby="business-title">
          <h1 id="business-title">Jewelry &amp; Custom Designs in Takoradi, Ghana</h1>
          <p>At Emana Jewelry, there’s room for your style. Explore different metals, stones, and materials, or bring us an idea of your own. Visit our shop on Justmoh Ave in Takoradi for jewelry, custom designs, cleaning, and repairs.</p>
          <p>Tell us what you have in mind and your budget. We’ll explain your options and give you a quote before you decide.</p>
          <div className={styles.introLinks}><Link href="/#consultation">Book a visit or call</Link><Link href="/faq">Questions? Start here</Link></div>
        </section>

        <section id="how-can-we-help" className={styles.quickPaths} aria-label="How can we help you?">
          <Link href="/catalog" className={styles.pathCard}>
            <span className={styles.pathNumber}>01 / FIND YOUR PIECE</span>
            <h2>Something for you.<br />Or someone special.</h2>
            <p>Explore rings, necklaces, and more, in materials and styles that suit you.</p>
            <span className={styles.pathAction}>Browse jewelry <span aria-hidden="true">↗</span></span>
          </Link>
          <Link href="#custom-jewelry-form" className={styles.pathCard}>
            <span className={styles.pathNumber}>02 / MADE FOR YOU</span>
            <h2>Your idea.<br />Our craftsmanship.</h2>
            <p>Have a picture or a design in mind? Let’s make a piece that feels like you.</p>
            <span className={styles.pathAction}>Create your own piece <span aria-hidden="true">↗</span></span>
          </Link>
          <Link href="#services" className={styles.pathCard}>
            <span className={styles.pathNumber}>03 / A LITTLE CARE</span>
            <h2>A favourite piece.<br />A fresh start.</h2>
            <p>From a broken chain to a ring that no longer fits, we’re here to help.</p>
            <span className={styles.pathAction}>Cleaning &amp; repairs <span aria-hidden="true">↗</span></span>
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
                <h4 className={styles.pillarTitle}>Materials That Suit You</h4>
                <p className={styles.pillarDesc}>Let’s find the right material, finish, and style for your budget.</p>
              </div>
            </div>

            <div className={styles.pillarItem}>
              <div className={styles.pillarIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className={styles.pillarText}>
                <h4 className={styles.pillarTitle}>Speak With Us on WhatsApp</h4>
                <p className={styles.pillarDesc}>Ask us about a design, your size, or a price on WhatsApp.</p>
              </div>
            </div>

            <div className={styles.pillarItem}>
              <div className={styles.pillarIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className={styles.pillarText}>
                <h4 className={styles.pillarTitle}>Delivery, Arranged With You</h4>
                <p className={styles.pillarDesc}>Speak with us about delivery within Ghana or abroad.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED PRODUCT SNIPPETS SECTION */}
        {featuredProducts}
        <RecentlyViewed />

        {/* BESPOKE COMMISSIONS SECTION */}
        <section id="bespoke" className={`${styles.section} ${styles.customBuilder}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionSubtitle}>Made to Order</span>
            <h2 className={styles.sectionTitle}>Jewelry Made Just for You</h2>
            <p className={styles.sectionDesc}>
              Have a design in mind? Send us a picture or tell us your idea. Our team will help you choose the materials, stones, and style to suit your budget.
            </p>
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
                <div className={styles.stepNumber}>I</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Tell Us Your Idea</h3>
                  <p className={styles.stepDesc}>
                    Send us a picture, a sketch, or a message on WhatsApp. Tell us what you like and how much you would like to spend.
                  </p>
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
                <div className={styles.stepNumber}>II</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>See Your Design</h3>
                  <p className={styles.stepDesc}>
                    We’ll show you a drawing or model so you can check the look and fit before we start making your piece.
                  </p>
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
                <div className={styles.stepNumber}>III</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Choose Your Materials and Stones</h3>
                  <p className={styles.stepDesc}>
                    Tell us the look you want and your budget. We’ll talk you through the available metals, stones, and other materials, and help you choose.
                  </p>
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
                <div className={styles.stepNumber}>IV</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>We Make and Check Your Jewelry</h3>
                  <p className={styles.stepDesc}>
                    We make your piece and check the materials, fit, and finish. Then we pack it safely for collection or delivery.
                  </p>
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
                <span className={styles.sectionSubtitle}>The Materials Behind Your Piece</span>
                <h2 className={styles.sectionTitle}>Materials Chosen With Care</h2>
                <p className={styles.sectionDesc}>
                  Different pieces call for different materials. Ask us about the metals, stones, finishes, and other materials available for your design, and where they come from.
                </p>
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
                  <h3 className={styles.badgeTitle}>Knowing Where Our Stones Come From</h3>
                  <p className={styles.badgeDesc}>
                    We trace our colored stones directly to responsible origin mines across Africa, Sri Lanka, and Colombia.
                  </p>
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
                  <h3 className={styles.badgeTitle}>Gold From Ghanaian Gold Miners</h3>
                  <p className={styles.badgeDesc}>
                    Our 18K and 22K gold is sourced through vetted small-scale Ghanaian co-operatives with fair-labor standards.
                  </p>
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
                  <h3 className={styles.badgeTitle}>Gold Purity Checks</h3>
                  <p className={styles.badgeDesc}>
                    For gold pieces, we check purity and explain the hallmark, a mark showing the gold quality. For other materials, we’ll explain the finish and how to care for your piece.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.rawVisual}>
              <Image
                src="/gemstones_sourcing.jpg"
                alt="Natural rough and cut gemstones in folded dealer parcel paper with jeweler tweezers"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={styles.rawVisualImg}
              />
            </div>
          </div>
        </section>

        {/* CARE & RESTORATION SERVICES SECTION */}
        <section id="services" className={`${styles.section} ${styles.services}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionSubtitle}>Cleaning & Repairs</span>
            <h2 className={styles.sectionTitle}>Jewelry Cleaning & Repair Services</h2>
            <p className={styles.sectionDesc}>
              Your ring no longer fits? Your chain needs fixing? Bring it to us. We’ll check it, explain what needs to be done, and help it look its best again.
            </p>
          </div>

          <div className={styles.servicesContainer}>
            <div className={styles.servicesVisual}>
              <Image
                src="/jewelry_cleaner.png"
                alt="Master jeweler cleaning and repairing gold diamond ring"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={styles.servicesVisualImg}
              />
            </div>

            <div className={styles.servicesInfo}>
              <div className={styles.serviceItems}>
                {/* Cleaning & Detailing */}
                <div className={styles.serviceItem}>
                  <div className={styles.serviceIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
                      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z" />
                      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
                    </svg>
                  </div>
                    <div className={styles.serviceText}>
                    <h3 className={styles.serviceTitle}>Jewelry Cleaning & Polishing</h3>
                    <p className={styles.serviceDesc}>
                      Let us clean away dirt and polish your jewelry to bring back its shine. We’ll check the materials in your piece first and choose the right cleaning method.
                    </p>
                    <a
                      href={`https://wa.me/233242186590?text=${encodeURIComponent("Hi Emana Jewelry, I'd like to request an ultrasonic deep cleaning and detailing service for my jewelry piece.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.serviceWa}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Request Cleaning
                    </a>
                  </div>
                </div>

                {/* Resizing & Repair */}
                <div className={styles.serviceItem}>
                  <div className={styles.serviceIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="15" r="6" />
                      <path d="m12 9-2.5-4 2.5-2.5L14.5 5Z" />
                    </svg>
                  </div>
                  <div className={styles.serviceText}>
                    <h3 className={styles.serviceTitle}>Ring Resizing & Repairs</h3>
                    <p className={styles.serviceDesc}>
                      Ring too tight or too loose? We can adjust the size and repair worn bands so you can wear your ring comfortably again.
                    </p>
                    <a
                      href={`https://wa.me/233242186590?text=${encodeURIComponent("Hi Emana Jewelry, I'd like to request a ring resizing and band restoration service.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.serviceWa}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Request Resizing
                    </a>
                  </div>
                </div>

                {/* Stone Resetting */}
                <div className={styles.serviceItem}>
                  <div className={styles.serviceIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3h12l4 6-10 12L2 9Z" />
                      <path d="M11 3 8 9l4 12 4-12-3-6" />
                      <path d="M2 9h20" />
                    </svg>
                  </div>
                  <div className={styles.serviceText}>
                    <h3 className={styles.serviceTitle}>Loose Stone Repairs & Replacement</h3>
                    <p className={styles.serviceDesc}>
                      A stone feeling loose or missing from your jewelry? Bring it in. We’ll check the setting and help secure or replace the stone.
                    </p>
                    <a
                      href={`https://wa.me/233242186590?text=${encodeURIComponent("Hi Emana Jewelry, I need a prong re-tipping and gemstone resetting service. Please take a look at my piece.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.serviceWa}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Request Resetting
                    </a>
                  </div>
                </div>

                {/* Antique Restoration */}
                <div className={styles.serviceItem}>
                  <div className={styles.serviceIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M12 7v5l4 2" />
                    </svg>
                  </div>
                  <div className={styles.serviceText}>
                    <h3 className={styles.serviceTitle}>Care for Old & Family Jewelry</h3>
                    <p className={styles.serviceDesc}>
                      Some pieces mean too much to put away. Let us check your old or family jewelry and explain how we can clean or repair it with care.
                    </p>
                    <a
                      href={`https://wa.me/233242186590?text=${encodeURIComponent("Hi Emana Jewelry, I'd like to request an antique restoration and care service for my heirloom piece.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.serviceWa}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Ask About Repairs
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONSULTATION & SERVICES BOOKING SECTION */}
        <section id="consultation" className={`${styles.section} ${styles.consultation}`}>
          <div className={styles.consultationContainer}>
            <div className={styles.consultationInfo}>
              <div className={styles.sectionHeader} style={{ textAlign: "left", margin: "0" }}>
                <span className={styles.sectionSubtitle}>Visit Us or Speak With Us Online</span>
                <h2 className={styles.sectionTitle}>Let’s Talk About Your Jewelry</h2>
                <p className={styles.sectionDesc}>
                  Come to our Takoradi shop or speak with us by video call. Whether you want a new piece, a repair, or a little advice, we’re happy to help.
                </p>
              </div>

              <div className={styles.consultationVisualContainer}>
                <Image
                  src="/consultation_desk.jpg"
                  alt="Private jewelry consultation desk with emerald velvet tray, brass loupe, and ring mandrels"
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
                    <h3 className={styles.featureTitle}>Help With Your Design</h3>
                    <p className={styles.featureDesc}>Talk us through your idea. We’ll help you choose a style, size, and materials that work for you.</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3 className={styles.featureTitle}>Know What Your Jewelry Is Made From</h3>
                    <p className={styles.featureDesc}>Ask us about the materials and stones in your piece. We’ll explain where they come from and show you the available certificates.</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3 className={styles.featureTitle}>Advice on Cleaning & Repairs</h3>
                    <p className={styles.featureDesc}>Bring your piece for us to check. We’ll explain the work it needs and the cost before you decide.</p>
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
