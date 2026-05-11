import { collection, addDoc, getDoc, doc, serverTimestamp, query, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, logEvent, analytics } from "./firestore.js";

/**
 * Cinematic Dynamic Content Engine & System Logic
 */
(function initializePortfolio() {

    /* =========================================================================
       1. PRODUCTION-GRADE TOAST SYSTEM
       ========================================================================= */
    const toastContainer = document.getElementById('toast-container');

    const showToast = (title, message, icon = 'fa-circle-check') => {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon"><i class="fa-solid ${icon}"></i></div>
            <div class="toast-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
        `;

        toastContainer.appendChild(toast);

        const dismiss = () => {
            toast.classList.add('dismiss');
            setTimeout(() => toast.remove(), 400);
        };

        toast.querySelector('.toast-close').onclick = dismiss;
        setTimeout(dismiss, 5000);
    };

    /* =========================================================================
       2. DYNAMIC CONTENT SYNCHRONIZATION (CMS LAYER)
       ========================================================================= */

    // --- Social Dock Re-renderer ---
    const renderSocialLinks = (socials) => {
        const docks = document.querySelectorAll('.dyn-social-dock');
        const platforms = [
            { key: 'github', icon: 'fa-brands fa-github', label: 'GitHub' },
            { key: 'linkedin', icon: 'fa-brands fa-linkedin-in', label: 'LinkedIn' },
            { key: 'twitter', icon: 'fa-brands fa-x-twitter', label: 'X' },
            { key: 'whatsapp', icon: 'fa-brands fa-whatsapp', label: 'WhatsApp' },
            { key: 'email', icon: 'fa-regular fa-envelope', label: 'Email' }
        ];

        const linksHTML = platforms
            .filter(p => socials[p.key])
            .map(p => {
                let url = socials[p.key];
                if (p.key === 'email' && !url.includes('@')) return ''; // Invalid email
                if (p.key === 'email' && !url.startsWith('mailto:')) {
                    url = `mailto:${url}`;
                }
                if (p.key === 'whatsapp' && !url.startsWith('http')) {
                    const cleanNum = url.replace(/\D/g, ''); // Remove non-digits
                    const message = encodeURIComponent("Hi, I'm reaching out from your portfolio regarding ....");
                    url = `https://wa.me/${cleanNum}?text=${message}`;
                }
                return `
                    <a href="${url}" target="_blank" class="social-btn" aria-label="${p.label}" data-tooltip="${p.label}">
                        <i class="${p.icon}"></i>
                    </a>
                `;
            }).join('');

        docks.forEach(dock => dock.innerHTML = linksHTML);
    };

    // --- Global Site Content Listener ---
    onSnapshot(doc(db, "meta", "global"), (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        // Update Nav & Branding
        document.querySelectorAll('.dyn-brand').forEach(el => el.innerText = data.branding?.title || 'ibrahim.');

        // Update Hero
        const hero = data.hero || {};
        if (document.getElementById('dyn-hero-status')) {
            document.getElementById('dyn-hero-status').innerHTML = `<span class="pulse-dot"></span>${hero.status || 'Available'}`;
        }
        if (document.getElementById('dyn-hero-title')) {
            const titleWithHighlight = (hero.title || '').replace(/\[(.*?)\]/g, '<span class="highlight-cyan">$1</span>');
            document.getElementById('dyn-hero-title').innerHTML = titleWithHighlight;
        }
        if (document.getElementById('dyn-hero-subtitle')) {
            document.getElementById('dyn-hero-subtitle').innerText = hero.subtitle || '';
        }
        if (document.getElementById('dyn-hero-cta')) {
            document.getElementById('dyn-hero-cta').innerHTML = `${hero.cta || 'View Work'} <i class="fa-solid fa-arrow-right"></i>`;
        }
        if (document.getElementById('dyn-hero-resume')) {
            document.getElementById('dyn-hero-resume').href = hero.resumeUrl || '#';
            document.getElementById('dyn-hero-resume').innerHTML = `<i class="fa-regular fa-file-lines"></i> ${hero.resumeLabel || 'Resume'}`;
        }

        // Update Profile Card
        const profile = data.profile || {};
        if (document.getElementById('dyn-profile-img')) document.getElementById('dyn-profile-img').src = profile.img || 'profile.png';
        if (document.getElementById('dyn-profile-name')) document.getElementById('dyn-profile-name').innerText = profile.name || '';
        if (document.getElementById('dyn-profile-tag')) document.getElementById('dyn-profile-tag').innerText = profile.tag || '';
        if (document.getElementById('dyn-profile-role')) document.getElementById('dyn-profile-role').innerText = profile.role || '';
        if (document.getElementById('dyn-profile-location')) document.getElementById('dyn-profile-location').innerText = profile.location || '';

        // Update About
        const about = data.about || {};
        if (document.getElementById('dyn-about-heading')) document.getElementById('dyn-about-heading').innerText = about.heading || '';
        if (document.getElementById('dyn-about-highlight')) document.getElementById('dyn-about-highlight').innerText = about.highlight || '';
        if (document.getElementById('dyn-about-body')) document.getElementById('dyn-about-body').innerText = about.body || '';

        if (document.getElementById('dyn-about-chips') && about.chips) {
            document.getElementById('dyn-about-chips').innerHTML = about.chips.map(c => `<span class="skill-chip">${c}</span>`).join('');
        }

        // Update Projects Section Desc
        if (document.getElementById('dyn-projects-desc')) document.getElementById('dyn-projects-desc').innerText = data.projects?.desc || '';

        // Update Contact Section
        if (document.getElementById('dyn-contact-heading')) document.getElementById('dyn-contact-heading').innerText = data.contact?.heading || "Let's connect.";
        if (document.getElementById('dyn-contact-desc')) document.getElementById('dyn-contact-desc').innerText = data.contact?.desc || "Select your intent below to start a conversation.";

        // Sync Socials
        if (data.socials) renderSocialLinks(data.socials);
    });

    // --- Services Sync ---
    onSnapshot(query(collection(db, "services"), orderBy("order", "asc")), (snapshot) => {
        const grid = document.getElementById('dyn-services-grid');
        if (!grid) return;
        grid.innerHTML = '';
        snapshot.forEach((doc, index) => {
            const s = doc.data();
            const card = document.createElement('div');
            card.className = `service-card glass-card slide-up-element ${index === 0 ? 'base-delay' : 'delay-' + index}`;
            card.innerHTML = `
                <div class="service-icon"><i class="fa-solid ${s.icon || 'fa-code'}"></i></div>
                <h3>${s.title}</h3>
                <p>${s.description}</p>
            `;
            grid.appendChild(card);
        });
    });

    /* =========================================================================
       3. MODAL & SCROLL ENGINE (CORE LOGIC)
       ========================================================================= */
    const themeBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    htmlElement.classList.add('js-enabled');

    // Theme Management
    const initTheme = () => {
        const savedTheme = localStorage.getItem('portfolio-theme');
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
            htmlElement.classList.add('light-theme');
            htmlElement.classList.remove('dark');
            const themeIcon = themeBtn?.querySelector('i');
            if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    };
    initTheme();

    themeBtn?.addEventListener('click', () => {
        const themeIcon = themeBtn.querySelector('i');
        const isLight = htmlElement.classList.toggle('light-theme');
        htmlElement.classList.toggle('dark', !isLight);
        localStorage.setItem('portfolio-theme', isLight ? 'light' : 'dark');
        if (themeIcon) {
            themeIcon.classList.toggle('fa-moon', !isLight);
            themeIcon.classList.toggle('fa-sun', isLight);
        }
    });

    // Interaction Observers
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in-view'); });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

    document.querySelectorAll('.slide-up-element, .cascade-up').forEach(el => scrollObserver.observe(el));

    // Tilt Utility
    const applyTiltEffect = (element) => {
        element.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 768) return;
            const { left, top, width, height } = element.getBoundingClientRect();
            const centerX = width / 2;
            const centerY = height / 2;
            const rotateX = ((e.clientY - top - centerY) / centerY) * -8;
            const rotateY = ((e.clientX - left - centerX) / centerX) * 8;
            element.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        element.addEventListener('mouseleave', () => {
            element.style.transform = `perspective(1200px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
        });
    };
    document.querySelectorAll('.tilt-profile').forEach(applyTiltEffect);

    // Dynamic Card Glow
    document.addEventListener('mousemove', (e) => {
        const cursorGlow = document.getElementById('cursor-glow');
        if (window.innerWidth > 768 && cursorGlow) {
            cursorGlow.style.opacity = '1';
            cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        }
        document.querySelectorAll('.interactive-card').forEach(card => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });

    // Section Tracking
    window.addEventListener('scroll', () => {
        let current = '';
        document.querySelectorAll('section[id]').forEach(section => {
            if (scrollY >= (section.offsetTop - section.clientHeight / 3)) current = section.getAttribute('id');
        });
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href').includes(current));
        });
    });

    /* =========================================================================
       4. BENTO PROJECTS & HIGHLIGHTS ENGINE
       ========================================================================= */
    let projectsData = {};
    const modalOverlay = document.getElementById('project-modal');
    const modalContent = document.getElementById('modal-content');

    const openModal = (projectId) => {
        const data = projectsData[projectId];
        if (!data || !modalContent) return;

        const highlightsHTML = (data.highlights || []).map(h => `
            <details class="m-accordion slide-up-element in-view">
                <summary>
                    <span class="m-accordion-title">${h.title}</span>
                    <i class="fa-solid fa-chevron-down acc-icon"></i>
                </summary>
                <div class="m-accordion-content"><div class="m-text">${h.content}</div></div>
            </details>
        `).join('');

        const linksHTML = [
            { url: data.liveUrl, label: 'Live Project', icon: 'fa-arrow-up-right-from-square' },
            { url: data.githubUrl, label: 'GitHub', icon: 'fa-github', brand: true },
            { url: data.caseStudyUrl, label: 'Case Study', icon: 'fa-file-lines' },
            { url: data.demoUrl, label: 'Watch Demo', icon: 'fa-play' }
        ].filter(link => link.url).map(link => `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="btn ${link.label === 'Live Project' ? 'btn-primary primary-glow' : 'btn-outline'}">
                <i class="${link.brand ? 'fa-brands' : 'fa-solid'} ${link.icon}"></i> ${link.label}
            </a>
        `).join('');

        modalContent.innerHTML = `
            <div class="modal-hero">
                <span class="m-badge">${data.tier === 'major' ? 'Flagship System' : 'Core Module'}</span>
                <h1 class="m-title" style="font-family: var(--font-heading); font-weight: 700;">${data.title}</h1>
                <div class="m-meta">
                    ${data.role ? `<span class="m-meta-item"><i class="fa-solid fa-user-gear"></i> ${data.role}</span>` : ''}
                    ${data.status ? `<span class="m-meta-item"><i class="fa-solid fa-circle-check"></i> ${data.status}</span>` : ''}
                </div>
                <div class="m-links">${linksHTML}</div>
            </div>
            <div class="m-description-block"><p class="m-subtitle">${data.desc}</p></div>
            <div class="m-content-sections">${highlightsHTML}</div>
            ${data.metrics?.length ? `
                <div class="m-section-header"><span class="m-section-label">Impact</span><div class="m-header-line"></div></div>
                <div class="m-metrics-grid">${data.metrics.map(m => `<div class="metric-card glass-card"><span class="metric-value">${m.value}</span><span class="metric-label">${m.label}</span></div>`).join('')}</div>
            ` : ''}
            <div class="m-section-header"><span class="m-section-label">Infrastructure</span><div class="m-header-line"></div></div>
            <div class="m-stack">${(data.techStack || []).map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>
        `;
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    onSnapshot(query(collection(db, "projects"), orderBy("order", "asc")), (snapshot) => {
        const grid = document.querySelector('.project-preview-grid');
        if (!grid) return;
        grid.innerHTML = '';
        projectsData = {};
        snapshot.forEach((doc) => {
            const data = doc.data();
            projectsData[doc.id] = data;
            const card = document.createElement('div');
            card.className = `project-teaser glass-card interactive-card slide-up-element ${data.tier === 'major' ? 'major-card' : 'mini-card'}`;
            card.innerHTML = `
                <div class="teaser-header">
                    <div class="p-brand-badge"><i class="fa-solid ${data.tier === 'major' ? 'fa-rocket' : 'fa-code'}"></i></div>
                    <span class="teaser-status ${data.status?.toLowerCase().includes('live') ? 'cyan' : 'emerald'}">${data.status || 'Live'}</span>
                </div>
                <div class="teaser-body">
                    <h3>${data.title}</h3>
                    <p class="teaser-desc">${data.desc}</p>
                </div>
                <div class="teaser-footer">
                    <div class="teaser-tags">${(data.techStack || []).slice(0, 4).map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>
                    <div class="teaser-actions"><span class="action-hint">Explore System <i class="fa-solid fa-chevron-right"></i></span></div>
                </div>
            `;
            card.onclick = () => openModal(doc.id);
            applyTiltEffect(card);
            scrollObserver.observe(card);
            grid.appendChild(card);
        });
    });

    onSnapshot(query(collection(db, "highlights"), orderBy("order", "asc")), (snapshot) => {
        const timeline = document.querySelector('.full-timeline');
        const summary = document.getElementById('dynamic-journey-summary');
        if (timeline) timeline.innerHTML = '';
        if (summary) summary.innerHTML = '';

        snapshot.docs.forEach((doc, index) => {
            const h = doc.data();
            if (h.title === "Abdifatah Ibrahim" || h.year === "Download Resume") return;

            if (timeline) {
                const phase = document.createElement('div');
                phase.className = 'ft-phase';
                phase.innerHTML = `<div class="ft-event glass-card"><span class="t-year">${h.year || ''}</span><h5>${h.title}</h5><p>${h.description}</p></div>`;
                timeline.appendChild(phase);
            }
            if (summary && index < 3) {
                const item = document.createElement('div');
                item.className = 't-item';
                item.innerHTML = `<span class="t-year">${h.year || ''}</span><div class="t-content"><h4>${h.title}</h4><p>${h.preview || h.description}</p></div>`;
                summary.appendChild(item);
            }
        });
    });

    // --- Global Site Content Listener (placed here for better order) ---
    onSnapshot(doc(db, "meta", "global"), (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        // Update Nav & Branding
        document.querySelectorAll('.dyn-brand').forEach(el => el.innerText = data.branding?.title || 'ibrahim.');

        // Update Hero
        const hero = data.hero || {};
        if (document.getElementById('dyn-hero-status')) {
            document.getElementById('dyn-hero-status').innerHTML = `<span class="pulse-dot"></span>${hero.status || 'Available'}`;
        }
        if (document.getElementById('dyn-hero-title')) {
            const titleWithHighlight = (hero.title || '').replace(/\[(.*?)\]/g, '<span class="highlight-cyan">$1</span>');
            document.getElementById('dyn-hero-title').innerHTML = titleWithHighlight;
        }
        if (document.getElementById('dyn-hero-subtitle')) {
            document.getElementById('dyn-hero-subtitle').innerText = hero.subtitle || '';
        }
        if (document.getElementById('dyn-hero-cta')) {
            document.getElementById('dyn-hero-cta').innerHTML = `${hero.cta || 'View Work'} <i class="fa-solid fa-arrow-right"></i>`;
        }
        if (document.getElementById('dyn-hero-resume')) {
            document.getElementById('dyn-hero-resume').href = hero.resumeUrl || '#';
            document.getElementById('dyn-hero-resume').innerHTML = `<i class="fa-regular fa-file-lines"></i> ${hero.resumeLabel || 'Resume'}`;
        }

        // Update Profile Card
        const profile = data.profile || {};
        if (document.getElementById('dyn-profile-img')) document.getElementById('dyn-profile-img').src = profile.img || 'profile.png';
        if (document.getElementById('dyn-profile-name')) document.getElementById('dyn-profile-name').innerText = profile.name || '';
        if (document.getElementById('dyn-profile-tag')) document.getElementById('dyn-profile-tag').innerText = profile.tag || '';
        if (document.getElementById('dyn-profile-role')) document.getElementById('dyn-profile-role').innerText = profile.role || '';
        if (document.getElementById('dyn-profile-location')) document.getElementById('dyn-profile-location').innerText = profile.location || '';

        // Update About
        const about = data.about || {};
        if (document.getElementById('dyn-about-heading')) document.getElementById('dyn-about-heading').innerText = about.heading || '';
        if (document.getElementById('dyn-about-highlight')) document.getElementById('dyn-about-highlight').innerText = about.highlight || '';
        if (document.getElementById('dyn-about-body')) document.getElementById('dyn-about-body').innerText = about.body || '';

        if (document.getElementById('dyn-about-chips') && about.chips) {
            document.getElementById('dyn-about-chips').innerHTML = about.chips.map(c => `<span class="skill-chip">${c}</span>`).join('');
        }

        // Update Projects Section Desc
        if (document.getElementById('dyn-projects-desc')) document.getElementById('dyn-projects-desc').innerText = data.projects?.desc || '';

        // Update Contact Section
        if (document.getElementById('dyn-contact-heading')) document.getElementById('dyn-contact-heading').innerText = data.contact?.heading || "Let's connect.";
        if (document.getElementById('dyn-contact-desc')) document.getElementById('dyn-contact-desc').innerText = data.contact?.desc || "Select your intent below to start a conversation.";

        // Sync Socials
        if (data.socials) renderSocialLinks(data.socials);
    });

    // --- Services Sync ---
    onSnapshot(query(collection(db, "services"), orderBy("order", "asc")), (snapshot) => {
        const grid = document.getElementById('dyn-services-grid');
        if (!grid) return;
        grid.innerHTML = '';
        snapshot.forEach((doc, index) => {
            const s = doc.data();
            const card = document.createElement('div');
            card.className = `service-card glass-card slide-up-element ${index === 0 ? 'base-delay' : 'delay-' + index}`;
            card.innerHTML = `
                <div class="service-icon"><i class="fa-solid ${s.icon || 'fa-code'}"></i></div>
                <h3>${s.title}</h3>
                <p>${s.description}</p>
            `;
            scrollObserver.observe(card);
            grid.appendChild(card);
        });
    });

    /* =========================================================================
       5. CONTACT FORM & TOAST INTEGRATION
       ========================================================================= */
    const contactModal = document.getElementById('contact-modal');
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.querySelector('.form-submit-btn');

    document.querySelectorAll('.contact-modal-trigger').forEach(btn => {
        btn.onclick = () => {
            const intent = btn.getAttribute('data-intent');
            if (document.getElementById('c-purpose')) document.getElementById('c-purpose').value = intent || '';
            contactModal?.classList.add('active');
            document.body.style.overflow = 'hidden';
            logEvent(analytics, 'contact_open', { intent: intent || 'general' });
        };
    });

    const journeyModal = document.getElementById('journey-modal');
    const viewJourneyBtn = document.getElementById('view-journey-btn');

    if (viewJourneyBtn && journeyModal) {
        viewJourneyBtn.onclick = () => {
            journeyModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
    }

    const closeModals = () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = '';
    };

    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
        el.onclick = (e) => { if (e.target === el || el.classList.contains('modal-close')) closeModals(); };
    });

    contactForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const payload = {
            name: document.getElementById('c-name').value,
            email: document.getElementById('c-email').value,
            intent: document.getElementById('c-purpose').value,
            message: document.getElementById('c-message').value,
            timestamp: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "inquiries"), payload);
            logEvent(analytics, 'contact_form_success', { intent: payload.intent });

            showToast('Message sent successfully', "I'll get back to you across your provided channels shortly.");
            contactForm.reset();
            setTimeout(closeModals, 1500);
        } catch (err) {
            console.error("Transmission Error:", err);
            showToast('Error sending message', "Check your connection or try again later.", 'fa-circle-exclamation');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });

    /* =========================================================================
       6. CINEMATIC GLOBE (RETAINED CORE)
       ========================================================================= */
    const canvas = document.getElementById('hero-globe');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const particles = [];
        const numParticles = 750;
        let angleY = 0;
        for (let i = 0; i < numParticles; i++) {
            const y = 1 - (i / (numParticles - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = 2.39996 * i;
            particles.push({ x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius });
        }
        const resize = () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; };
        resize(); window.onresize = resize;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const cx = canvas.width / 2, cy = canvas.height / 2, radius = Math.min(cx, cy) * 0.85;
            angleY += 0.0015;
            particles.forEach(p => {
                const rotX = p.x * Math.cos(angleY) - p.z * Math.sin(angleY);
                const rotZ = p.z * Math.cos(angleY) + p.x * Math.sin(angleY);
                const tilt = 0.25;
                const fY = p.y * Math.cos(tilt) - rotZ * Math.sin(tilt);
                const fZ = rotZ * Math.cos(tilt) + p.y * Math.sin(tilt);
                if (fZ > -0.2) {
                    const depth = (fZ + 1) / 2;
                    const isLight = htmlElement.classList.contains('light-theme');
                    ctx.fillStyle = isLight ? `rgba(2, 132, 199, ${depth * 0.8})` : `rgba(0, 240, 255, ${depth * 0.8})`;
                    ctx.beginPath(); ctx.arc(cx + rotX * radius, cy + fY * radius, 1.2, 0, Math.PI * 2); ctx.fill();
                }
            });
            requestAnimationFrame(render);
        };
        render();
    }
})();
