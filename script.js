document.addEventListener('DOMContentLoaded', function () {
  // ======================================================
  // NAVBAR: scroll background + mobile hamburger menu
  // ======================================================
  const navbar = document.querySelector('.navbar');

  function toggleNavbarTransparency() {
    if (!navbar) return;
    if (window.scrollY > 0) {
      navbar.classList.add('navbar--scroll');
    } else {
      navbar.classList.remove('navbar--scroll');
    }
  }

  window.addEventListener('scroll', toggleNavbarTransparency);
  toggleNavbarTransparency();

  const mobileToggle = document.querySelector('.navbar__mobile-menu-toggle');
  const mobileMenu   = document.querySelector('.navbar__mobile-menu-items');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('active');
    });
  }

  // ======================================================
  // QUOTE FORM LOGIC
  // ======================================================
  const form = document.querySelector('.contact__form form');
  if (!form) {
    console.log('No contact form on this page.');
    return;
  }

  // --- small helpers ---
  function hideEl(el) {
    if (el && !el.classList.contains('is-hidden')) el.classList.add('is-hidden');
  }
  function showEl(el) {
    if (el) el.classList.remove('is-hidden');
  }

  // TWEAK 1: when disabling a block, ALWAYS clear `required`
  function markBlockRequired(block, enable) {
    if (!block) return;
    const fields = block.querySelectorAll('input, select, textarea');
    fields.forEach(el => {
      const had = el.hasAttribute('data-was-required');
      if (!had && el.required) {
        // remember original required state
        el.dataset.wasRequired = '1';
      }
      if (enable) {
        if (el.dataset.wasRequired === '1') {
          el.required = true;
        }
      } else {
        // always clear required when disabling this block
        el.required = false;
      }
    });
  }

  // --- element references inside form ---
  const mainFields       = form.querySelector('.contact__form-main-fields');

  const airBlock         = form.querySelector('#air-express-fields');
  const truckingBlock    = form.querySelector('#trucking-fields');
  const oceanBlock       = form.querySelector('#ocean-fields');
  const doorBlock        = form.querySelector('#door-delivery-group');
  const generalBlock     = form.querySelector('#general-fields');

  const serviceInputs    = Array.from(form.querySelectorAll('input[name="service[]"]'));
  const serviceCards     = form.querySelectorAll('.contact__form-checkbox');
  const servicesLegend   = form.querySelector('.contact__form-services legend');
  const servicesNote     = form.querySelector('.contact__form-note');
  const servicesContainer= form.querySelector('.contact__form-services-options');
  const changeServiceBtn = form.querySelector('.contact__form-change-service');

  // Air docs/parcels
  const airShipmentRadios = Array.from(form.querySelectorAll('input[name="air_shipment_type"]'));
  const airPiecesRow      = form.querySelector('#air-pieces-row');
  const airWeightRow      = form.querySelector('#air-weight-row');
  const airParcelFields   = form.querySelector('#air-parcel-fields');

  // Bottom extras (commodity, hazard, insurance, commercial value)
  const commodityGroup       = form.querySelector('.contact__form-commodity-group');
  const commodityTextarea    = form.querySelector('#commodity');
  const hazardousRadios      = Array.from(form.querySelectorAll('input[name="hazardous"]'));
  const insuranceLabel       = form.querySelector('label[for="insurance"]');
  const insuranceSelect      = form.querySelector('#insurance');
  const commercialGroup      = form.querySelector('#commercial-value-group');
  const commercialValueInput = form.querySelector('#commercial-value');
  const commercialCurrency   = form.querySelector('#commercial-currency');

  function setAirParcelExtrasForDocuments() {
    // hide + not required (Air Express: Documents)
    [commodityGroup, insuranceLabel, insuranceSelect, commercialGroup].forEach(hideEl);

    if (commodityTextarea) commodityTextarea.required = false;
    hazardousRadios.forEach(r => { r.required = false; });
    if (commercialValueInput) commercialValueInput.required = false;
    if (commercialCurrency)   commercialCurrency.required   = false;
  }

  function setAirParcelExtrasForParcelsOrFreight() {
    // show + required (Air Express: Parcels, and all Trucking/Ocean)
    [commodityGroup, insuranceLabel, insuranceSelect, commercialGroup].forEach(showEl);

    if (commodityTextarea) commodityTextarea.required = true;
    hazardousRadios.forEach(r => { r.required = true; });
    if (commercialValueInput) commercialValueInput.required = true;
    if (commercialCurrency)   commercialCurrency.required   = true;
  }

  // Store original required for service blocks, then disable all of them initially
  [airBlock, truckingBlock, oceanBlock, doorBlock, generalBlock].forEach(block => {
    markBlockRequired(block, false); // records data-was-required and turns off required
  });

  // --- visual helpers for service cards ---
  function resetServiceVisuals() {
    if (servicesLegend) servicesLegend.classList.remove('is-hidden');
    if (servicesNote)   servicesNote.classList.remove('is-hidden');

    if (servicesContainer) {
      servicesContainer.classList.remove('contact__form-services-options--single');
    }

    serviceCards.forEach(card => {
      card.classList.remove('service--active');
      card.style.display = '';
    });

    if (changeServiceBtn) changeServiceBtn.classList.add('is-hidden');
  }

  function highlightSelectedService(selectedInput) {
    if (!selectedInput) {
      resetServiceVisuals();
      return;
    }

    const selectedCard = selectedInput.closest('.contact__form-checkbox');
    if (!selectedCard) {
      resetServiceVisuals();
      return;
    }

    if (servicesLegend) servicesLegend.classList.add('is-hidden');
    if (servicesNote)   servicesNote.classList.add('is-hidden');

    if (changeServiceBtn) changeServiceBtn.classList.remove('is-hidden');
    if (servicesContainer) {
      servicesContainer.classList.add('contact__form-services-options--single');
    }

    serviceCards.forEach(card => {
      if (card === selectedCard) {
        card.classList.add('service--active');
        card.style.display = 'flex';
      } else {
        card.classList.remove('service--active');
        card.style.display = 'none';
      }
    });
  }

  // --- Air docs/parcels behaviour ---
  function resetAirDocParcel() {
    // hide all doc/parcel extra rows and turn off their required
    hideEl(airPiecesRow);
    hideEl(airWeightRow);
    hideEl(airParcelFields);

    [airPiecesRow, airWeightRow, airParcelFields].forEach(block => {
      if (!block) return;
      const fields = block.querySelectorAll('input, select');
      fields.forEach(el => { el.required = false; });
    });

    // reset bottom extras back to "visible + required" baseline
    // (they'll be hidden again for Air/Documents specifically)
    setAirParcelExtrasForParcelsOrFreight();

    // until Docs/Parcels chosen, hide and disable the shared general section
    hideEl(generalBlock);
    markBlockRequired(generalBlock, false);
  }

  function updateAirShipmentMode() {
    const selected = airShipmentRadios.find(r => r.checked);

    if (!selected) {
      resetAirDocParcel();
      return;
    }

    // when either Documents or Parcels chosen: show pieces + weight and make required
    showEl(airPiecesRow);
    showEl(airWeightRow);

    [airPiecesRow, airWeightRow].forEach(block => {
      if (!block) return;
      const fields = block.querySelectorAll('input, select');
      fields.forEach(el => { el.required = true; });
    });

    // shared bottom section (Monthly volume, etc.) is visible once Docs/Parcels chosen
    showEl(generalBlock);
    markBlockRequired(generalBlock, true);

    if (selected.value === 'Parcels') {
      // Parcels: show dimensions + parcel-only extras
      showEl(airParcelFields);
      if (airParcelFields) {
        airParcelFields.querySelectorAll('input, select').forEach(el => {
          el.required = true;
        });
      }
      setAirParcelExtrasForParcelsOrFreight();
    } else {
      // Documents: hide dimensions + parcel-only extras
      hideEl(airParcelFields);
      if (airParcelFields) {
        airParcelFields.querySelectorAll('input, select').forEach(el => {
          el.required = false;
        });
      }
      setAirParcelExtrasForDocuments();
    }
  }

  airShipmentRadios.forEach(r => {
    r.addEventListener('change', updateAirShipmentMode);
  });

  // --- service selection logic ---
  function hideAllServiceBlocks() {
    hideEl(airBlock);
    hideEl(truckingBlock);
    hideEl(oceanBlock);
    hideEl(doorBlock);
    hideEl(generalBlock);

    // disable all requireds for those blocks
    [airBlock, truckingBlock, oceanBlock, doorBlock, generalBlock].forEach(block => {
      markBlockRequired(block, false);
    });

    // clear Air Docs/Parcels choice when changing service
    airShipmentRadios.forEach(r => { r.checked = false; });

    resetAirDocParcel();
  }

  function handleServiceChange() {
    const selected = serviceInputs.find(cb => cb.checked);
    console.log('Selected service:', selected && selected.value);

    hideAllServiceBlocks();

    if (!selected) {
      hideEl(mainFields);
      resetServiceVisuals();
      return;
    }

    showEl(mainFields);
    highlightSelectedService(selected);

    const val = selected.value;

    if (val === 'Air Express') {
      showEl(airBlock);
      markBlockRequired(airBlock, true);
      // make sure docs/parcels extra stuff starts hidden & radios cleared
      resetAirDocParcel();
    } else if (val === 'Trucking') {
      showEl(truckingBlock);
      showEl(doorBlock);
      showEl(generalBlock);
      markBlockRequired(truckingBlock, true);
      markBlockRequired(doorBlock, true);
      markBlockRequired(generalBlock, true);
      // for freight, always show commodity/hazard/insurance/commercial
      setAirParcelExtrasForParcelsOrFreight();
    } else if (val === 'Ocean Freight') {
      showEl(oceanBlock);
      showEl(doorBlock);
      showEl(generalBlock);
      markBlockRequired(oceanBlock, true);
      markBlockRequired(doorBlock, true);
      markBlockRequired(generalBlock, true);
      // for freight, always show commodity/hazard/insurance/commercial
      setAirParcelExtrasForParcelsOrFreight();
    }
  }

  // hook up service checkboxes as a radio group
  serviceInputs.forEach(cb => {
    cb.addEventListener('change', function (e) {
      if (e.target.checked) {
        serviceInputs.forEach(other => {
          if (other !== e.target) other.checked = false;
        });
      }
      handleServiceChange();
    });
  });

  // Change service button
  if (changeServiceBtn) {
    changeServiceBtn.addEventListener('click', function () {
      serviceInputs.forEach(cb => { cb.checked = false; });
      handleServiceChange();
    });
  }

  // Handle submit via button click so we can adjust required on hidden fields
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.addEventListener('click', function (e) {
      e.preventDefault(); // stop the default submit for a moment

      // 1) Clear required on ANY fields inside .is-hidden blocks
      const hiddenRequired = form.querySelectorAll(
        '.is-hidden input[required], .is-hidden select[required], .is-hidden textarea[required]'
      );
      hiddenRequired.forEach(el => {
        el.required = false;
      });

      // 2) Run native browser validation for the currently visible fields
      const isValid = form.reportValidity();
      if (!isValid) {
        // If invalid, browser will highlight the first bad field
        return;
      }

      // 3) Everything looks good: submit to Formspree
      form.submit();
    });
  }

  // ------------------------------------------------------
  // INITIALISE / HARD RESET FUNCTION
  // ------------------------------------------------------
  function initQuoteForm() {
    // Base reset
    form.reset();

    // EXTRA hard reset to beat browser autofill
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(el => {
      if (el.type === 'hidden') return; // keep _redirect etc.

      if (el.tagName === 'TEXTAREA') {
        el.value = '';
      } else if (el.tagName === 'SELECT') {
        el.selectedIndex = 0;
      } else if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = false;
      } else {
        el.value = '';
      }
    });

    // Reset service UI/state
    serviceInputs.forEach(cb => { cb.checked = false; });
    hideEl(mainFields);
    hideAllServiceBlocks();
    resetServiceVisuals();

    // Also make sure commodity/hazard radios are cleared
    hazardousRadios.forEach(r => { r.checked = false; });

    console.log('Quote form hard-reset.');
  }

  // initial state on first load (after DOM is ready)
  initQuoteForm();

  // Also run after full load (in case autofill fires late)
  window.addEventListener('load', function () {
    // small timeout so we definitely run after autofill
    setTimeout(initQuoteForm, 50);
  });

  // ------------------------------------------------------
  // Handle browser back/forward so form is blank
  // ------------------------------------------------------
  window.addEventListener('pageshow', function () {
    // regardless of persisted/not – always reset when page is shown
    setTimeout(initQuoteForm, 50);
  });
});



// ==============================
//  BLOG / INSIGHTS PAGE LOGIC
// ==============================

let blogListEl, emptyStateEl, searchInput, filterButtons;
let blogActiveCategory = 'all';
let currentBlogLang = 'en';

// Core blog data (language-independent)
const blogPosts = [
  {
    id: 1,
    category: 'trucking',
    source: 'TruckNews',
    url: 'https://www.trucknews.com/products/123loadboard-adds-cargo-insurance-with-mikargo247-integration/',
    imageUrl: '/Images/Insights/Trucking/freight-claims-istock-1024x683.jpg',
    date: '2025-11-20'
  },
  {
    id: 2,
    category: 'air',
    source: 'Air Cargo News',
    url: 'https://www.aircargonews.net/drones/emirates-skycargo-explores-cargo-drone-delivery/1080943.article',
    imageUrl: '/Images/Insights/Air Express/12067_emirateswilltestloddshilidrone_photoemirates_985953.jpg',
    date: '2025-11-21'
  },
  {
    id: 3,
    category: 'ocean',
    source: 'The Loadstar',
    url: 'https://theloadstar.com/asia-europe-spots-stay-strong-while-carriers-hunt-cargo-to-fill-ships-to-the-us/',
    imageUrl: '/Images/Insights/Ocean Freight/17b37d33846ce8fa482f0795c2e552a7-680x0-c-default.jpg',
    date: '2025-11-21'
  }
];

// Helpers to render blog for a given language
function renderBlogPostsForLang(lang, posts) {
  if (!blogListEl) return;

  const dict = (translations[lang] || translations.en);
  const locale =
    lang === 'fr' ? 'fr-CA' :
    lang === 'es' ? 'es-ES' :
    'en-CA';

  const items = posts || blogPosts;

  blogListEl.innerHTML = '';

  if (!items.length) {
    if (emptyStateEl) emptyStateEl.classList.remove('is-hidden');
    return;
  }
  if (emptyStateEl) emptyStateEl.classList.add('is-hidden');

  items.forEach(post => {
    const article = document.createElement('article');
    article.className = 'blog-card';
    article.setAttribute('data-category', post.category);

    const badgeClass =
      post.category === 'air' ? 'blog-card__badge--air' :
      post.category === 'trucking' ? 'blog-card__badge--trucking' :
      post.category === 'ocean' ? 'blog-card__badge--ocean' : '';

    const titleKey = `blog.post${post.id}.title`;
    const excerptKey = `blog.post${post.id}.excerpt`;
    const title = dict[titleKey] || translations.en[titleKey] || '';
    const excerpt = dict[excerptKey] || translations.en[excerptKey] || '';

    const categoryKey = `blog.category.${post.category}`;
    const categoryLabel = dict[categoryKey] || translations.en[categoryKey] || '';

    const sourceLabel = dict['blog.sourceLabel'] || 'Source:';
    const readLabel = dict['blog.readLink'] || 'Read full article →';

    const dateStr = post.date
      ? new Date(post.date).toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : '';

    article.innerHTML = `
      <a href="${post.url}" target="_blank" rel="noopener noreferrer" class="blog-card__image-link">
        <img src="${post.imageUrl}" alt="${title}" class="blog-card__image" loading="lazy">
      </a>
      <div class="blog-card__content">
        <div class="blog-card__meta">
          <span class="blog-card__badge ${badgeClass}">${categoryLabel}</span>
          ${dateStr ? `<span>${dateStr}</span>` : ''}
          <span>${post.source}</span>
        </div>
        <h2 class="blog-card__title">
          <a href="${post.url}" target="_blank" rel="noopener noreferrer">
            ${title}
          </a>
        </h2>
        <p class="blog-card__excerpt">${excerpt}</p>
        <div class="blog-card__footer">
          <span class="blog-card__source">${sourceLabel} ${post.source}</span>
          <a class="blog-card__read-link" href="${post.url}" target="_blank" rel="noopener noreferrer">
            ${readLabel}
          </a>
        </div>
      </div>
    `;

    blogListEl.appendChild(article);
  });
}

function applyBlogFilters() {
  if (!blogListEl || !searchInput) return;

  const lang = currentBlogLang;
  const dict = translations[lang] || translations.en;

  const query = searchInput.value.trim().toLowerCase();

  const filtered = blogPosts.filter(post => {
    const titleKey = `blog.post${post.id}.title`;
    const excerptKey = `blog.post${post.id}.excerpt`;

    const title = (dict[titleKey] || translations.en[titleKey] || '').toLowerCase();
    const excerpt = (dict[excerptKey] || translations.en[excerptKey] || '').toLowerCase();

    const matchesCategory =
      blogActiveCategory === 'all' || post.category === blogActiveCategory;

    const haystack = `${title} ${excerpt}`;
    const matchesQuery = !query || haystack.includes(query);

    return matchesCategory && matchesQuery;
  });

  renderBlogPostsForLang(lang, filtered);
}

document.addEventListener('DOMContentLoaded', () => {
  blogListEl   = document.getElementById('blog-list');
  emptyStateEl = document.getElementById('blog-empty-state');
  searchInput  = document.getElementById('blog-search');
  filterButtons = document.querySelectorAll('.blog__filter-btn');

  if (!blogListEl || !searchInput) {
    // Not on insights page
    return;
  }

  const savedLang = localStorage.getItem('siteLanguage') || 'en';
  currentBlogLang = savedLang;

  searchInput.addEventListener('input', applyBlogFilters);

  filterButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      filterButtons.forEach(b => b.classList.remove('blog__filter-btn--active'));
      this.classList.add('blog__filter-btn--active');
      blogActiveCategory = this.getAttribute('data-category') || 'all';
      applyBlogFilters();
    });
  });

  applyBlogFilters();
});


// ==============================
//  TRANSLATIONS
// ==============================

const translations = {
  en: {
    // meta
    "meta.title": "Magic Shipping | Logistics & Global Air, Ocean & Freight Services",
    "meta.services.title": "Magic Shipping | Services",
    "meta.carriers.title": "Magic Shipping | Carriers",
    "meta.insights.title": "Magic Shipping | Insights",
    "meta.quote.title": "Magic Shipping | Get a Quote",
    "meta.privacy.title": "Magic Shipping | Privacy Policy",
    "meta.terms.title": "Magic Shipping | Terms and Conditions",
    "meta.faqs.title": "Magic Shipping | FAQs",
    "meta.thankyou.title": "Magic Shipping | Request Submitted!",

    // nav
    "nav.home": "Home",
    "nav.about": "About Us",
    "nav.contact": "Contact Us",
    "nav.services": "Services",
    "nav.carriers": "Carriers",
    "nav.insights": "Insights",
    "nav.quote": "Get a Quote",

    // hero (index)
    "hero.title": "At Magic Shipping, we specialize in dependable international air express, trucking, and freight solutions.",
    "hero.line1": "We help businesses and individuals ship worldwide with real-time tracking, reliable partner networks, and discounted preferential shipping rates.",
    "hero.line2": "Get access to world class shipping services for a fraction of retail rates. Contact us for a quote now.",
    "hero.ctaPrimary": "Get a Quote",
    "hero.ctaSecondary": "Email Us",

    "hero.service.air.title": "Air Express",
    "hero.service.air.desc": "Door-to-Door Services",
    "hero.service.trucking.title": "Trucking",
    "hero.service.trucking.desc": "FTL/LTL Services",
    "hero.service.ocean.title": "Ocean Freight",
    "hero.service.ocean.desc": "Container Services",
    "hero.service.tracking.title": "Real-Time Tracking",
    "hero.service.tracking.desc": "and professional support",

    // about (index)
    "about.heading": "About us : Who we are",
    "about.text1": "Magic Shipping is a Toronto-based logistics provider specializing in affordable international air express shipping through our business partnership with DHL Express, FedEx and UPS. We also provide domestic trucking and ocean freight services to all of our customers; from large businesses that are shipping massive ocean containers to individuals with one off documents, we are here to help everyone with their shipping needs. With substantial corporate account discounts, we help businesses and individuals alike access world-class shipping services at a fraction of retail rates.",
    "about.missionTitle": "Our Mission",
    "about.missionText": "To simplify and reduce the cost of international and domestic shipping for businesses and individuals, while ensuring reliable service, full tracking, and professional support along the way.",
    "about.visionTitle": "Our Vision",
    "about.visionText": "Magic Shipping aims to provide seamless global logistics through trusted partnerships, transparent pricing, and an unwavering commitment to service excellence.",

    // testimonials (index)
    "testimonials.heading": "Testimonials: What clients say about us",
    "testimonials.subheading": "Hear from some of our amazing customers who are building faster.",

    "testimonials.card1.text": "“This store has never let me down. They have a wide range of products and their prices are very reasonable. The customer service is excellent.”",
    "testimonials.card1.name": "Full Name",
    "testimonials.card1.role": "Product Manager, Company 1",

    "testimonials.card2.text": "“Their repair services are life-savers! They fixed my phone's water damage when I thought all hope was lost. Absolutely recommend!”",
    "testimonials.card2.name": "Full Name",
    "testimonials.card2.role": "Head of Design, Company 2",

    "testimonials.card3.text": "“My phone’s screen was shattered and I thought I’d have to buy a new one, but the repair service here saved me a lot of money. The screen looks brand new now!”",
    "testimonials.card3.name": "Full Name",
    "testimonials.card3.role": "UX Designer, Company 3",

    // contact section (index)
    "contact.heading": "Contact Us",
    "contact.subheading1": "Got questions or need a quote?",
    "contact.subheading2": "Contact us at Magic Shipping! Our friendly and knowledgeable customer support team is ready to help you. Reach out to us via email or phone otherwise, for all quote requests just fill out our online form and we will get back to you with your own personalized quote within 24 hours. Don't hesitate to get in touch with us for all your shipping needs!",

    "contact.email.heading": "Email",
    "contact.email.desc": "Our friendly team is here to help.",
    "contact.email.address": "admin@mymagicshipping.com",

    "contact.phone.heading": "Phone",
    "contact.phone.desc": "Call us now!",
    "contact.phone.number": "123-456-7890",

    "contact.quote.heading": "Get a Quote",
    "contact.quote.desc": "Fill out our online form now!",
    "contact.quote.link": "Get Quote",

    // SERVICES PAGE (content omitted here for brevity – keep your existing EN services keys)
    "services.heading": "Services: What we offer",
    "services.intro": "At Magic Shipping, we take pride in our streamlined approach to providing exceptional shipping services. Our goal is to deliver fast and reliable transportation for your cargo that exceed your expectations. Please see below the shipping services that we can assist you with.",
    "services.card.air.title": "Air Express",
    "services.card.air.p1": "As an authorized DHL Express partner, enjoy exclusive savings through our corporate discounts. Ship documents and parcels worldwide with full real-time tracking available.",
    "services.card.air.p2": "Overnight shipping to and from USA. 3 days shipping to and from China. Fast and reliable service.",
    "services.card.ltl.title": "LTL/FTL",
    "services.card.ltl.p1": "We connect you to the best trucking companies for all of your LTL and FTL needs. We have exclusive discounts from our shipping partners that we pass on to all of our customers.",
    "services.card.ltl.p2": "Domestic intra-Canada routes as well as international routes to and from the US and Mexico.",
    "services.card.ocean.title": "Ocean Freight",
    "services.card.ocean.p1": "Our vast global network provides us with the ability to offer our customers world class ocean freight LCL and FCL options and the best rates available.",
    "services.card.ocean.p2": "Professional, safe and reliable support for all of your large container cargo needs.",
    "services.card.expedite.title": "Expedite",
    "services.card.expedite.p1": "When time is critical, Magic Shipping is built to respond. We specialize in fast, flexible expedite solutions — including ground options such as couriers, sprinter vans, box trucks, and team-driver routes, as well as air-expedite, private charter, and hand-carry services.",
    "services.card.expedite.p2": "With true 24/7 availability, we’re ready to move urgent shipments at any hour.",
    "services.card.hazmat.title": "Haz-Mat",
    "services.card.hazmat.p1": "We provide both domestic and international hazardous-materials transport. Because haz-mat shipments require strict attention to detail, our team assists with proper packaging, compliant documentation, and safe, regulated movement from start to finish.",
    "services.card.temp.title": "Temperature Control",
    "services.card.temp.p1": "Whether your shipment must stay above freezing or maintain a refrigerated temperature, we have the right carriers and equipment. We work with trusted temperature-controlled LTL and dedicated truckload providers to protect sensitive products throughout the entire journey.",
    "services.card.temp.p2": "Ask our team how we ensure your temperature requirements are monitored and met every time.",
    "services.card.rail.title": "Rail",
    "services.card.rail.p1": "If your freight schedule allows a bit more transit time, rail service can offer meaningful cost savings. Our intermodal network provides dedicated rail solutions as well as LTL options that integrate rail consolidation to lower transportation costs without sacrificing reliability.",
    "services.card.consulting.title": "Consulting",
    "services.card.consulting.p1": "Whether you’re a new company shipping for the first time or an established business re-evaluating your logistics strategy, we offer tailored consulting support. Our team helps you understand the most efficient, cost-effective shipping methods based on current industry conditions and your unique operational needs.",
    "services.card.warehousing.title": "Warehousing",
    "services.card.warehousing.p1": "With access to warehousing facilities across the continental U.S., we can create a storage and distribution plan built around your project requirements. From receiving and outbound processing to inventory control, reporting, security, and insurance – our team helps streamline your full logistics workflow.",
    "services.card.whiteglove.title": "White Glove",
    "services.card.whiteglove.p1": "Our white-glove service goes beyond standard delivery. We can provide inside delivery, assembly, unpacking, installation, and debris removal – offering a smooth, premium experience for shipments that require extra care and attention.",

    // CARRIERS PAGE meta + labels (keep your existing English keys)
    "carriers.form.title": "Carrier Registration",
    "carriers.form.intro": "Please fill out the form below if you wish to register as a carrier with Magic Shipping.",
    "carriers.firstName.label": "First Name *",
    "carriers.firstName.placeholder": "First name",
    "carriers.lastName.label": "Last Name *",
    "carriers.lastName.placeholder": "Last name",
    "carriers.email.label": "Email Address *",
    "carriers.email.placeholder": "you@company.com",
    "carriers.company.label": "Company Name",
    "carriers.company.placeholder": "Company name (optional)",
    "carriers.phone.label": "Phone Number *",
    "carriers.phone.placeholder": "+1 (555) 555-5555",
    "carriers.website.label": "Website",
    "carriers.website.placeholder": "Website (optional)",
    "carriers.mc.label": "MC # *",
    "carriers.mc.placeholder": "MC#",
    "carriers.dot.label": "DOT # *",
    "carriers.dot.placeholder": "DOT#",
    "carriers.assets.label": "Asset Based Resources *",
    "carriers.assets.placeholder": "Please select",
    "carriers.assets.dryvan": "Dry Van",
    "carriers.assets.flatbed": "Flat Bed",
    "carriers.assets.expedite": "Expedite/Sprinter Van",
    "carriers.assets.reefer": "Reefer",
    "carriers.assets.conestoga": "Conestoga/Specialized",
    "carriers.assets.other": "Other",
    "carriers.details.label": "Additional Details",
    "carriers.details.placeholder": "Add any relevant details (optional)",
    "carriers.submit": "Become our carrier now!",

    // BLOG / INSIGHTS PAGE
    "blog.hero.title": "Logistics Insights & Industry News",
    "blog.hero.subtitle": "Curated articles and resources on air express, trucking, and ocean freight – from trusted industry sources.",
    "blog.search.label": "Search articles",
    "blog.search.placeholder": "Search by topic, lane, or keyword…",
    "blog.filters.label": "Filter by service:",
    "blog.filters.all": "All",
    "blog.filters.air": "Air Express",
    "blog.filters.trucking": "Trucking",
    "blog.filters.ocean": "Ocean Freight",
    "blog.empty": "No articles match your search. Try a different keyword or choose another service.",
    "blog.readLink": "Read full article →",
    "blog.sourceLabel": "Source:",
    "blog.category.air": "Air Express",
    "blog.category.trucking": "Trucking",
    "blog.category.ocean": "Ocean Freight",

    // Blog post-specific text
    "blog.post1.title": "123Loadboard adds cargo insurance with MiKargo247 integration",
    "blog.post1.excerpt": "123Loadboard has partnered with MiKargo247 to let carriers and shippers add instant, per-trip cargo insurance of up to $2 million directly inside the load board.",
    "blog.post2.title": "Emirates SkyCargo explores cargo drone delivery",
    "blog.post2.excerpt": "Emirates SkyCargo is partnering with a drone manufacturer to test VTOL cargo aircraft, running feasibility studies and live demonstrations across its network.",
    "blog.post3.title": "Asia–Europe spot rates stay firm as carriers hunt cargo to fill US services",
    "blog.post3.excerpt": "Mid-November FAK increases continue to support spot container rates on Asia–Europe lanes while carriers look for cargo to fill sailings to North America.",

    // GET A QUOTE PAGE
    "quote.title": "Request a Quote",
    "quote.intro": "If you require a quote, please fill in the following form and we will get back to you within 24 hours.",

    "quote.services.legend": "Which service(s) are you looking for today?",
    "quote.services.air": "Air Express",
    "quote.services.trucking": "Trucking",
    "quote.services.ocean": "Ocean Freight",
    "quote.services.note": "Please select the service(s) you’re interested in.",
    "quote.services.change": "Change service",

    "quote.form.fromSection.title": "FROM",
    "quote.form.toSection.title": "TO",
    "quote.form.firstName.label": "First Name *",
    "quote.form.firstName.placeholder": "First name",
    "quote.form.lastName.label": "Last Name *",
    "quote.form.lastName.placeholder": "Last name",
    "quote.form.email.label": "Email Address *",
    "quote.form.email.placeholder": "you@company.com",
    "quote.form.company.label": "Company Name",
    "quote.form.company.placeholder": "Company name (optional)",
    "quote.form.phone.label": "Phone Number *",
    "quote.form.phone.placeholder": "+1 (555) 555-5555",
    "quote.form.website.label": "Website",
    "quote.form.website.placeholder": "Website (optional)",

    "quote.form.select.placeholder": "Please select",

    // Air Express address labels (EN)
    "quote.air.fromCountry.label": "Country/Territory *",
    "quote.air.fromCountry.placeholder": "Canada",
    "quote.air.toCountry.label": "Country/Territory *",
    "quote.air.toCountry.placeholder": "United States of America",

    "quote.air.fromAddress.label": "Address *",
    "quote.air.fromAddress.placeholder": "123 My Street",
    "quote.air.toAddress.label": "Address *",
    "quote.air.toAddress.placeholder": "123 Your Street",

    "quote.air.fromPostal.label": "Postal/ZIP Code *",
    "quote.air.fromPostal.placeholder": "A1A 1A1",
    "quote.air.fromCity.label": "City *",
    "quote.air.fromCity.placeholder": "Toronto",
    "quote.air.fromRegion.label": "Province/State *",
    "quote.air.fromRegion.placeholder": "Ontario",

    "quote.air.toPostal.label": "Postal/ZIP Code *",
    "quote.air.toPostal.placeholder": "60139",
    "quote.air.toCity.label": "City *",
    "quote.air.toCity.placeholder": "Glendale Heights",
    "quote.air.toRegion.label": "Province/State *",
    "quote.air.toRegion.placeholder": "Illinois",

    "quote.air.residential": "Residential address",


    "quote.air.shipment.legend": "What are you shipping? *",
    "quote.air.shipment.documents": "Documents",
    "quote.air.shipment.parcels": "Parcels",

    "quote.air.pieces.label": "How many pieces? *",
    "quote.air.pieces.placeholder": "e.g., 1",

    "quote.air.weight.label": "Total Weight *",
    "quote.air.weight.placeholder": "e.g., 10",
    "quote.air.weightUnit.label": "Weight unit *",

    "quote.air.length.label": "Length *",
    "quote.air.length.placeholder": "e.g., 10",
    "quote.air.lengthUnit.label": "Unit *",
    "quote.air.width.label": "Width *",
    "quote.air.width.placeholder": "e.g., 10",
    "quote.air.widthUnit.label": "Unit *",
    "quote.air.height.label": "Height *",
    "quote.air.height.placeholder": "e.g., 10",
    "quote.air.heightUnit.label": "Unit *",

    "quote.general.monthlyVolume.label": "Anticipated Monthly Volume *",
    "quote.general.monthlyVolume.placeholder": "e.g., 10–15 shipments per month, typical weights, lanes, etc.",
    "quote.shippingDetails.title": "Shipping Details",

    "quote.ocean.loadType.label": "Full Container Load (FCL) or Less than Container Load (LCL) *",
    "quote.ocean.incoterms.label": "Incoterms",
    "quote.ocean.incoterms.other": "Other / Not sure",
    "quote.ocean.loading.label": "Port of Loading *",
    "quote.ocean.destination.label": "Port of Destination *",

    "quote.trucking.loadType.label": "Full Truck Load (FTL) or Less than Truckload (LTL) *",
    "quote.trucking.incoterms.label": "Incoterms",
    "quote.trucking.incoterms.other": "Other / Not sure",
    "quote.trucking.city.label": "City *",
    "quote.trucking.region.label": "Province/State *",
    "quote.trucking.pallets.label": "How many pallets? *",
    "quote.trucking.pallets.placeholder": "e.g., 1",
    "quote.trucking.weight.label": "Total Weight *",
    "quote.trucking.weight.placeholder": "e.g., 500",
    "quote.trucking.weightUnit.label": "Weight unit *",
    "quote.trucking.length.label": "Length *",
    "quote.trucking.length.placeholder": "e.g., 40",
    "quote.trucking.lengthUnit.label": "Unit *",
    "quote.trucking.width.label": "Width *",
    "quote.trucking.width.placeholder": "e.g., 48",
    "quote.trucking.widthUnit.label": "Unit *",
    "quote.trucking.height.label": "Height *",
    "quote.trucking.height.placeholder": "e.g., 60",
    "quote.trucking.heightUnit.label": "Unit *",

    "quote.doorDelivery.label": "Do you need delivery to your door? *",

    "quote.commodity.label": "What commodity are you planning to ship? *",
    "quote.commodity.placeholder": "Brief description of your goods",

    "quote.hazard.legend": "Is your commodity hazardous? *",

    "quote.insurance.label": "Would you like to be covered through our insurance?",
    "quote.insurance.option.yes": "Yes",
    "quote.insurance.option.no": "No",
    "quote.insurance.option.unsure": "Not sure / please advise",

    "quote.commercialValue.label": "Commercial Value *",
    "quote.commercialValue.placeholder": "Declared commercial value",
    "quote.commercialCurrency.label": "Currency *",

    "quote.additionalDetails.label": "Additional Details",
    "quote.additionalDetails.placeholder": "Anything else we should know about this shipment or your needs?",

    "quote.submit": "Request a Quote Now!",

    "quote.common.yes": "Yes",
    "quote.common.no": "No",

    // PRIVACY POLICY PAGE
    "privacy.title": "Our Privacy Policy",
    "privacy.lastUpdated": "<strong>Last updated:</strong> September 2025",
    "privacy.intro": "At Magic Shipping (\u201cwe,\u201d \u201cour,\u201d \u201cus\u201d), your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you visit our website or request a shipping quote.",

    "privacy.section1.title": "1. Information We Collect",
    "privacy.section1.item1": "&bull;&nbsp;Contact details (name, email, phone number, company, address)",
    "privacy.section1.item2": "&bull;&nbsp;Shipment information (weight, dimensions, destination, declared contents)",
    "privacy.section1.item3": "&bull;&nbsp;Payment details (when applicable for shipping invoices)",
    "privacy.section1.item4": "&bull;&nbsp;Technical data (browser, IP address, device type) collected through analytics tools.",

    "privacy.section2.title": "2. How We Use Your Information",
    "privacy.section2.item1": "&bull;&nbsp;To provide shipping quotes, shipping bookings, and issue invoices",
    "privacy.section2.item2": "&bull;&nbsp;To communicate about shipments, service updates, or support inquiries",
    "privacy.section2.item3": "&bull;&nbsp;To comply with Canadian export or tax regulations",
    "privacy.section2.item4": "&bull;&nbsp;To improve our website and services.",

    "privacy.section3.title": "3. Data Sharing",
    "privacy.section3.intro": "We may share limited information with:",
    "privacy.section3.item1": "&bull;&nbsp;Courier/shipping partners (e.g., DHL, FedEx, UPS) for shipment processing",
    "privacy.section3.item2": "&bull;&nbsp;Payment providers for secure transaction handling",
    "privacy.section3.item3": "&bull;&nbsp;Regulatory or customs agencies where required by law.",
    "privacy.section3.note": "We <strong>do not</strong> sell or rent your data to third parties.",

    "privacy.section4.title": "4. Data Retention &amp; Security",
    "privacy.section4.body": "We retain customer data only as long as necessary to complete transactions and meet legal obligations. We maintain appropriate safeguards to prevent unauthorized access.",

    "privacy.section5.title": "5. Your Rights",
    "privacy.section5.body": "You may request access to, correction of, or deletion of your data by contacting <a class=\"privacy__info-primary\" href=\"mailto:admin@mymagicshipping.com\">admin@mymagicshipping.com</a>.",

    // FAQ
    "faq.title": "Frequently Asked Questions (FAQs)",
    "faq.q1": "What types of shipping do you offer?",
    "faq.a1": "We act as an authorized reseller for DHL Express and many other shipping partners. We offer Air Express (1–3 days), Trucking (LTL/FTL), and Ocean Freight services for domestic and international shipments.",

    "faq.q2": "How do I request a quote?",
    "faq.a2": "Click “Get a Quote” on our website, fill out the online form with your shipment details (weight, dimensions, origin/destination, etc.) and submit. You’ll receive a personalized email quote within 24 hours.",

    "faq.q3": "What payment methods do you accept?",
    "faq.a3": "All major credit and debit cards are accepted via secure payment link or invoice, depending on your preference.",

    "faq.q4": "Are duties and taxes included?",
    "faq.a4": "Quotes include Canadian taxes and surcharges; foreign duties and VAT are determined by destination country customs.",

    "faq.q5": "Do you offer insurance?",
    "faq.a5": "Yes, optional (and highly recommended) shipment insurance is available at the time of booking.",

    "faq.q6": "Where are you located?",
    "faq.a6": "Although we don’t have a physical retail location yet, our team is based in Toronto, Ontario, Canada and we provide shipping services across North America and beyond.",

    // T&C

    "terms.title": "Terms and Conditions",
    "terms.effectiveDateLabel": "Effective Date:",
    "terms.effectiveDateValue": "September 2025",
    "terms.intro":
      "Magic Shipping (operated by 16608809 Canada Inc.) provides air, ground, and ocean freight services through its authorized carrier partners.",

    "terms.section1.title": "1. Services Provided",
  "terms.section1.body1":
    "We act as an authorized reseller for DHL Express and other carriers. Shipments are billed in CAD and governed by each carrier’s service terms.",

    "terms.section2.title": "2. Quotes and Payment",
    "terms.section2.body1":
      "Quotes are valid for 7 days. Payment is required before pickup. Charges may be adjusted if actual weight, dimensions, or customs fees differ from the information provided by the customer. Payment must be made in full before pick-up is scheduled.",
    "terms.section2.body2":
    "All quotes provided by Magic Shipping are based solely on the shipment information supplied by the customer, including weight, dimensions, and declared contents. Final charges are determined by the shipping partner and may be subject to adjustment following shipment delivery. In particular, carriers and/or the Canada Border Services Agency (CBSA) may re-measure or re-weigh shipments to confirm the actual net weight or volumetric weight. If the final billed amount from the carrier exceeds the original quoted amount due to discrepancies in the shipment information provided, Magic Shipping reserves the right to issue an adjusted invoice to the customer reflecting the actual shipping costs. Customers agree to pay any such additional charges within 3 business days of receiving the revised invoice. Failure to pay the adjusted invoice may result in suspension of future services and/or collection actions.",
    "terms.section2.body3":
      "In certain cases, the exporter (shipper) may be responsible for paying duties, taxes, or other customs-related charges normally billed to the receiver. Where applicable, Magic Shipping will prepare an estimate of such costs based on the commodity information (HS/Customs Tariff Code) provided by the customer. All such estimates are provided for reference only. The final amount of duties and taxes is determined by the customs authority of the destination country and may differ from the original estimate. If the final amount billed to Magic Shipping by the carrier or the relevant customs authority exceeds the estimated amount invoiced to the customer, Magic Shipping reserves the right to issue an adjusted invoice reflecting the actual charges. Customers agree to pay such adjustments within 7 business days of receiving the revised invoice. Failure to pay may result in suspension of future services and/or collection actions.",

    "terms.section3.title": "3. Liability and Claims",
    "terms.section3.body1":
      "All shipments are subject to the carrier’s service terms, limitations of liability, and conditions of carriage.",
    "terms.section3.body2":
      "Magic Shipping is not liable for delays, customs issues, or carrier damages, but we will actively support customers in resolving claims with each carrier.",
    "terms.section3.body3":
      "All destination-country duties, taxes, or VAT are the responsibility of the shipper or recipient, in accordance with the carrier’s standard terms.",

      "terms.section4.title": "4. Export Compliance",
    "terms.section4.intro":
      "For shipments originating from Canada to destinations outside the United States, Puerto Rico, or the U.S. Virgin Islands, customers are responsible for ensuring compliance with Canadian export regulations. In particular:",
    "terms.section4.bullet1":
      "Goods with a value of CAD 2,000 or more may require an export declaration.",
    "terms.section4.bullet2":
      "Prohibited, controlled, or regulated goods may also require export permits or declarations.",
    "terms.section4.bullet3":
      "Export declarations must be filed electronically through the CBSA’s CERS (Canadian Export Reporting System) portal.",

    "terms.section5.title": "5. Insurance",
    "terms.section5.body1":
      "Customers may request shipment insurance at the time of booking. Shipment insurance is the ONLY way customers can receive the full value of the shipment back in case of damage, loss, theft or any other unforeseen circumstance. Otherwise, customers may not receive a full refund of the value of their shipment and instead receive a partial refund based on the terms of the carriage.",
    "terms.section5.body2":
      "Insurance is billed as an additional service.",

    "terms.section6.title": "6. Taxes and Refunds",
    "terms.section6.body1":
      "All quotes include taxes and surcharges. Refund requests must be submitted in writing to admin@mymagicshipping.com.",

    // Quote Request Thank you
    
    "thank.heading": "Thank you, your quote request has been received.",
    "thank.text":
    "Our team is reviewing your shipment details and will email you a personalized quote within 24 hours.",
    "thank.getAnother": "Get another Quote",
    "thank.backHome": "Back to Home",

    // Carrier Request Thank you
    "thank.carrier.heading": "Thank you for your request to become a carrier with Magic Shipping.",
    "thank.carrier.text": "We will reach out as soon as there is a quote request with your specified asset resource required.",
    "thank.carrier.viewServices": "View Shipping Services",

    // Email Newsletter Thank You Page
    "thank.news.heading": "Thank you for subscribing to Magic Shipping updates.",
    "thank.news.text": "You’ll start receiving occasional emails with shipping tips, service updates and special offers.",
    "thank.news.viewServices": "View Shipping Services",

    // footer (shared)
    "footer.quickLinks.heading": "Quick Links",
    "footer.additional.heading": "Additional Information",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms and Conditions",
    "footer.faqs": "FAQs",
    "footer.sitemap": "Sitemap",
    "footer.contact.heading": "Contact Us",
    "footer.contact.emailLink": "Email: admin@mymagicshipping.com",
    "footer.newsletter.heading": "Newsletter Signup",
    "footer.newsletter.label": "Sign Up",
    "footer.newsletter.placeholder": "Enter email to get updates",
    "footer.copyright": "© 2025 Magic Shipping. All rights reserved"
  },

  fr: {
    // meta
    "meta.title": "Magic Shipping | Logistique & Services de Fret Aérien, Maritime et International",
    "meta.services.title": "Magic Shipping | Services",
    "meta.carriers.title": "Magic Shipping | Transporteurs",
    "meta.insights.title": "Magic Shipping | Actualités",
    "meta.quote.title": "Magic Shipping | Obtenir un devis",
    "meta.privacy.title": "Magic Shipping | Politique de confidentialité",
    "meta.faqs.title": "Magic Shipping | FAQ",
    "meta.terms.title": "Magic Shipping | Termes et conditions",
    "meta.thankyou.title": "Magic Shipping | Demande soumise !",

    // nav
    "nav.home": "Accueil",
    "nav.about": "À propos",
    "nav.contact": "Nous joindre",
    "nav.services": "Services",
    "nav.carriers": "Transporteurs",
    "nav.insights": "Articles",
    "nav.quote": "Obtenir un devis",

    // hero (index)
    "hero.title": "Chez Magic Shipping, nous sommes spécialisés dans des solutions internationales fiables en transport aérien express, en camionnage et en fret.",
    "hero.line1": "Nous aidons les entreprises et les particuliers à expédier partout dans le monde grâce au suivi en temps réel, à un réseau de partenaires fiables et à des tarifs préférentiels.",
    "hero.line2": "Profitez de services de transport de classe mondiale pour une fraction des tarifs de détail. Contactez-nous pour obtenir un devis.",
    "hero.ctaPrimary": "Obtenir un devis",
    "hero.ctaSecondary": "Nous écrire",

    "hero.service.air.title": "Express aérien",
    "hero.service.air.desc": "Service porte-à-porte",
    "hero.service.trucking.title": "Transport routier",
    "hero.service.trucking.desc": "Services FTL / LTL",
    "hero.service.ocean.title": "Fret maritime",
    "hero.service.ocean.desc": "Services par conteneur",
    "hero.service.tracking.title": "Suivi en temps réel",
    "hero.service.tracking.desc": "et soutien professionnel",

    // about (index)
    "about.heading": "À propos de nous : qui nous sommes",
    "about.text1": "Magic Shipping est un fournisseur de services logistiques basé à Toronto, spécialisé dans l’expédition internationale économique par express aérien grâce à nos partenariats avec DHL Express, FedEx et UPS. Nous offrons également des services de camionnage national et de fret maritime à tous nos clients; des grandes entreprises expédiant des conteneurs complets aux particuliers qui envoient un seul document, nous sommes là pour répondre à tous les besoins d’expédition. Grâce à d’importants rabais corporatifs, nous permettons aux entreprises et aux particuliers de profiter de services de transport de classe mondiale à une fraction des tarifs de détail.",
    "about.missionTitle": "Notre mission",
    "about.missionText": "Simplifier et réduire le coût des expéditions nationales et internationales pour les entreprises et les particuliers, tout en assurant un service fiable, un suivi complet et un soutien professionnel tout au long du processus.",
    "about.visionTitle": "Notre vision",
    "about.visionText": "Magic Shipping vise à offrir une logistique mondiale fluide grâce à des partenariats de confiance, des prix transparents et un engagement constant envers l’excellence du service.",

    // testimonials (index)
    "testimonials.heading": "Témoignages : ce que nos clients disent de nous",
    "testimonials.subheading": "Découvrez ce que disent certains de nos formidables clients.",

    "testimonials.card1.text": "« Cette boutique ne m’a jamais déçu. Le choix de produits est vaste, les prix sont très raisonnables et le service à la clientèle est excellent. »",
    "testimonials.card1.name": "Nom complet",
    "testimonials.card1.role": "Chef de produit, Société 1",

    "testimonials.card2.text": "« Leurs services de réparation m’ont sauvé la vie! Ils ont réparé mon téléphone endommagé par l’eau alors que je pensais qu’il était perdu. Je recommande fortement! »",
    "testimonials.card2.name": "Nom complet",
    "testimonials.card2.role": "Directrice du design, Société 2",

    "testimonials.card3.text": "« L’écran de mon téléphone était complètement brisé et je pensais devoir en acheter un nouveau, mais le service de réparation m’a fait économiser beaucoup d’argent. L’écran a l’air comme neuf! »",
    "testimonials.card3.name": "Nom complet",
    "testimonials.card3.role": "Designer UX, Société 3",

    // contact (index)
    "contact.heading": "Nous joindre",
    "contact.subheading1": "Des questions ou besoin d’un devis?",
    "contact.subheading2": "Communiquez avec Magic Shipping! Notre équipe de soutien à la clientèle, sympathique et expérimentée, est prête à vous aider. Écrivez-nous par courriel ou appelez-nous; pour toute demande de devis, remplissez simplement notre formulaire en ligne et nous vous répondrons avec une offre personnalisée dans les 24 heures. N’hésitez pas à nous contacter pour tous vos besoins d’expédition!",

    "contact.email.heading": "Courriel",
    "contact.email.desc": "Notre équipe est là pour vous aider.",
    "contact.email.address": "admin@mymagicshipping.com",

    "contact.phone.heading": "Téléphone",
    "contact.phone.desc": "Appelez-nous dès maintenant!",
    "contact.phone.number": "123-456-7890",

    "contact.quote.heading": "Obtenir un devis",
    "contact.quote.desc": "Remplissez notre formulaire en ligne dès maintenant!",
    "contact.quote.link": "Obtenir un devis",

    // SERVICES PAGE
    "services.heading": "Services : ce que nous offrons",
    "services.intro": "Chez Magic Shipping, nous sommes fiers de notre approche simplifiée pour offrir des services d’expédition de grande qualité. Notre objectif est de fournir un transport rapide et fiable pour vos marchandises, qui dépasse vos attentes. Découvrez ci-dessous les services d’expédition avec lesquels nous pouvons vous aider.",

    "services.card.air.title": "Express aérien",
    "services.card.air.p1": "En tant que partenaire autorisé DHL Express, profitez d’économies exclusives grâce à nos rabais corporatifs. Expédiez des documents et des colis partout dans le monde avec un suivi complet en temps réel.",
    "services.card.air.p2": "Livraison de nuit vers et depuis les États-Unis. Expédition en 3 jours vers et depuis la Chine. Service rapide et fiable.",

    "services.card.ltl.title": "LTL / FTL",
    "services.card.ltl.p1": "Nous vous mettons en relation avec les meilleures compagnies de transport routier pour tous vos besoins LTL et FTL.",
    "services.card.ltl.p2": "Liaisons intérieures au Canada ainsi que routes internationales vers les États-Unis et le Mexique.",

    "services.card.ocean.title": "Fret maritime",
    "services.card.ocean.p1": "Notre vaste réseau mondial nous permet d’offrir des options de fret maritime LCL et FCL à des tarifs très compétitifs.",
    "services.card.ocean.p2": "Un soutien professionnel et fiable pour toutes vos cargaisons conteneurisées.",

    "services.card.expedite.title": "Service urgent",
    "services.card.expedite.p1": "Lorsque le temps est critique, Magic Shipping est prête à intervenir. Nous sommes spécialisés dans les solutions d’expédition urgente — messageries, fourgonnettes, camions cubes, services aériens urgents, vols nolisés et transport accompagné.",
    "services.card.expedite.p2": "Disponibilité réelle 24/7 pour vos expéditions urgentes.",

    "services.card.hazmat.title": "Matières dangereuses",
    "services.card.hazmat.p1": "Nous offrons le transport de matières dangereuses au Canada et à l’international. Notre équipe vous aide pour l’emballage, la documentation et la conformité.",

    "services.card.temp.title": "Contrôle de température",
    "services.card.temp.p1": "Nous offrons des solutions pour les expéditions nécessitant un contrôle strict de la température.",
    "services.card.temp.p2": "Demandez comment nous garantissons la conformité de vos exigences thermiques.",

    "services.card.rail.title": "Transport ferroviaire",
    "services.card.rail.p1": "Le transport ferroviaire peut offrir des économies substantielles si vos délais le permettent.",
    
    "services.card.consulting.title": "Conseil",
    "services.card.consulting.p1": "Nous accompagnons les nouvelles entreprises comme les organisations établies dans l’optimisation de leurs stratégies logistiques.",

    "services.card.warehousing.title": "Entreposage",
    "services.card.warehousing.p1": "Accès à un réseau d’entrepôts partout aux États-Unis continentaux.",

    "services.card.whiteglove.title": "Service « gants blancs »",
    "services.card.whiteglove.p1": "Livraison premium incluant installation, montage, déballage et retrait des débris.",

    // carriers
    "carriers.form.title": "Inscription des transporteurs",
    "carriers.form.intro": "Veuillez remplir ce formulaire si vous souhaitez vous inscrire comme transporteur auprès de Magic Shipping.",

    "carriers.firstName.label": "Prénom *",
    "carriers.firstName.placeholder": "Prénom",

    "carriers.lastName.label": "Nom de famille *",
    "carriers.lastName.placeholder": "Nom de famille",

    "carriers.email.label": "Adresse courriel *",
    "carriers.email.placeholder": "vous@entreprise.com",

    "carriers.company.label": "Nom de l’entreprise",
    "carriers.company.placeholder": "Nom de l’entreprise (facultatif)",

    "carriers.phone.label": "Numéro de téléphone *",
    "carriers.phone.placeholder": "+1 (555) 555-5555",

    "carriers.website.label": "Site Web",
    "carriers.website.placeholder": "Site Web (facultatif)",

    "carriers.mc.label": "MC no *",
    "carriers.mc.placeholder": "MC no",

    "carriers.dot.label": "DOT no *",
    "carriers.dot.placeholder": "DOT no",

    "carriers.assets.label": "Ressources d’actifs *",
    "carriers.assets.placeholder": "Veuillez choisir",
    "carriers.assets.dryvan": "Fourgon sec",
    "carriers.assets.flatbed": "Plateforme",
    "carriers.assets.expedite": "Expédition urgente",
    "carriers.assets.reefer": "Camion réfrigéré",
    "carriers.assets.conestoga": "Conestoga / spécialisé",
    "carriers.assets.other": "Autre",

    "carriers.details.label": "Renseignements supplémentaires",
    "carriers.details.placeholder": "Détails supplémentaires (facultatif)",

    "carriers.submit": "Devenez notre transporteur!",
    
    // BLOG / INSIGHTS PAGE
    "blog.hero.title": "Actualités et analyses logistiques",
    "blog.hero.subtitle": "Articles et ressources sélectionnés sur l’express aérien, le transport routier et le fret maritime – provenant de sources fiables du secteur.",
    "blog.search.label": "Rechercher des articles",
    "blog.search.placeholder": "Rechercher par sujet, trajet ou mot-clé…",
    "blog.filters.label": "Filtrer par service :",
    "blog.filters.all": "Tous",
    "blog.filters.air": "Express aérien",
    "blog.filters.trucking": "Transport routier",
    "blog.filters.ocean": "Fret maritime",
    "blog.empty": "Aucun article ne correspond à votre recherche. Essayez un autre mot-clé ou choisissez un autre service.",
    "blog.readLink": "Lire l’article complet →",
    "blog.sourceLabel": "Source :",
    "blog.category.air": "Express aérien",
    "blog.category.trucking": "Transport routier",
    "blog.category.ocean": "Fret maritime",

    // Blog posts
    "blog.post1.title": "123Loadboard ajoute une assurance cargo grâce à son intégration avec MiKargo247",
    "blog.post1.excerpt": "123Loadboard s’associe à la plateforme numérique MiKargo247 pour permettre aux transporteurs et aux expéditeurs d’ajouter une assurance cargo instantanée, par trajet, jusqu’à 2 M$ directement dans le tableau de chargements.",
    "blog.post2.title": "Emirates SkyCargo explore la livraison de fret par drones",
    "blog.post2.excerpt": "Emirates SkyCargo collabore avec un fabricant de drones pour tester des appareils VTOL de fret, via des études de faisabilité et des démonstrations en direct sur son réseau.",
    "blog.post3.title": "Les taux spot Asie–Europe restent fermes tandis que les transporteurs recherchent du fret vers les États-Unis",
    "blog.post3.excerpt": "Les hausses FAK de mi-novembre continuent de soutenir les tarifs spot des conteneurs sur les liaisons Asie–Europe, tandis que les transporteurs cherchent à remplir leurs services vers l’Amérique du Nord.",

    // GET A QUOTE PAGE
    "quote.title": "Demander un devis",
    "quote.intro": "Si vous souhaitez obtenir un devis, veuillez remplir le formulaire ci-dessous et nous vous répondrons dans les 24 heures.",

    "quote.services.legend": "Pour quel(s) service(s) avez-vous besoin aujourd’hui?",
    "quote.services.air": "Express aérien",
    "quote.services.trucking": "Transport routier",
    "quote.services.ocean": "Fret maritime",
    "quote.services.note": "Veuillez sélectionner le ou les service(s) qui vous intéressent.",
    "quote.services.change": "Modifier le service",

    "quote.form.fromSection.title": "Expéditeur",
    "quote.form.toSection.title": "Destinataire",
    "quote.form.firstName.label": "Prénom *",
    "quote.form.firstName.placeholder": "Prénom",
    "quote.form.lastName.label": "Nom de famille *",
    "quote.form.lastName.placeholder": "Nom de famille",
    "quote.form.email.label": "Adresse courriel *",
    "quote.form.email.placeholder": "vous@entreprise.com",
    "quote.form.company.label": "Nom de l’entreprise",
    "quote.form.company.placeholder": "Nom de l’entreprise (facultatif)",
    "quote.form.phone.label": "Numéro de téléphone *",
    "quote.form.phone.placeholder": "+1 (555) 555-5555",
    "quote.form.website.label": "Site Web",
    "quote.form.website.placeholder": "Site Web (facultatif)",

    "quote.form.select.placeholder": "Veuillez choisir",

    "quote.air.fromCountry.label": "Pays/territoire *",
    "quote.air.fromCountry.placeholder": "Canada",
    "quote.air.toCountry.label": "Pays/territoire *",
    "quote.air.toCountry.placeholder": "États-Unis d’Amérique",

    "quote.air.fromAddress.label": "Adresse *",
    "quote.air.fromAddress.placeholder": "123, rue Mon Adresse",
    "quote.air.toAddress.label": "Adresse *",
    "quote.air.toAddress.placeholder": "123, rue Votre Adresse",

    "quote.air.fromPostal.label": "Code postal / ZIP *",
    "quote.air.fromPostal.placeholder": "A1A 1A1",
    "quote.air.fromCity.label": "Ville *",
    "quote.air.fromCity.placeholder": "Toronto",
    "quote.air.fromRegion.label": "Province/État *",
    "quote.air.fromRegion.placeholder": "Ontario",

    "quote.air.toPostal.label": "Code postal / ZIP *",
    "quote.air.toPostal.placeholder": "60139",
    "quote.air.toCity.label": "Ville *",
    "quote.air.toCity.placeholder": "Glendale Heights",
    "quote.air.toRegion.label": "Province/État *",
    "quote.air.toRegion.placeholder": "Illinois",

    "quote.air.residential": "Adresse résidentielle",

    "quote.air.shipment.legend": "Que souhaitez-vous expédier? *",
    "quote.air.shipment.documents": "Documents",
    "quote.air.shipment.parcels": "Colis",

    "quote.air.pieces.label": "Combien de colis/pièces? *",
    "quote.air.pieces.placeholder": "p. ex. 1",

    "quote.air.weight.label": "Poids total *",
    "quote.air.weight.placeholder": "p. ex. 10",
    "quote.air.weightUnit.label": "Unité de poids *",

    "quote.air.length.label": "Longueur *",
    "quote.air.length.placeholder": "p. ex. 10",
    "quote.air.lengthUnit.label": "Unité *",
    "quote.air.width.label": "Largeur *",
    "quote.air.width.placeholder": "p. ex. 10",
    "quote.air.widthUnit.label": "Unité *",
    "quote.air.height.label": "Hauteur *",
    "quote.air.height.placeholder": "p. ex. 10",
    "quote.air.heightUnit.label": "Unité *",

    "quote.general.monthlyVolume.label": "Volume mensuel estimé *",
    "quote.general.monthlyVolume.placeholder": "p. ex. 10–15 envois par mois, poids typiques, trajets, etc.",
    "quote.shippingDetails.title": "Détails d’expédition",

    "quote.ocean.loadType.label": "Chargement complet (FCL) ou partiel (LCL) *",
    "quote.ocean.incoterms.label": "Incoterms",
    "quote.ocean.incoterms.other": "Autre / Incertain",
    "quote.ocean.loading.label": "Port de chargement *",
    "quote.ocean.destination.label": "Port de destination *",

    "quote.trucking.loadType.label": "Chargement complet (FTL) ou partiel (LTL) *",
    "quote.trucking.incoterms.label": "Incoterms",
    "quote.trucking.incoterms.other": "Autre / Incertain",
    "quote.trucking.city.label": "Ville *",
    "quote.trucking.region.label": "Province/État *",
    "quote.trucking.pallets.label": "Combien de palettes? *",
    "quote.trucking.pallets.placeholder": "p. ex. 1",
    "quote.trucking.weight.label": "Poids total *",
    "quote.trucking.weight.placeholder": "p. ex. 500",
    "quote.trucking.weightUnit.label": "Unité de poids *",
    "quote.trucking.length.label": "Longueur *",
    "quote.trucking.length.placeholder": "p. ex. 40",
    "quote.trucking.lengthUnit.label": "Unité *",
    "quote.trucking.width.label": "Largeur *",
    "quote.trucking.width.placeholder": "p. ex. 48",
    "quote.trucking.widthUnit.label": "Unité *",
    "quote.trucking.height.label": "Hauteur *",
    "quote.trucking.height.placeholder": "p. ex. 60",
    "quote.trucking.heightUnit.label": "Unité *",

    "quote.doorDelivery.label": "Avez-vous besoin d’une livraison à votre porte? *",

    "quote.commodity.label": "Quel type de marchandise prévoyez-vous expédier? *",
    "quote.commodity.placeholder": "Brève description de vos marchandises",

    "quote.hazard.legend": "Votre marchandise est-elle dangereuse? *",

    "quote.insurance.label": "Souhaitez-vous bénéficier de notre couverture d’assurance?",
    "quote.insurance.option.yes": "Oui",
    "quote.insurance.option.no": "Non",
    "quote.insurance.option.unsure": "Incertain / veuillez nous conseiller",

    "quote.commercialValue.label": "Valeur commerciale *",
    "quote.commercialValue.placeholder": "Valeur commerciale déclarée",
    "quote.commercialCurrency.label": "Devise *",

    "quote.additionalDetails.label": "Détails supplémentaires",
    "quote.additionalDetails.placeholder": "Tout autre renseignement à propos de cet envoi ou de vos besoins?",

    "quote.submit": "Demander un devis maintenant!",

    "quote.common.yes": "Oui",
    "quote.common.no": "Non",

    // PRIVACY POLICY PAGE
    "privacy.title": "Notre politique de confidentialité",
    "privacy.lastUpdated": "<strong>Dernière mise à jour :</strong> septembre 2025",
    "privacy.intro": "Chez Magic Shipping (\u00ab nous \u00bb, \u00ab notre \u00bb, \u00ab nos \u00bb), la protection de votre vie privée est importante. La présente politique de confidentialité explique comment nous recueillons, utilisons et protégeons vos renseignements personnels lorsque vous visitez notre site Web ou demandez un devis d\u2019expédition.",

    "privacy.section1.title": "1. Renseignements que nous recueillons",
    "privacy.section1.item1": "&bull;&nbsp;Coordonnées (nom, adresse courriel, numéro de téléphone, entreprise, adresse postale)",
    "privacy.section1.item2": "&bull;&nbsp;Renseignements sur l\u2019expédition (poids, dimensions, destination, description des marchandises)",
    "privacy.section1.item3": "&bull;&nbsp;Renseignements de paiement (le cas échéant, pour la facturation des services d\u2019expédition)",
    "privacy.section1.item4": "&bull;&nbsp;Données techniques (navigateur, adresse IP, type d\u2019appareil) recueillies au moyen d\u2019outils d\u2019analyse.",

    "privacy.section2.title": "2. Comment nous utilisons vos renseignements",
    "privacy.section2.item1": "&bull;&nbsp;Pour préparer des devis, organiser les expéditions et émettre les factures",
    "privacy.section2.item2": "&bull;&nbsp;Pour communiquer au sujet des envois, des mises à jour de service ou de demandes de soutien",
    "privacy.section2.item3": "&bull;&nbsp;Pour respecter les exigences des lois canadiennes en matière d\u2019exportation ou de fiscalité",
    "privacy.section2.item4": "&bull;&nbsp;Pour améliorer notre site Web et nos services.",

    "privacy.section3.title": "3. Partage de données",
    "privacy.section3.intro": "Nous pouvons partager une quantité limitée de renseignements avec :",
    "privacy.section3.item1": "&bull;&nbsp;Des partenaires de transport ou de messagerie (p. ex. DHL, FedEx, UPS) pour le traitement des envois",
    "privacy.section3.item2": "&bull;&nbsp;Des fournisseurs de services de paiement pour le traitement sécurisé des transactions",
    "privacy.section3.item3": "&bull;&nbsp;Des autorités réglementaires ou douanières lorsque la loi l\u2019exige.",
    "privacy.section3.note": "Nous <strong>ne vendons ni ne louons</strong> vos renseignements personnels à des tiers.",

    "privacy.section4.title": "4. Conservation et sécurité des données",
    "privacy.section4.body": "Nous conservons les données des clients uniquement pendant la période nécessaire pour mener à bien les transactions et respecter nos obligations légales. Nous appliquons des mesures de sécurité appropriées afin de prévenir tout accès non autorisé.",

    "privacy.section5.title": "5. Vos droits",
    "privacy.section5.body": "Vous pouvez demander d\u2019accéder à vos renseignements, de les corriger ou de les supprimer en écrivant à <a class=\"privacy__info-primary\" href=\"mailto:admin@mymagicshipping.com\">admin@mymagicshipping.com</a>.",

    // FAQ
    "faq.title": "Foire aux questions (FAQ)",
    "faq.q1": "Quels types de services d’expédition offrez-vous ?",
    "faq.a1": "Nous agissons comme revendeur autorisé pour DHL Express et plusieurs autres partenaires de transport. Nous proposons des services d’express aérien (1 à 3 jours), de transport routier (LTL/FTL) et de fret maritime pour les expéditions au Canada et à l’international.",

    "faq.q2": "Comment puis-je demander un devis ?",
    "faq.a2": "Cliquez sur « Obtenir un devis » sur notre site, remplissez le formulaire en ligne avec les détails de votre envoi (poids, dimensions, origine / destination, etc.) puis soumettez-le. Vous recevrez une offre personnalisée par courriel dans les 24 heures.",

    "faq.q3": "Quels modes de paiement acceptez-vous ?",
    "faq.a3": "Nous acceptons toutes les principales cartes de crédit et de débit, par lien de paiement sécurisé ou facture, selon votre préférence.",

    "faq.q4": "Les droits et taxes sont-ils inclus ?",
    "faq.a4": "Nos devis incluent les taxes et surcharges canadiennes. Les droits de douane et la TVA à l’étranger sont déterminés par les autorités douanières du pays de destination.",

    "faq.q5": "Offrez-vous une assurance ?",
    "faq.a5": "Oui, une assurance facultative (fortement recommandée) est offerte au moment de la réservation de l’envoi.",

    "faq.q6": "Où êtes-vous situés ?",
    "faq.a6": "Même si nous n’avons pas encore de point de service physique, notre équipe est basée à Toronto (Ontario, Canada) et nous offrons des services d’expédition partout en Amérique du Nord et au-delà.",

    // T&C
    "terms.title": "Conditions générales",
    "terms.effectiveDateLabel": "Date d’entrée en vigueur :",
    "terms.effectiveDateValue": "Septembre 2025",
    "terms.intro":
    "Magic Shipping (exploitée par 16608809 Canada Inc.) fournit des services de transport aérien, routier et maritime par l’entremise de ses transporteurs partenaires autorisés.",

    "terms.section1.title": "1. Services fournis",
    "terms.section1.body1":
    "Nous agissons comme revendeur autorisé de DHL Express et d’autres transporteurs. Les envois sont facturés en dollars canadiens (CAD) et sont assujettis aux conditions de service de chaque transporteur.",

    "terms.section2.title": "2. Devis et paiement",
    "terms.section2.body1":
    "Les devis sont valides pendant 7 jours. Le paiement est exigé avant la collecte. Les frais peuvent être ajustés si le poids réel, les dimensions ou les frais de douane diffèrent de l’information fournie par le client. Le paiement complet doit être reçu avant la planification de la collecte.",
    "terms.section2.body2":
    "Tous les devis fournis par Magic Shipping se fondent uniquement sur les renseignements d’expédition fournis par le client, notamment le poids, les dimensions et la description des marchandises. Les frais finaux sont déterminés par le transporteur et peuvent être ajustés après la livraison de l’envoi. En particulier, les transporteurs et/ou l’Agence des services frontaliers du Canada (ASFC) peuvent re-mesurer ou re-peser les envois afin de confirmer le poids réel ou volumétrique. Si le montant final facturé par le transporteur dépasse le montant initialement indiqué en raison d’écarts dans l’information fournie, Magic Shipping se réserve le droit d’émettre une facture ajustée reflétant les coûts réels d’expédition. Le client accepte de payer ces frais supplémentaires dans les 3 jours ouvrables suivant la réception de la facture révisée. Le défaut de paiement peut entraîner la suspension des services futurs et/ou des mesures de recouvrement.",
    "terms.section2.body3":
    "Dans certains cas, l’exportateur (expéditeur) peut être responsable du paiement des droits, taxes ou autres frais liés aux douanes qui sont normalement facturés au destinataire. Le cas échéant, Magic Shipping préparera une estimation de ces coûts en fonction des renseignements sur la marchandise (code SH/tarif des douanes) fournis par le client. Ces estimations sont fournies à titre indicatif seulement. Le montant final des droits et taxes est déterminé par l’autorité douanière du pays de destination et peut différer de l’estimation initiale. Si le montant final facturé à Magic Shipping par le transporteur ou l’autorité douanière dépasse le montant estimé facturé au client, Magic Shipping se réserve le droit d’émettre une facture ajustée reflétant les frais réels. Le client accepte de payer ces ajustements dans les 7 jours ouvrables suivant la réception de la facture révisée. Le défaut de paiement peut entraîner la suspension des services futurs et/ou des mesures de recouvrement.",

    "terms.section3.title": "3. Responsabilité et réclamations",
    "terms.section3.body1":
    "Tous les envois sont assujettis aux conditions de service, limitations de responsabilité et conditions de transport du transporteur.",
    "terms.section3.body2":
    "Magic Shipping n’est pas responsable des retards, problèmes de douane ou dommages causés par le transporteur, mais nous aidons activement nos clients dans le traitement de leurs réclamations auprès de chaque transporteur.",
    "terms.section3.body3":
    "Tous les droits, taxes ou TVA exigés dans le pays de destination sont à la charge de l’expéditeur ou du destinataire, conformément aux conditions standards du transporteur.",

    "terms.section4.title": "4. Conformité à l’exportation",
    "terms.section4.intro":
    "Pour les envois en provenance du Canada à destination de pays autres que les États-Unis, Porto Rico ou les îles Vierges américaines, il incombe au client de s’assurer du respect de la réglementation canadienne sur les exportations. En particulier :",
    "terms.section4.bullet1":
    "Les marchandises d’une valeur de 2 000 $ CA ou plus peuvent nécessiter une déclaration d’exportation.",
    "terms.section4.bullet2":
    "Les marchandises interdites, contrôlées ou réglementées peuvent également nécessiter des permis ou déclarations d’exportation.",
    "terms.section4.bullet3":
    "Les déclarations d’exportation doivent être transmises électroniquement au moyen du portail CERS (Système canadien de déclaration des exportations) de l’ASFC.",

    "terms.section5.title": "5. Assurance",
    "terms.section5.body1":
    "Les clients peuvent demander une assurance pour leur envoi au moment de la réservation. L’assurance est le SEUL moyen pour les clients d’obtenir le remboursement intégral de la valeur de l’envoi en cas de dommage, perte, vol ou autre événement imprévu. Sans assurance, ils pourraient ne recevoir qu’un remboursement partiel selon les conditions de transport.",
    "terms.section5.body2":
    "L’assurance est facturée comme un service additionnel.",

    "terms.section6.title": "6. Taxes et remboursements",
    "terms.section6.body1":
    "Tous les devis incluent les taxes et suppléments. Toute demande de remboursement doit être présentée par écrit à l’adresse admin@mymagicshipping.com.",

    // Quote Request Thank you
    "thank.heading": "Merci, nous avons bien reçu votre demande de devis.",
    "thank.text":
    "Notre équipe examine les détails de votre envoi et vous enverra un devis personnalisé par courriel dans les 24 heures.",
    "thank.getAnother": "Obtenir un autre devis",
    "thank.backHome": "Retour à l’accueil",

    // Carrier Request Thank you
    "thank.carrier.heading": "Merci pour votre demande pour devenir transporteur avec Magic Shipping.",
    "thank.carrier.text": "Nous vous contacterons dès qu’une demande de devis nécessitera le type d’actifs que vous proposez.",
    "thank.carrier.viewServices": "Voir nos services d’expédition",

    // Email Newsletter Thank You Page
    "thank.news.heading": "Merci de vous être abonné aux mises à jour de Magic Shipping.",
    "thank.news.text": "Vous commencerez à recevoir des courriels occasionnels contenant des conseils d’expédition, des mises à jour de services et des offres spéciales.",
    "thank.news.viewServices": "Voir nos services d’expédition",
    "thank.backHome": "Retour à l’accueil",

    // footer
    "footer.quickLinks.heading": "Liens rapides",
    "footer.additional.heading": "Informations supplémentaires",
    "footer.privacy": "Politique de confidentialité",
    "footer.terms": "Modalités et conditions",
    "footer.faqs": "FAQ",
    "footer.sitemap": "Plan du site",
    "footer.contact.heading": "Nous joindre",
    "footer.contact.emailLink": "Courriel : admin@mymagicshipping.com",
    "footer.newsletter.heading": "Inscription à l’infolettre",
    "footer.newsletter.label": "S’inscrire",
    "footer.newsletter.placeholder": "Entrez votre courriel pour recevoir nos nouvelles",
    "footer.copyright": "© 2025 Magic Shipping. Tous droits réservés"
},

  es: {
    // meta
    "meta.title": "Magic Shipping | Logística y Servicios Globales de Carga Aérea, Marítima y Terrestre",
    "meta.services.title": "Magic Shipping | Servicios",
    "meta.carriers.title": "Magic Shipping | Transportistas",
    "meta.insights.title": "Magic Shipping | Noticias",
    "meta.quote.title": "Magic Shipping | Solicitar cotización",
    "meta.privacy.title": "Magic Shipping | Política de privacidad",
    "meta.faqs.title": "Magic Shipping | Preguntas frecuentes",
    "meta.terms.title": "Magic Shipping | Términos y condiciones",
    "meta.thankyou.title": "Magic Shipping | ¡Solicitud enviada!",

    // nav
    "nav.home": "Inicio",
    "nav.about": "Sobre nosotros",
    "nav.contact": "Contáctenos",
    "nav.services": "Servicios",
    "nav.carriers": "Transportistas",
    "nav.insights": "Artículos",
    "nav.quote": "Solicitar cotización",

    // hero
    "hero.title": "En Magic Shipping, nos especializamos en soluciones internacionales confiables de envío aéreo exprés, transporte por carretera y servicios de carga.",
    "hero.line1": "Ayudamos a empresas y particulares a enviar a todo el mundo con seguimiento en tiempo real, una red de socios confiables y tarifas preferenciales.",
    "hero.line2": "Obtenga servicios de envío de clase mundial por una fracción del precio minorista. Contáctenos para solicitar una cotización.",
    "hero.ctaPrimary": "Solicitar cotización",
    "hero.ctaSecondary": "Escríbanos",

    "hero.service.air.title": "Envío aéreo exprés",
    "hero.service.air.desc": "Servicio puerta a puerta",
    "hero.service.trucking.title": "Transporte por camión",
    "hero.service.trucking.desc": "Servicios FTL / LTL",
    "hero.service.ocean.title": "Flete marítimo",
    "hero.service.ocean.desc": "Servicios en contenedor",
    "hero.service.tracking.title": "Seguimiento en tiempo real",
    "hero.service.tracking.desc": "y soporte profesional",

    // about
    "about.heading": "Quiénes somos",
    "about.text1": "Magic Shipping es un proveedor de logística con sede en Toronto, especializado en envíos internacionales económicos por mensajería aérea gracias a nuestras alianzas con DHL Express, FedEx y UPS. También ofrecemos servicios de transporte por camión dentro de Canadá y de carga marítima para todo tipo de clientes. Con importantes descuentos corporativos, ayudamos a empresas y particulares a acceder a servicios de envío de clase mundial.",
    "about.missionTitle": "Nuestra misión",
    "about.missionText": "Simplificar y reducir el costo de los envíos nacionales e internacionales para empresas y particulares.",
    "about.visionTitle": "Nuestra visión",
    "about.visionText": "Magic Shipping busca ofrecer logística global fluida con alianzas confiables y precios transparentes.",

    // testimonials
    "testimonials.heading": "Testimonios: lo que dicen nuestros clientes",
    "testimonials.subheading": "Conozca lo que comentan algunos de nuestros increíbles clientes.",

    "testimonials.card1.text": "“Esta tienda nunca me ha decepcionado. Amplia variedad de productos, buenos precios y excelente servicio al cliente.”",
    "testimonials.card1.name": "Nombre completo",
    "testimonials.card1.role": "Gerente de producto, Empresa 1",

    "testimonials.card2.text": "“¡Sus servicios de reparación me salvaron! Arreglaron mi teléfono dañado por agua. Muy recomendados.”",
    "testimonials.card2.name": "Nombre completo",
    "testimonials.card2.role": "Jefa de diseño, Empresa 2",

    "testimonials.card3.text": "“La pantalla de mi teléfono estaba destrozada y ahora se ve como nueva. Un excelente servicio de reparación.”",
    "testimonials.card3.name": "Nombre completo",
    "testimonials.card3.role": "Diseñador UX, Empresa 3",

    // contact
    "contact.heading": "Contáctenos",
    "contact.subheading1": "¿Tiene preguntas o necesita una cotización?",
    "contact.subheading2": "Nuestro equipo está listo para ayudarle. Complete el formulario para recibir una oferta personalizada dentro de las 24 horas.",

    "contact.email.heading": "Correo electrónico",
    "contact.email.desc": "Nuestro equipo está aquí para ayudarle.",
    "contact.email.address": "admin@mymagicshipping.com",

    "contact.phone.heading": "Teléfono",
    "contact.phone.desc": "¡Llámenos ahora!",
    "contact.phone.number": "123-456-7890",

    "contact.quote.heading": "Solicitar cotización",
    "contact.quote.desc": "Complete nuestro formulario en línea ahora mismo!",
    "contact.quote.link": "Solicitar cotización",

    // SERVICES PAGE
    "services.heading": "Servicios: lo que ofrecemos",
    "services.intro": "En Magic Shipping nos enorgullece ofrecer servicios excepcionales de envío con un enfoque eficiente y confiable.",

    "services.card.air.title": "Envío aéreo exprés",
    "services.card.air.p1": "Como socio autorizado de DHL Express, disfrute de ahorros exclusivos mediante nuestros descuentos corporativos.",
    "services.card.air.p2": "Envíos al día siguiente hacia/desde EE.UU. y en 3 días hacia/desde China.",

    "services.card.ltl.title": "LTL / FTL",
    "services.card.ltl.p1": "Conectamos su carga con las mejores empresas de transporte por camión.",
    "services.card.ltl.p2": "Rutas dentro de Canadá y rutas internacionales hacia EE.UU. y México.",

    "services.card.ocean.title": "Flete marítimo",
    "services.card.ocean.p1": "Acceso a una red global con opciones LCL y FCL a tarifas competitivas.",
    "services.card.ocean.p2": "Soporte profesional para sus cargas conteneurizadas.",

    "services.card.expedite.title": "Servicio urgente",
    "services.card.expedite.p1": "Soluciones urgentes rápidas y flexibles: mensajería, vans, camiones, aéreo urgente y vuelos chárter.",
    "services.card.expedite.p2": "Disponibilidad real las 24 horas.",

    "services.card.hazmat.title": "Materiales peligrosos",
    "services.card.hazmat.p1": "Transporte nacional e internacional de mercancías peligrosas. Asesoría en embalaje y documentación.",

    "services.card.temp.title": "Control de temperatura",
    "services.card.temp.p1": "Soluciones para productos sensibles a la temperatura.",
    "services.card.temp.p2": "Monitoreo completo del cumplimiento de temperatura.",

    "services.card.rail.title": "Transporte ferroviario",
    "services.card.rail.p1": "Ahorros significativos cuando el tiempo de tránsito lo permite.",

    "services.card.consulting.title": "Consultoría",
    "services.card.consulting.p1": "Asesoría personalizada para empresas nuevas o establecidas para optimizar su logística.",

    "services.card.warehousing.title": "Almacenamiento",
    "services.card.warehousing.p1": "Acceso a instalaciones de almacenamiento en todo EE.UU.",

    "services.card.whiteglove.title": "Servicio de alta atención",
    "services.card.whiteglove.p1": "Entrega premium con instalación, montaje, desembalaje y retiro de residuos.",

    // carriers
    "carriers.form.title": "Registro de transportistas",
    "carriers.form.intro": "Complete el siguiente formulario si desea registrarse como transportista.",

    "carriers.firstName.label": "Nombre *",
    "carriers.firstName.placeholder": "Nombre",

    "carriers.lastName.label": "Apellido *",
    "carriers.lastName.placeholder": "Apellido",

    "carriers.email.label": "Correo electrónico *",
    "carriers.email.placeholder": "usted@empresa.com",

    "carriers.company.label": "Nombre de la empresa",
    "carriers.company.placeholder": "Nombre de la empresa (opcional)",

    "carriers.phone.label": "Número de teléfono *",
    "carriers.phone.placeholder": "+1 (555) 555-5555",

    "carriers.website.label": "Sitio web",
    "carriers.website.placeholder": "Sitio web (opcional)",

    "carriers.mc.label": "MC n.º *",
    "carriers.mc.placeholder": "MC n.º",

    "carriers.dot.label": "DOT n.º *",
    "carriers.dot.placeholder": "DOT n.º",

    "carriers.assets.label": "Recursos con activos *",
    "carriers.assets.placeholder": "Seleccione una opción",
    "carriers.assets.dryvan": "Caja seca",
    "carriers.assets.flatbed": "Plataforma",
    "carriers.assets.expedite": "Furgoneta exprés",
    "carriers.assets.reefer": "Refrigerado",
    "carriers.assets.conestoga": "Conestoga / especializado",
    "carriers.assets.other": "Otro",

    "carriers.details.label": "Detalles adicionales",
    "carriers.details.placeholder": "Detalles relevantes (opcional)",

    "carriers.submit": "¡Conviértase en nuestro transportista!",

    // BLOG / INSIGHTS PAGE
    "blog.hero.title": "Noticias y análisis de logística",
    "blog.hero.subtitle": "Artículos y recursos seleccionados sobre envíos aéreos exprés, transporte por camión y flete marítimo de fuentes confiables del sector.",
    "blog.search.label": "Buscar artículos",
    "blog.search.placeholder": "Busque por tema, ruta o palabra clave…",
    "blog.filters.label": "Filtrar por servicio:",
    "blog.filters.all": "Todos",
    "blog.filters.air": "Envío aéreo exprés",
    "blog.filters.trucking": "Transporte por camión",
    "blog.filters.ocean": "Flete marítimo",
    "blog.empty": "Ningún artículo coincide con su búsqueda. Pruebe con otra palabra clave o seleccione otro servicio.",
    "blog.readLink": "Leer artículo completo →",
    "blog.sourceLabel": "Fuente:",
    "blog.category.air": "Envío aéreo exprés",
    "blog.category.trucking": "Transporte por camión",
    "blog.category.ocean": "Flete marítimo",

    // Blog posts
    "blog.post1.title": "123Loadboard añade seguro de carga con la integración de MiKargo247",
    "blog.post1.excerpt": "123Loadboard se ha asociado con la plataforma digital MiKargo247 para que transportistas y cargadores puedan añadir seguro de carga instantáneo, por viaje, de hasta 2 millones de dólares directamente en el tablero de cargas.",
    "blog.post2.title": "Emirates SkyCargo explora la entrega de carga con drones",
    "blog.post2.excerpt": "Emirates SkyCargo se asocia con un fabricante de drones para probar aeronaves VTOL de carga mediante estudios de viabilidad y demostraciones en vivo a lo largo de su red.",
    "blog.post3.title": "Las tarifas spot Asia–Europa se mantienen firmes mientras los transportistas buscan carga hacia EE. UU.",
    "blog.post3.excerpt": "Los aumentos FAK de mediados de noviembre siguen respaldando las tarifas spot de contenedores en los corredores Asia–Europa, mientras las navieras buscan llenar sus servicios hacia Norteamérica.",

    // GET A QUOTE PAGE
    "quote.title": "Solicitar una cotización",
    "quote.intro": "Si necesita una cotización, complete el siguiente formulario y le responderemos dentro de las 24 horas.",

    "quote.services.legend": "¿Qué servicio(s) necesita hoy?",
    "quote.services.air": "Envío aéreo exprés",
    "quote.services.trucking": "Transporte por camión",
    "quote.services.ocean": "Flete marítimo",
    "quote.services.note": "Seleccione el o los servicios que le interesan.",
    "quote.services.change": "Cambiar servicio",

    "quote.form.fromSection.title": "Remitente",
    "quote.form.toSection.title": "Destinatario",
    "quote.form.firstName.label": "Nombre *",
    "quote.form.firstName.placeholder": "Nombre",
    "quote.form.lastName.label": "Apellido *",
    "quote.form.lastName.placeholder": "Apellido",
    "quote.form.email.label": "Correo electrónico *",
    "quote.form.email.placeholder": "usted@empresa.com",
    "quote.form.company.label": "Nombre de la empresa",
    "quote.form.company.placeholder": "Nombre de la empresa (opcional)",
    "quote.form.phone.label": "Número de teléfono *",
    "quote.form.phone.placeholder": "+1 (555) 555-5555",
    "quote.form.website.label": "Sitio web",
    "quote.form.website.placeholder": "Sitio web (opcional)",

    "quote.form.select.placeholder": "Seleccione una opción",

    "quote.air.fromCountry.label": "País/territorio *",
    "quote.air.fromCountry.placeholder": "Canadá",
    "quote.air.toCountry.label": "País/territorio *",
    "quote.air.toCountry.placeholder": "Estados Unidos de América",

    "quote.air.fromAddress.label": "Dirección *",
    "quote.air.fromAddress.placeholder": "Calle Mi Dirección 123",
    "quote.air.toAddress.label": "Dirección *",
    "quote.air.toAddress.placeholder": "Calle Su Dirección 123",

    "quote.air.fromPostal.label": "Código postal / ZIP *",
    "quote.air.fromPostal.placeholder": "A1A 1A1",
    "quote.air.fromCity.label": "Ciudad *",
    "quote.air.fromCity.placeholder": "Toronto",
    "quote.air.fromRegion.label": "Provincia/Estado *",
    "quote.air.fromRegion.placeholder": "Ontario",

    "quote.air.toPostal.label": "Código postal / ZIP *",
    "quote.air.toPostal.placeholder": "60139",
    "quote.air.toCity.label": "Ciudad *",
    "quote.air.toCity.placeholder": "Glendale Heights",
    "quote.air.toRegion.label": "Provincia/Estado *",
    "quote.air.toRegion.placeholder": "Illinois",

    "quote.air.residential": "Dirección residencial",

    "quote.air.shipment.legend": "¿Qué desea enviar? *",
    "quote.air.shipment.documents": "Documentos",
    "quote.air.shipment.parcels": "Paquetes",

    "quote.air.pieces.label": "¿Cuántas piezas/paquetes? *",
    "quote.air.pieces.placeholder": "p. ej., 1",

    "quote.air.weight.label": "Peso total *",
    "quote.air.weight.placeholder": "p. ej., 10",
    "quote.air.weightUnit.label": "Unidad de peso *",

    "quote.air.length.label": "Largo *",
    "quote.air.length.placeholder": "p. ej., 10",
    "quote.air.lengthUnit.label": "Unidad *",
    "quote.air.width.label": "Ancho *",
    "quote.air.width.placeholder": "p. ej., 10",
    "quote.air.widthUnit.label": "Unidad *",
    "quote.air.height.label": "Alto *",
    "quote.air.height.placeholder": "p. ej., 10",
    "quote.air.heightUnit.label": "Unidad *",

    "quote.general.monthlyVolume.label": "Volumen mensual estimado *",
    "quote.general.monthlyVolume.placeholder": "p. ej., 10–15 envíos por mes, pesos típicos, rutas, etc.",
    "quote.shippingDetails.title": "Detalles del envío",

    "quote.ocean.loadType.label": "Carga completa (FCL) o parcial (LCL) *",
    "quote.ocean.incoterms.label": "Incoterms",
    "quote.ocean.incoterms.other": "Otro / No estoy seguro",
    "quote.ocean.loading.label": "Puerto de carga *",
    "quote.ocean.destination.label": "Puerto de destino *",

    "quote.trucking.loadType.label": "Carga completa (FTL) o parcial (LTL) *",
    "quote.trucking.incoterms.label": "Incoterms",
    "quote.trucking.incoterms.other": "Otro / No estoy seguro",
    "quote.trucking.city.label": "Ciudad *",
    "quote.trucking.region.label": "Provincia/Estado *",
    "quote.trucking.pallets.label": "¿Cuántas tarimas/palés? *",
    "quote.trucking.pallets.placeholder": "p. ej., 1",
    "quote.trucking.weight.label": "Peso total *",
    "quote.trucking.weight.placeholder": "p. ej., 500",
    "quote.trucking.weightUnit.label": "Unidad de peso *",
    "quote.trucking.length.label": "Largo *",
    "quote.trucking.length.placeholder": "p. ej., 40",
    "quote.trucking.lengthUnit.label": "Unidad *",
    "quote.trucking.width.label": "Ancho *",
    "quote.trucking.width.placeholder": "p. ej., 48",
    "quote.trucking.widthUnit.label": "Unidad *",
    "quote.trucking.height.label": "Alto *",
    "quote.trucking.height.placeholder": "p. ej., 60",
    "quote.trucking.heightUnit.label": "Unidad *",

    "quote.doorDelivery.label": "¿Necesita entrega a domicilio? *",

    "quote.commodity.label": "¿Qué tipo de mercancía planea enviar? *",
    "quote.commodity.placeholder": "Breve descripción de sus productos",

    "quote.hazard.legend": "¿Su mercancía es peligrosa? *",

    "quote.insurance.label": "¿Desea estar cubierto a través de nuestro seguro?",
    "quote.insurance.option.yes": "Sí",
    "quote.insurance.option.no": "No",
    "quote.insurance.option.unsure": "No estoy seguro / por favor asesóreme",

    "quote.commercialValue.label": "Valor comercial *",
    "quote.commercialValue.placeholder": "Valor comercial declarado",
    "quote.commercialCurrency.label": "Moneda *",

    "quote.additionalDetails.label": "Detalles adicionales",
    "quote.additionalDetails.placeholder": "¿Algo más que debamos saber sobre este envío o sus necesidades?",

    "quote.submit": "¡Solicitar cotización ahora!",

    "quote.common.yes": "Sí",
    "quote.common.no": "No",

    // PRIVACY POLICY PAGE
    "privacy.title": "Nuestra política de privacidad",
    "privacy.lastUpdated": "<strong>\u00daltima actualización:</strong> septiembre de 2025",
    "privacy.intro": "En Magic Shipping (\u00abnosotros\u00bb), su privacidad es importante para nosotros. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos su información personal cuando visita nuestro sitio web o solicita una cotización de envío.",

    "privacy.section1.title": "1. Información que recopilamos",
    "privacy.section1.item1": "&bull;&nbsp;Datos de contacto (nombre, correo electrónico, número de teléfono, empresa, dirección)",
    "privacy.section1.item2": "&bull;&nbsp;Información del envío (peso, dimensiones, destino, descripción del contenido)",
    "privacy.section1.item3": "&bull;&nbsp;Datos de pago (cuando corresponda, para las facturas de envío)",
    "privacy.section1.item4": "&bull;&nbsp;Datos técnicos (navegador, dirección IP, tipo de dispositivo) recopilados mediante herramientas de analítica.",

    "privacy.section2.title": "2. Cómo usamos su información",
    "privacy.section2.item1": "&bull;&nbsp;Para proporcionar cotizaciones de envío, reservas y emitir facturas",
    "privacy.section2.item2": "&bull;&nbsp;Para comunicarnos sobre envíos, actualizaciones del servicio o consultas de soporte",
    "privacy.section2.item3": "&bull;&nbsp;Para cumplir con las regulaciones canadienses de exportación o impuestos",
    "privacy.section2.item4": "&bull;&nbsp;Para mejorar nuestro sitio web y nuestros servicios.",

    "privacy.section3.title": "3. Compartir datos",
    "privacy.section3.intro": "Podemos compartir información limitada con:",
    "privacy.section3.item1": "&bull;&nbsp;Socios de mensajería/transporte (por ejemplo, DHL, FedEx, UPS) para procesar envíos",
    "privacy.section3.item2": "&bull;&nbsp;Proveedores de pago para gestionar las transacciones de forma segura",
    "privacy.section3.item3": "&bull;&nbsp;Organismos regulatorios o aduaneros cuando la ley lo exige.",
    "privacy.section3.note": "No <strong>vendemos ni alquilamos</strong> sus datos a terceros.",

    "privacy.section4.title": "4. Conservación y seguridad de los datos",
    "privacy.section4.body": "Conservamos los datos de los clientes solo durante el tiempo necesario para completar las transacciones y cumplir con las obligaciones legales. Mantenemos medidas de seguridad apropiadas para evitar el acceso no autorizado.",

    "privacy.section5.title": "5. Sus derechos",
    "privacy.section5.body": "Usted puede solicitar acceso, corrección o eliminación de sus datos escribiendo a <a class=\"privacy__info-primary\" href=\"mailto:admin@mymagicshipping.com\">admin@mymagicshipping.com</a>.",

    // FAQ
    "faq.title": "Preguntas frecuentes (FAQ)",
    "faq.q1": "¿Qué tipos de envío ofrecen?",
    "faq.a1": "Actuamos como revendedor autorizado de DHL Express y de varios otros socios de transporte. Ofrecemos servicios de envío aéreo exprés (1–3 días), transporte por camión (LTL/FTL) y flete marítimo para envíos nacionales e internacionales.",

    "faq.q2": "¿Cómo solicito una cotización?",
    "faq.a2": "Haga clic en «Solicitar cotización» en nuestro sitio web, complete el formulario en línea con los datos de su envío (peso, dimensiones, origen/destino, etc.) y envíelo. Recibirá una cotización personalizada por correo electrónico dentro de las 24 horas.",

    "faq.q3": "¿Qué métodos de pago aceptan?",
    "faq.a3": "Aceptamos todas las principales tarjetas de crédito y débito mediante enlace de pago seguro o factura, según su preferencia.",

    "faq.q4": "¿Los derechos e impuestos están incluidos?",
    "faq.a4": "Nuestras cotizaciones incluyen los impuestos y recargos canadienses. Los derechos e IVA en el extranjero los determina la aduana del país de destino.",

    "faq.q5": "¿Ofrecen seguro de envío?",
    "faq.a5": "Sí, ofrecemos un seguro opcional para sus envíos (altamente recomendado) disponible en el momento de la reserva.",

    "faq.q6": "¿Dónde están ubicados?",
    "faq.a6": "Aunque todavía no tenemos una tienda física, nuestro equipo se encuentra en Toronto, Ontario, Canadá, y ofrecemos servicios de envío en toda Norteamérica y más allá.",


    // T&C
    "terms.title": "Términos y condiciones",
    "terms.effectiveDateLabel": "Fecha de vigencia:",
    "terms.effectiveDateValue": "Septiembre de 2025",
    "terms.intro":
    "Magic Shipping (operada por 16608809 Canada Inc.) ofrece servicios de transporte aéreo, terrestre y marítimo a través de sus transportistas asociados autorizados.",

    "terms.section1.title": "1. Servicios prestados",
    "terms.section1.body1":
    "Actuamos como revendedor autorizado de DHL Express y otros transportistas. Los envíos se facturan en dólares canadienses (CAD) y se rigen por las condiciones de servicio de cada transportista.",

    "terms.section2.title": "2. Cotizaciones y pago",
    "terms.section2.body1":
    "Las cotizaciones son válidas por 7 días. El pago es obligatorio antes de la recogida. Los cargos pueden ajustarse si el peso real, las dimensiones o los aranceles difieren de la información proporcionada por el cliente. El pago completo debe recibirse antes de programar la recogida.",
    "terms.section2.body2":
    "Todas las cotizaciones proporcionadas por Magic Shipping se basan únicamente en la información del envío facilitada por el cliente, incluido el peso, las dimensiones y la descripción de la mercancía. El importe final lo determina el transportista y puede ajustarse después de la entrega del envío. En particular, los transportistas y/o la Agencia de Servicios Fronterizos de Canadá (CBSA) pueden volver a medir o volver a pesar los envíos para confirmar el peso real o volumétrico. Si el importe final facturado por el transportista supera la cotización original debido a discrepancias en la información proporcionada, Magic Shipping se reserva el derecho de emitir una factura ajustada al cliente que refleje los costos reales de envío. El cliente acepta pagar dichos cargos adicionales dentro de los 3 días hábiles siguientes a la recepción de la factura revisada. La falta de pago puede dar lugar a la suspensión de futuros servicios y/o a acciones de cobro.",
    "terms.section2.body3":
    "En ciertos casos, el exportador (remitente) puede ser responsable de pagar los derechos, impuestos u otros cargos aduaneros que normalmente se facturan al destinatario. Cuando corresponda, Magic Shipping preparará una estimación de estos costos basada en la información de la mercancía (código HS/arancelario) proporcionada por el cliente. Todas estas estimaciones se ofrecen solo como referencia. El importe final de derechos e impuestos lo determina la autoridad aduanera del país de destino y puede diferir de la estimación inicial. Si el importe final facturado a Magic Shipping por el transportista o la autoridad aduanera es superior al importe estimado facturado al cliente, Magic Shipping se reserva el derecho de emitir una factura ajustada que refleje los cargos reales. El cliente acepta pagar estos ajustes dentro de los 7 días hábiles siguientes a la recepción de la factura revisada. La falta de pago puede dar lugar a la suspensión de futuros servicios y/o a acciones de cobro.",

    "terms.section3.title": "3. Responsabilidad y reclamaciones",
    "terms.section3.body1":
    "Todos los envíos están sujetos a las condiciones de servicio, limitaciones de responsabilidad y condiciones de transporte del transportista.",
    "terms.section3.body2":
    "Magic Shipping no se hace responsable de retrasos, problemas aduaneros ni daños causados por el transportista, pero apoyaremos activamente a los clientes en la gestión de reclamaciones con cada transportista.",
    "terms.section3.body3":
    "Todos los derechos, impuestos o IVA en el país de destino son responsabilidad del remitente o del destinatario, de acuerdo con las condiciones estándar del transportista.",

    "terms.section4.title": "4. Cumplimiento de exportaciones",
    "terms.section4.intro":
    "Para envíos que se originan en Canadá hacia destinos fuera de Estados Unidos, Puerto Rico o las Islas Vírgenes de EE. UU., el cliente es responsable de garantizar el cumplimiento de la normativa canadiense de exportación. En particular:",
    "terms.section4.bullet1":
    "Las mercancías con un valor de 2.000 CAD o más pueden requerir una declaración de exportación.",
    "terms.section4.bullet2":
    "Las mercancías prohibidas, controladas o reguladas también pueden requerir permisos o declaraciones de exportación.",
    "terms.section4.bullet3":
    "Las declaraciones de exportación deben presentarse electrónicamente a través del portal CERS (Canadian Export Reporting System) de la CBSA.",

    "terms.section5.title": "5. Seguro",
    "terms.section5.body1":
    "Los clientes pueden solicitar un seguro para el envío al momento de la reserva. El seguro es la ÚNICA manera de que los clientes reciban el valor total del envío en caso de daño, pérdida, robo u otra circunstancia imprevista. De lo contrario, es posible que solo reciban un reembolso parcial según las condiciones de transporte.",
    "terms.section5.body2":
    "El seguro se factura como un servicio adicional.",

    "terms.section6.title": "6. Impuestos y reembolsos",
    "terms.section6.body1":
    "Todas las cotizaciones incluyen impuestos y recargos. Las solicitudes de reembolso deben enviarse por escrito a admin@mymagicshipping.com.",

    // Quote Request Thank you

     "thank.heading": "Gracias, hemos recibido su solicitud de cotización.",
    "thank.text":
    "Nuestro equipo está revisando los detalles de su envío y le enviará una cotización personalizada por correo electrónico dentro de las 24 horas.",
    "thank.getAnother": "Solicitar otra cotización",
    "thank.backHome": "Volver al inicio",

    //  Carrier Request Thank you
    "thank.carrier.heading": "Gracias por su solicitud para convertirse en transportista con Magic Shipping.",
    "thank.carrier.text": "Nos pondremos en contacto en cuanto haya una solicitud de cotización que requiera el tipo de equipo que usted ofrece.",
    "thank.carrier.viewServices": "Ver servicios de envío",

    // Email Newsletter Thank You Page
    "thank.news.heading": "Gracias por suscribirte a las actualizaciones de Magic Shipping.",
    "thank.news.text": "Comenzarás a recibir correos ocasionales con consejos de envío, actualizaciones de servicios y ofertas especiales.",
    "thank.news.viewServices": "Ver servicios de envío",
    "thank.backHome": "Volver al inicio",

    // footer
    "footer.quickLinks.heading": "Enlaces rápidos",
    "footer.additional.heading": "Información adicional",
    "footer.privacy": "Política de privacidad",
    "footer.terms": "Términos y condiciones",
    "footer.faqs": "Preguntas frecuentes",
    "footer.sitemap": "Mapa del sitio",
    "footer.contact.heading": "Contáctenos",
    "footer.contact.emailLink": "Correo: admin@mymagicshipping.com",
    "footer.newsletter.heading": "Suscripción al boletín",
    "footer.newsletter.label": "Suscribirse",
    "footer.newsletter.placeholder": "Ingrese su correo para recibir novedades",
    "footer.copyright": "© 2025 Magic Shipping. Todos los derechos reservados"
}

};


// ==============================
//  LANGUAGE SWITCHER / META TITLE
// ==============================

function setLanguage(lang) {
  const dict = translations[lang];
  if (!dict) return;

  // ✅ Set <html lang="..."> for accessibility & SEO  
  document.documentElement.lang = lang;

  const path = (window.location.pathname || "").toLowerCase();
  let titleKey = "meta.title"; // default = home

  if (path.includes("services.html")) {
    titleKey = "meta.services.title";
  } else if (path.includes("carriers.html")) {
    titleKey = "meta.carriers.title";
  } else if (path.includes("insights.html")) {
    titleKey = "meta.insights.title";
  } else if (path.includes("quotes.html")) {
    titleKey = "meta.quote.title";
  } else if (path.includes("privacy")) {
    titleKey = "meta.privacy.title";
  } else if (path.includes("t&c") || path.includes("t%26c") || path.includes("terms")) {
    titleKey = "meta.terms.title";
  } else if (path.includes("faq")) {
    titleKey = "meta.faqs.title";
  } else if (path.includes("thank")) {
    titleKey = "meta.thankyou.title";
  }

  if (dict[titleKey]) {
    document.title = dict[titleKey];
  }

  // Translate regular text
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.innerHTML = dict[key];
  });

  // Translate placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.placeholder = dict[key];
  });

  // Keep both language dropdowns in sync
  document.querySelectorAll(".language-switcher").forEach(sel => {
    if (sel.value !== lang) sel.value = lang;
  });

  // Save the preference
  localStorage.setItem("siteLanguage", lang);

  // If this is the blog page, re-render filters and items
  if (typeof applyBlogFilters === "function") {
    currentBlogLang = lang;
    applyBlogFilters();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Load saved language OR fallback to EN
  const savedLang = localStorage.getItem("siteLanguage") || "en";
  setLanguage(savedLang);

  // Event listeners for both language dropdowns
  document.querySelectorAll(".language-switcher").forEach(sel => {
    sel.addEventListener("change", (e) => {
  const lang = e.target.value;
  // Change language
  setLanguage(lang);
  // Track language selection
  gtag('event', 'language_selected', {
    selected_language: lang
    });
    });
  });
});

// Tracking

// Track scroll Depth
let scrollTracked = false;

window.addEventListener('scroll', () => {
  if (!scrollTracked && (window.scrollY / (document.body.scrollHeight - window.innerHeight)) > 0.50) {
      scrollTracked = true;
      gtag('event', 'scroll_50');
  }
});
