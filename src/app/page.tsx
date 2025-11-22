"use client";

import { useState, useEffect, useRef } from "react";

function SectionTitle({ title, highlight }: { title: string; highlight?: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px bg-slate-300"></div>
      <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 whitespace-nowrap">
        {title} {highlight && <span className="text-[#017CA6] font-bold">{highlight}</span>}
      </h2>
      <div className="flex-1 h-px bg-slate-300"></div>
    </div>
  );
}

function DefaultUserIcon({ size = 120 }: { size?: number }) {
  const fontSize = size * 0.4; // Scale font size based on icon size
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-[#017CA6] font-bold" style={{ fontSize: `${fontSize}px` }}>
        RR
      </span>
    </div>
  );
}

interface ServiceSubsection {
  title: string;
  items: string[];
}

interface ServiceDetail {
  title: string;
  subsections: ServiceSubsection[];
}

const serviceDetails: Record<string, ServiceDetail> = {
  "Upper Urinary Tract Surgery": {
    title: "Upper Urinary Tract Surgery",
    subsections: [
      {
        title: "Kidney",
        items: [
          "Endourology: PCNL (Percutaneous Nephrolithotomy), RIRS (Retrograde Intrarenal Surgery) for stones",
          "Open/Laparoscopic/Robotic: Partial nephrectomy, radical nephrectomy, nephroureterectomy",
          "Reconstructive: Pyeloplasty for PUJ obstruction, calyceal diverticulum surgery",
          "Transplantation: Renal transplant donor and recipient surgery",
        ],
      },
      {
        title: "Ureter",
        items: [
          "Ureteroscopy (URS) with laser lithotripsy for ureteric stones",
          "Ureteric reimplantation / Boari flap / Psoas hitch for strictures",
          "Ureteroureterostomy, ureterolysis for retroperitoneal fibrosis",
        ],
      },
    ],
  },
  "Lower Urinary Tract Surgery": {
    title: "Lower Urinary Tract Surgery",
    subsections: [
      {
        title: "Bladder",
        items: [
          "TURBT (Transurethral Resection of Bladder Tumor)",
          "Cystectomy (radical or partial) with urinary diversion (ileal conduit, neobladder)",
          "Augmentation cystoplasty",
          "Cystolithotripsy (stone surgery)",
        ],
      },
      {
        title: "Prostate",
        items: [
          "TURP (Transurethral Resection of Prostate)",
          "Laser prostatectomy (HoLEP, ThuLEP, GreenLight)",
          "Simple or radical prostatectomy (open, laparoscopic, robotic)",
        ],
      },
      {
        title: "Urethra",
        items: [
          "Optical internal urethrotomy (OIU)",
          "Urethroplasty for strictures",
          "Hypospadias repair",
        ],
      },
    ],
  },
  "Male Genital Surgery": {
    title: "Male Genital Surgery",
    subsections: [
      {
        title: "",
        items: [
          "Orchiectomy, orchidopexy",
          "Varicocelectomy",
          "Vasectomy / Vasovasostomy (reversal)",
          "Penile prosthesis, penile reconstruction, circumcision",
          "Cancer surgery (testicular, penile)",
        ],
      },
    ],
  },
  "Onco-Urology": {
    title: "Onco-Urology",
    subsections: [
      {
        title: "",
        items: [
          "Radical nephrectomy",
          "Radical cystectomy",
          "Radical prostatectomy",
          "Retroperitoneal lymph node dissection (RPLND)",
          "Testicular cancer surgery",
        ],
      },
    ],
  },
  "Female Urology & Reconstructive Surgery": {
    title: "Female Urology & Reconstructive Surgery",
    subsections: [
      {
        title: "",
        items: [
          "Anti-incontinence procedures (TVT, TOT)",
          "Vesicovaginal fistula repair",
          "Pelvic organ prolapse surgery",
          "Urethral diverticulectomy",
        ],
      },
    ],
  },
  "Pediatric Urology": {
    title: "Pediatric Urology",
    subsections: [
      {
        title: "",
        items: [
          "PUJ obstruction repair (pyeloplasty)",
          "Posterior urethral valve ablation",
          "Hypospadias surgery",
          "Undescended testis correction",
          "Congenital anomalies correction (ectopic ureter, exstrophy, reflux surgery)",
        ],
      },
    ],
  },
  "Minimally Invasive & Advanced Urology": {
    title: "Minimally Invasive & Advanced Urology",
    subsections: [
      {
        title: "",
        items: [
          "Laparoscopic and robotic urology",
          "Endourology & laser surgery",
          "Robotic kidney, bladder, prostate, and reconstructive procedures",
        ],
      },
    ],
  },
};

function ServiceModal({ service, isOpen, onClose }: { service: ServiceDetail | null; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !service) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-sky-100 px-6 py-4 rounded-t-lg">
          <h3 className="text-xl font-bold text-slate-900 text-center">{service.title}</h3>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {service.subsections.map((subsection, idx) => (
            <div key={idx} className="space-y-3">
              {subsection.title && (
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-300"></div>
                  <h4 className="text-lg font-bold text-[#017CA6] whitespace-nowrap">
                    {subsection.title}
                  </h4>
                  <div className="flex-1 h-px bg-slate-300"></div>
                </div>
              )}
              <ul className="space-y-2 list-disc pl-5">
                {subsection.items.map((item, itemIdx) => {
                  // Split by colon to separate category from procedures
                  const colonIndex = item.indexOf(":");
                  if (colonIndex > 0) {
                    const category = item.substring(0, colonIndex);
                    const procedures = item.substring(colonIndex + 1).trim();
                    return (
                      <li key={itemIdx} className="text-sm text-slate-700">
                        <span className="font-semibold">{category}:</span>{" "}
                        <span>{procedures}</span>
                      </li>
                    );
                  }
                  // If no colon, just show the item
                  return (
                    <li key={itemIdx} className="text-sm text-slate-700">
                      {item}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Close button */}
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#017CA6] text-white rounded-lg hover:bg-[#016a8f] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scheduleScrollRef = useRef<HTMLDivElement>(null);

  const handleServiceClick = (serviceName: string) => {
    const service = serviceDetails[serviceName];
    if (service) {
      setSelectedService(service);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
        setSelectedService(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isModalOpen]);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Auto-scroll carousel for timetable on small screens
  useEffect(() => {
    const scrollContainer = scheduleScrollRef.current;
    if (!scrollContainer) return;

    const isSmallScreen = window.innerWidth < 768; // md breakpoint
    if (!isSmallScreen) return;

    let autoScrollInterval: NodeJS.Timeout | null = null;
    let isUserScrolling = false;
    let scrollTimeout: NodeJS.Timeout | null = null;
    let currentCardIndex = 0;

    const getCardPositions = () => {
      const cards = scrollContainer.querySelectorAll('[data-card-index]');
      const positions: number[] = [];
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        positions.push(rect.left - containerRect.left + scrollContainer.scrollLeft);
      });
      return positions;
    };

    const scrollToCard = (index: number) => {
      const positions = getCardPositions();
      if (positions.length === 0) return;
      
      const targetIndex = index % positions.length;
      const targetPosition = positions[targetIndex];
      
      scrollContainer.scrollTo({
        left: targetPosition,
        behavior: 'smooth'
      });
    };

    const startAutoScroll = () => {
      if (autoScrollInterval) return;
      
      autoScrollInterval = setInterval(() => {
        if (isUserScrolling) return;
        
        const positions = getCardPositions();
        if (positions.length === 0) return;
        
        // Find the current card index based on scroll position
        const currentScroll = scrollContainer.scrollLeft;
        const containerWidth = scrollContainer.offsetWidth;
        
        // Find which card is most visible
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        positions.forEach((pos, index) => {
          const distance = Math.abs(currentScroll - pos);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        
        // Move to next card
        currentCardIndex = (closestIndex + 1) % positions.length;
        
        // If we're at the last card, check if we should loop back
        if (currentCardIndex === 0 && currentScroll + containerWidth >= scrollContainer.scrollWidth - 10) {
          // Already at the end, reset to start
          scrollToCard(0);
        } else {
          scrollToCard(currentCardIndex);
        }
      }, 2000); // Scroll every 2 seconds
    };

    const handleUserScroll = () => {
      isUserScrolling = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      // Update current card index based on user scroll
      const positions = getCardPositions();
      if (positions.length > 0) {
        const currentScroll = scrollContainer.scrollLeft;
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        positions.forEach((pos, index) => {
          const distance = Math.abs(currentScroll - pos);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        currentCardIndex = closestIndex;
      }
      
      // Resume auto-scroll after 5 seconds of no user interaction
      scrollTimeout = setTimeout(() => {
        isUserScrolling = false;
      }, 5000);
    };

    scrollContainer.addEventListener('scroll', handleUserScroll);
    scrollContainer.addEventListener('touchstart', handleUserScroll);
    scrollContainer.addEventListener('mousedown', handleUserScroll);
    
    // Small delay to ensure cards are rendered
    setTimeout(() => {
      startAutoScroll();
    }, 100);

    return () => {
      if (autoScrollInterval) clearInterval(autoScrollInterval);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollContainer.removeEventListener('scroll', handleUserScroll);
      scrollContainer.removeEventListener('touchstart', handleUserScroll);
      scrollContainer.removeEventListener('mousedown', handleUserScroll);
    };
  }, []);

  return (
    <>
      <ServiceModal service={selectedService} isOpen={isModalOpen} onClose={closeModal} />
      <div className="min-h-screen w-full bg-gradient-to-b from-sky-100 to-white text-slate-900">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#017CA6] flex items-center justify-center">
              <span className="text-white font-bold text-lg">RR</span>
            </div>
          </div>
          <nav className="text-sm md:text-base font-medium flex gap-4 md:gap-6">
            <a href="#" className="text-slate-700 hover:text-[#017CA6] transition-colors py-2 px-1 border-b-2 border-transparent hover:border-[#017CA6]">Home</a>
            <a href="#services" className="text-slate-700 hover:text-[#017CA6] transition-colors py-2 px-1 border-b-2 border-transparent hover:border-[#017CA6]">Services</a>
            {/* <a href="#schedule" className="text-slate-700 hover:text-[#017CA6] transition-colors py-2 px-1 border-b-2 border-transparent hover:border-[#017CA6]">Study Guide</a> */}
            <a href="#contact" className="text-slate-700 hover:text-[#017CA6] transition-colors py-2 px-1 border-b-2 border-transparent hover:border-[#017CA6]">Contact</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        {/* Hero */}
        <section className="grid md:grid-cols-2 gap-8 items-center py-10 md:py-16">
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-6xl xl:text-6xl font-extrabold tracking-tight">
              Rajeev <span className="text-[#017CA6]">Ranjan</span>
            </h1>
            <p className="mt-2 text-lg md:text-xl lg:text-2xl font-medium">
              MBBS, MS (General Surgery), DrNB (Urology)
            </p>
            <div className="mt-6 flex gap-4">
              <a className="w-10 h-10 rounded-full bg-green-500 grid place-items-center text-white hover:bg-green-600 transition-colors" href="https://wa.me/9038234657" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </a>
              <a className="w-10 h-10 rounded-full bg-slate-800 grid place-items-center text-white hover:bg-slate-700 transition-colors" href="mailto:rajeev6670@gmail.com" aria-label="Email">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </a>
              <a className="w-10 h-10 rounded-full bg-slate-800 grid place-items-center text-white hover:bg-slate-700 transition-colors" href="tel:9038234657" aria-label="Phone">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
              <div className="w-56 h-56 md:w-72 md:h-72 rounded-full bg-[#017CA6]/20 grid place-items-center overflow-hidden">
              <DefaultUserIcon size={180} />
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-8 md:py-12">
          <SectionTitle title="Services" highlight="Provided" />
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 items-stretch">
            {[
              "Upper Urinary Tract Surgery",
              "Lower Urinary Tract Surgery",
              "Male Genital Surgery",
              "Onco-Urology",
              "Female Urology & Reconstructive Surgery",
              "Pediatric Urology",
              "Minimally Invasive & Advanced Urology",
            ].map((label, index, array) => (
              <button
                key={label}
                onClick={() => handleServiceClick(label)}
                className={`rounded-2xl bg-[#017CA6] text-white text-center px-4 py-6 shadow-sm hover:bg-[#016a8f] transition-colors h-full min-h-[120px] flex items-center justify-center cursor-pointer ${
                  index === array.length - 1 ? 'col-span-2 md:col-span-1 justify-self-center md:justify-self-stretch max-w-[calc(50%-0.375rem)] md:max-w-none' : ''
                }`}
              >
                <p className="text-sm font-semibold">{label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Schedule */}
        <section id="schedule" className="py-8 md:py-12 w-full">
          <div className="max-w-6xl mx-auto px-4">
            <SectionTitle title="Doctor's" highlight="Time-table" />
          </div>
          <div 
            ref={scheduleScrollRef}
            className="mt-6 overflow-x-auto w-full scrollbar-hide"
          >
            <div className="flex gap-6 pb-4 min-w-max">
              {/* Kolkata kidney institute */}
              <div data-card-index="0" className="rounded-xl bg-[#017CA6] text-white p-6 w-[320px] flex-shrink-0 flex flex-col">
                <div className="mb-4">
                  <p className="font-bold text-lg">Kolkata kidney institute</p>
                </div>
                <p className="text-sm mb-1">Monday, Wednesday, Friday - 5:30 pm to 7:00 pm</p>
                <p className="text-sm mb-3">Tuesday, Thursday, Saturday - 5:30 pm to 7:00 pm</p>
                <p className="text-xs text-white/90 mb-4">Take prior appointment - PA Mr. Rupankar Bera | +918585807542</p>
                <a 
                  href="https://www.google.com/maps/search/Kolkata+kidney+institute" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium hover:underline mt-auto"
                >
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>Show directions</span>
                </a>
              </div>

              {/* Rabindranath Tagore International Institute */}
              <div data-card-index="1" className="rounded-xl bg-[#016a8f] text-white p-6 w-[320px] flex-shrink-0 flex flex-col">
                <div className="mb-4">
                  <p className="font-bold text-lg">RN Tagore International Institute of Cardiac Sciences</p>
                </div>
                <p className="text-sm mb-1">Mukundapur, Executive Building 2nd Floor, Uro-oncology OPD</p>
                <p className="text-sm mb-3">Friday & Saturday - 2:00 pm to 4:00 pm</p>
                <p className="text-xs text-white/90 mb-4">Take prior online appointment</p>
                <a 
                  href="https://www.google.com/maps/search/Rabindranath+Tagore+International+Institute+of+Cardiac+Sciences+Mukundapur" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium hover:underline mt-auto"
                >
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>Show directions</span>
                </a>
              </div>

              {/* Apollo Polyclinic */}
              <div data-card-index="2" className="rounded-xl bg-[#017CA6] text-white p-6 w-[320px] flex-shrink-0 flex flex-col">
                <div className="mb-4">
                  <p className="font-bold text-lg">Apollo Polyclinic</p>
                </div>
                <p className="text-sm mb-1">Mukundapur</p>
                <p className="text-sm mb-3">On Call</p>
                <a 
                  href="https://www.google.com/maps/search/Apollo+Polyclinic+Mukundapur" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium hover:underline mt-auto"
                >
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>Show directions</span>
                </a>
              </div>

              {/* Indira IVF */}
              <div data-card-index="3" className="rounded-xl bg-[#016a8f] text-white p-6 w-[320px] flex-shrink-0 flex flex-col">
                <div className="mb-4">
                  <p className="font-bold text-lg">Indira IVF</p>
                </div>
                <p className="text-sm mb-1">Pataka House, Mirza Galib Street</p>
                <p className="text-sm mb-3">Sunday - Take prior appointment</p>
                <p className="text-xs text-white/90 mb-4">Only for male infertility and andrology</p>
                <a 
                  href="https://www.google.com/maps/search/Indira+IVF+Pataka+House+Mirza+Galib+Street+Kolkata" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium hover:underline mt-auto"
                >
                  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>Show directions</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="contact" className="py-8 md:py-12">
          <SectionTitle title="About the" highlight="Doctor" />
          <div className="grid md:grid-cols-[1fr_280px] gap-8 items-start mt-6">
            <div className="text-sm leading-6 text-slate-700 space-y-4">
              <p>
                Dr. Rajeev Ranjan has been practising since 2009 with expertise in Minimally Invasive Surgery,
                Renal Transplant, Endourology, Genito–Urinary Surgery, Andrology, and Uro–Oncology.
              </p>
              <p>
                He has over two years of specialized experience with the Da‑Vinci Robotic Surgical System, offering advanced,
                precise, and effective treatment options to patients.
              </p>
              <div className="pt-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:p-5 space-y-3">
                  <p className="text-xs text-slate-700">Registration Number: 65143 / West Bengal Medical Council / 27 July, 2009</p>
                  <div className="flex flex-col gap-2">
                    <a href="tel:7602981231" className="flex items-center gap-2 text-sm text-slate-700 hover:text-[#017CA6] transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                      <span>7602981231</span>
                    </a>
                    <a href="mailto:rajeev6670@gmail.com" className="flex items-center gap-2 text-sm text-slate-700 hover:text-[#017CA6] transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      <span>rajeev6670@gmail.com</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="w-40 h-40 md:w-60 md:h-60 rounded-full bg-[#017CA6]/20 grid place-items-center overflow-hidden">
                <DefaultUserIcon size={120} />
              </div>
            </div>
          </div>
        </section>

        {/* Gallery placeholders */}
        {/* <section className="py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-sky-100" />
            ))}
          </div>
        </section> */}

      </main>
    </div>
    </>
  );
}
