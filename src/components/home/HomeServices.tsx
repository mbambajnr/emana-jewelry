import Image from "next/image"
import styles from "@/app/page.module.css"

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
  )
}

export default function HomeServices() {
  return (
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
                      <WhatsAppIcon />
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
                      <WhatsAppIcon />
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
                      <WhatsAppIcon />
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
                      <WhatsAppIcon />
                      Ask About Repairs
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  )
}
