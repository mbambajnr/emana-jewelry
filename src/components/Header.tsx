"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateWishlist = () => {
      try {
        const items = JSON.parse(localStorage.getItem("emana_wishlist") || "[]")
        setWishlistCount(items.length)
      } catch {
        setWishlistCount(0)
      }
    }
    const updateCart = () => {
      try {
        const items = JSON.parse(localStorage.getItem("emana_cart") || "[]")
        setCartCount(items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0))
      } catch {
        setCartCount(0)
      }
    }
    updateWishlist()
    updateCart()
    window.addEventListener("wishlist", updateWishlist)
    window.addEventListener("cart", updateCart)
    return () => {
      window.removeEventListener("wishlist", updateWishlist)
      window.removeEventListener("cart", updateCart)
    }
  }, [])

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const trigger = menuButton.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuPanel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
      if (event.key === "Tab") {
        const controls = menuPanel.current?.querySelectorAll<HTMLElement>("a, button");
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    };
    const desktop = window.matchMedia("(min-width: 1200px)");
    const closeOnDesktop = () => { if (desktop.matches) setIsMobileMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", closeOnDesktop);
      document.removeEventListener("keydown", handleKey);
      trigger?.focus();
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
        <div className={styles.logoContainer}>
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Emana Jewelry Logo"
              width={220}
              height={70}
              className={styles.logoImg}
              priority
            />
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link href="/catalog" className={styles.navLink}>Catalog</Link>
          <Link href="/#custom-jewelry-form" className={styles.navLink}>Custom Jewelry</Link>
          <Link href="/#services" className={styles.navLink}>Cleaning &amp; Repairs</Link>
          <Link href="/#consultation" className={styles.navLink}>Book a Visit</Link>
        </nav>

        <div className={styles.actions}>
          <Link href="/wishlist" className={styles.iconLink} aria-label="Wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {wishlistCount > 0 && (
              <span className={styles.badge}>{wishlistCount}</span>
            )}
          </Link>

          <Link href="/cart" className={styles.iconLink} aria-label="Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className={styles.badge}>{cartCount}</span>
            )}
          </Link>

          <button ref={menuButton} aria-expanded={isMobileMenuOpen} aria-controls="mobile-navigation" className={styles.burger} onClick={toggleMobileMenu} aria-label="Menu">
            <span className={styles.burgerLine}></span>
            <span className={styles.burgerLine}></span>
            <span className={styles.burgerLine}></span>
          </button>
        </div>
      </header>

      <div ref={menuPanel} id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Navigation" inert={!isMobileMenuOpen} className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}>
        <button aria-label="Close menu" className={styles.mobileMenuClose} onClick={toggleMobileMenu}>
          &times;
        </button>
        <Link href="/catalog" className={styles.navLink} onClick={toggleMobileMenu}>Catalog</Link>
        <Link href="/#custom-jewelry-form" className={styles.navLink} onClick={toggleMobileMenu}>Custom Jewelry</Link>
        <Link href="/#services" className={styles.navLink} onClick={toggleMobileMenu}>Cleaning &amp; Repairs</Link>
        <Link href="/#consultation" className={styles.navLink} onClick={toggleMobileMenu}>Book a Visit</Link>
      </div>
    </>
  );
}
