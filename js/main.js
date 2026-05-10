import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, logEvent, analytics } from "./firestore.js";

/**
 * Ambient Interactions, Theme Toggle, and Modal System
 * Highly optimized vanilla JS
 */

// Script is placed at the end of the body, so elements are already parsed.
(function initializePortfolio() {

    /* =========================================================================
       1. THEME TOGGLE (LIGHT / DARK)
       ========================================================================= */
    const themeBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    htmlElement.classList.add('js-enabled');

    // Check localStorage or device preference
    const savedTheme = localStorage.getItem('portfolio-theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
        htmlElement.classList.add('light-theme');
        htmlElement.classList.remove('dark');
        if (themeBtn) {
            const themeIcon = themeBtn.querySelector('i');
            if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const themeIcon = themeBtn.querySelector('i');
            if (htmlElement.classList.contains('light-theme')) {
                htmlElement.classList.remove('light-theme');
                htmlElement.classList.add('dark');
                localStorage.setItem('portfolio-theme', 'dark');
                if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
            } else {
                htmlElement.classList.add('light-theme');
                htmlElement.classList.remove('dark');
                localStorage.setItem('portfolio-theme', 'light');
                if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
            }
        });
    }

    /* =========================================================================
       2. AMBIENT CURSOR & CARD GLOW
       ========================================================================= */
    const cursorGlow = document.getElementById('cursor-glow');
    const interactiveCards = document.querySelectorAll('.interactive-card');

    document.addEventListener('mousemove', (e) => {
        if (window.innerWidth > 768 && cursorGlow) {
            cursorGlow.style.opacity = '1';
            requestAnimationFrame(() => {
                cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
            });
        }

        // Apply interactive edge glow to all configured cards
        interactiveCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    /* =========================================================================
       3. 3D TILT EFFECT (PROFILE IMAGE FRAME)
       ========================================================================= */
    const tiltCards = document.querySelectorAll('.tilt-profile');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 768) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1200px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
        });
    });

    /* =========================================================================
       4. SCROLL ANIMATIONS & NAVBAR ACTIVE STATES
       ========================================================================= */
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.slide-up-element, .cascade-up').forEach(el => scrollObserver.observe(el));

    // Force hero elements to load
    setTimeout(() => {
        document.querySelectorAll('#hero .slide-up-element').forEach(el => el.classList.add('in-view'));
    }, 100);

    // Active Navbar Section Tracking
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // Rollback experimental nav scroll logic for stability
    /*
    let lastScroll = 0;
    window.addEventListener('scroll', () => { ... });
    */

    /* =========================================================================
       5. DYNAMIC PROJECT BENTO ENGINE
       ========================================================================= */
    const projectGrid = document.querySelector('.project-preview-grid');
    const modalOverlay = document.getElementById('project-modal');
    const modalClose = document.getElementById('modal-close');
    const modalContent = document.getElementById('modal-content');
    
    // Global data store to be populated by Firestore
    let projectsData = {};

    const openModal = (projectId) => {
        const data = projectsData[projectId];
        if (!data) return;

        // Build the Technical Deep Dive sections
        const architectureSection = data.technicalDeepDive?.architecture 
            ? `<details class="m-accordion" open>
                <summary>Architectural Decisions</summary>
                <div class="m-accordion-content">${data.technicalDeepDive.architecture}</div>
               </details>` : '';
        
        const pmSection = data.technicalDeepDive?.productManagement 
            ? `<details class="m-accordion">
                <summary>Technical & Product Leadership</summary>
                <div class="m-accordion-content">${data.technicalDeepDive.productManagement}</div>
               </details>` : '';

        // Dynamically build the Modal UI
        modalContent.innerHTML = `
            <span class="m-badge">${data.tier === 'major' ? 'Flagship System' : 'Technical Module'}</span>
            <h2 class="m-title">${data.title}</h2>
            <p class="m-subtitle">${data.desc}</p>
            
            <div class="m-stack">
                ${data.techStack.map(t => `<span class="tech-tag">${t}</span>`).join('')}
            </div>

            <h4 class="m-section-title">System Overview</h4>
            <p class="m-text">${data.desc}</p>
            
            ${architectureSection}
            ${pmSection}
            
            <div class="m-links">
                ${data.liveUrl ? `<a href="${data.liveUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary primary-glow">View Deployment</a>` : `<span class="btn btn-disabled">Still Under Development</span>`}
                ${data.githubUrl ? `<a href="${data.githubUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline"><i class="fa-brands fa-github"></i> Repository</a>` : ''}
            </div>
        `;

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        logEvent(analytics, 'project_view', { project_id: projectId, project_name: data.title });
    };

    // Firestore Listener: Auto-updates UI when DB changes
    const q = query(collection(db, "projects"), orderBy("order", "asc"));
    onSnapshot(q, (snapshot) => {
        if (!projectGrid) return;
        
        projectGrid.innerHTML = ''; // Clear for re-render
        projectsData = {}; // Clear store

        snapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;
            projectsData[id] = data;

            // Create Project Card
            const card = document.createElement('div');
            const tierClass = data.tier === 'major' ? 'major-card' : 'mini-card';
            const statusClass = data.status.toLowerCase().includes('live') ? 'cyan' : 'emerald';
            
            card.className = `project-teaser glass-card interactive-card in-view ${tierClass}`;
            card.setAttribute('data-project', id);
            
            card.innerHTML = `
                <div class="teaser-header">
                    <div class="p-brand-badge">
                        <i class="fa-solid ${data.tier === 'major' ? 'fa-rocket' : 'fa-code'}"></i>
                    </div>
                    <span class="teaser-status ${statusClass}">${data.status}</span>
                </div>
                <div class="teaser-body">
                    <h3>${data.title}</h3>
                    <p>${data.desc}</p>
                </div>
                <div class="teaser-footer">
                    ${data.techStack.slice(0, 3).map(t => `<span class="tech-tag">${t}</span>`).join('')}
                </div>
            `;
            
            card.addEventListener('click', () => openModal(id));
            projectGrid.appendChild(card);
        });
    });

    // 5.2 UNIFIED JOURNEY & HIGHLIGHTS ENGINE
    const highlightsQ = query(collection(db, "highlights"), orderBy("order", "asc"));
    
    onSnapshot(highlightsQ, (snapshot) => {
        try {
            const timelineContainer = document.querySelector('.full-timeline');
            const highlightsContainer = document.querySelector('.hero-stats');
            const aboutSummaryContainer = document.getElementById('dynamic-journey-summary');

            if (timelineContainer) timelineContainer.innerHTML = '';
            if (highlightsContainer) highlightsContainer.innerHTML = '';
            if (aboutSummaryContainer) aboutSummaryContainer.innerHTML = '';

            snapshot.docs.forEach((doc, index) => {
                const h = doc.data();
                
                // Safety Filter: Skip documents that look like profile bio data
                const isProfileData = h.title === "Abdifatah Ibrahim" || h.year === "Download Resume";
                if (isProfileData) return;
                
                // 1. RENDER FULL MODAL (Every entry)
                if (timelineContainer) {
                    const phaseEl = document.createElement('div');
                    phaseEl.className = 'ft-phase';
                    const langTags = (h.languages && h.languages.length > 0) 
                        ? `<div class="m-stack" style="margin-bottom: 1rem; border-bottom: none; padding-bottom: 0;">
                            ${h.languages.map(l => `<span class="tech-tag" style="background: rgba(0, 240, 255, 0.05); color: var(--sys-accent-cyan);">${l}</span>`).join('')}
                           </div>` 
                        : '';
                    phaseEl.innerHTML = `
                        <div class="ft-event glass-card">
                            <span class="t-year">${h.year || ''}</span>
                            <h5>${h.title || 'Untitled'}</h5>
                            ${langTags}
                            <p>${h.description || ''}</p>
                        </div>
                    `;
                    timelineContainer.appendChild(phaseEl);
                }

                // 2. RENDER SUMMARIES (Only top 3)
                if (index < 3) {
                    const previewText = h.preview || h.description || '';
                    
                    if (highlightsContainer) {
                        const hEl = document.createElement('div');
                        hEl.className = 'stat-item';
                        hEl.innerHTML = `
                            <div class="stat-top">
                                <span class="stat-label">${h.year || ''}</span>
                                ${(h.year === '2026' || h.year === 'Target') ? '<span class="stat-dot"></span>' : ''}
                            </div>
                            <h4>${h.title || 'Untitled'}</h4>
                            <p>${previewText}</p>
                        `;
                        highlightsContainer.appendChild(hEl);
                    }

                    if (aboutSummaryContainer) {
                        const aEl = document.createElement('div');
                        aEl.className = 't-item';
                        aEl.innerHTML = `
                            <span class="t-year">${h.year || ''}</span>
                            <div class="t-content">
                                <h4>${h.title || 'Untitled'}</h4>
                                <p>${previewText}</p>
                            </div>
                        `;
                        aboutSummaryContainer.appendChild(aEl);
                    }
                }
            });
        } catch (err) {
            console.error("Firestore Rendering Error:", err);
        }
    });
    const journeyModal = document.getElementById('journey-modal');
    const journeyClose = document.getElementById('journey-close');
    const viewJourneyBtn = document.getElementById('view-journey-btn');

    if (viewJourneyBtn) {
        viewJourneyBtn.addEventListener('click', () => {
            journeyModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (journeyClose) {
        journeyClose.addEventListener('click', () => {
            journeyModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    if (journeyModal) {
        journeyModal.addEventListener('click', (e) => {
            if (e.target === journeyModal) {
                journeyModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Close on Escape Key (handles all modals)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalOverlay && modalOverlay.classList.contains('active')) {
                modalOverlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
            if (journeyModal && journeyModal.classList.contains('active')) {
                journeyModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
            const contactModal = document.getElementById('contact-modal');
            if (contactModal && contactModal.classList.contains('active')) {
                contactModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        }
    });

    /* =========================================================================
       7. HERO GLOBE ANIMATION (Vanilla JS Canvas)
       ========================================================================= */
    const canvas = document.getElementById('hero-globe');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const particles = [];
        const numParticles = 750; // Density
        let angleY = 0;

        // Sphere point generation using golden spiral
        for (let i = 0; i < numParticles; i++) {
            const y = 1 - (i / (numParticles - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = 2.39996 * i; // Golden angle approx
            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;
            particles.push({ x, y, z });
        }

        const resizeCanvas = () => {
            // Using parent container or fixed dimension logic
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const renderGlobe = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const radius = Math.min(cx, cy) * 0.85; // Fit inside canvas

            angleY += 0.0015; // Slow ambient rotation
            const cosY = Math.cos(angleY);
            const sinY = Math.sin(angleY);

            // Draw subtle atmosphere glow behind sphere
            const gradient = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.05);
            gradient.addColorStop(0, 'rgba(0, 240, 255, 0.0)');
            gradient.addColorStop(1, 'rgba(0, 240, 255, 0.03)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            particles.forEach(p => {
                // Rotate around Y axis
                const rotX = p.x * cosY - p.z * sinY;
                const rotZ = p.z * cosY + p.x * sinY;
                const rotY = p.y;

                // Tilt Globe slightly for aesthetic
                const tilt = 0.25;
                const fY = rotY * Math.cos(tilt) - rotZ * Math.sin(tilt);
                const fZ = rotZ * Math.cos(tilt) + rotY * Math.sin(tilt);

                // Only draw the visible hemisphere to simulate 3D occlusion
                if (fZ > -0.2) {
                    const depth = (fZ + 1) / 2; // Normalize 0 to 1
                    const opacity = Math.min(1, Math.max(0.1, depth * 0.85));

                    const screenX = cx + rotX * radius;
                    const screenY = cy + fY * radius;

                    const isLight = document.documentElement.classList.contains('light-theme');
                    const color = isLight ? `rgba(2, 132, 199, ${opacity})` : `rgba(0, 240, 255, ${opacity})`;

                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            requestAnimationFrame(renderGlobe);
        };
        renderGlobe();
    }

    /* =========================================================================
       8. CONTACT MODAL & FORM LOGIC
       ========================================================================= */
    const contactTriggers = document.querySelectorAll('.contact-modal-trigger');
    const contactModal = document.getElementById('contact-modal');
    const contactClose = document.getElementById('contact-close');
    const formDrop = document.getElementById('c-purpose');
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.querySelector('.form-submit-btn');
    const formStatus = document.getElementById('form-validation-msg');

    contactTriggers.forEach(btn => {
        btn.addEventListener('click', () => {
            const intent = btn.getAttribute('data-intent');
            if (formDrop && intent) {
                formDrop.value = intent;
            }
            if (contactModal) {
                contactModal.classList.add('active');
                document.body.style.overflow = 'hidden';

                // Track contact modal open
                logEvent(analytics, 'contact_open', {
                    intent: intent || 'general'
                });
            }
        });
    });

    if (contactClose && contactModal) {
        contactClose.addEventListener('click', () => {
            contactModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                contactModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // UI State loading
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            formStatus.style.display = 'none';

            // Extract data payload
            const payload = {
                name: document.getElementById('c-name').value,
                email: document.getElementById('c-email').value,
                intent: document.getElementById('c-purpose').value,
                message: document.getElementById('c-message').value,
                timestamp: serverTimestamp()
            };

            // Track form submission attempt
            logEvent(analytics, 'contact_form_submit', {
                intent: payload.intent
            });

            try {
                // Transmit to Firestore
                await addDoc(collection(db, "inquiries"), payload);

                // Success UI Restoration
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;

                formStatus.style.display = 'block';
                formStatus.style.color = 'var(--sys-accent-emerald)';
                formStatus.innerText = 'Message sent Successfully. I will reach out shortly.';

                contactForm.reset();

                // Auto close modal
                setTimeout(() => {
                    if (contactModal.classList.contains('active')) {
                        contactModal.classList.remove('active');
                        document.body.style.overflow = 'auto';
                        formStatus.style.display = 'none';
                    }
                }, 3000);
            } catch (error) {
                console.error("Error adding document: ", error);
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                formStatus.style.display = 'block';
                formStatus.style.color = 'red';
                formStatus.innerText = `Error: ${error.message || 'Check browser console'}`;
            }
        });
    }

})();
