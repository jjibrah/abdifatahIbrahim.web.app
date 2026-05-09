import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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

    // Track scroll direction for a cleaner header experience
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        const nav = document.querySelector('.glass-nav');
        if (!nav) return;

        if (currentScroll > lastScroll && currentScroll > 80) {
            nav.style.transform = 'translateY(-100%)';
        } else {
            nav.style.transform = 'translateY(0)';
        }
        lastScroll = currentScroll;
    });

    /* =========================================================================
       5. PROJECT MODAL ENGINE
       ========================================================================= */
    const projectsData = {
        amanah: {
            title: "Amanah Logistics",
            subtitle: "End-to-end logistics platform & operations core.",
            tech: "React • Node.js • Firebase • Maps API",
            desc: "Designed the systems layer end-to-end for a fast-scaling logistics startup. The platform handles real-time tracking, comprehensive dispatcher dashboards, dynamic route optimization, and a payments-ready operations core.",
            design: "Built around event-driven architecture to ensure dispatchers and drivers remain perfectly synchronized. Heavily utilized Firestore's real-time socket connections for sub-second state propagation.",
            challenges: "Handling real-time state mutations cleanly across thousands of map points required engineering a bespoke, memoized update pipeline to avoid React re-render thrashing.",
            liveUrl: "",
            repoUrl: ""
        },
        pota: {
            title: "POTA",
            subtitle: "Operating layer for personal task and outcome tracking.",
            tech: "TypeScript • Next.js • Firestore",
            desc: "An operating system built around systems-thinking workflows. POTA diverges from standard to-do lists by operating on immutable states and long-term objective tracking.",
            design: "Leveraged Next.js Server Components for lightning-fast initial loads, integrated with heavy client-side hydration for absolute offline-first interactive capabilities.",
            challenges: "Structuring the highly-relational Firestore database to allow complex, nested querying of daily outcomes without suffering massive compounding read-ops costs.",
            liveUrl: "",
            repoUrl: ""
        },
        idempotency: {
            title: "Idempotency System",
            subtitle: "Drop-in middleware ensuring exactly-once semantics.",
            tech: "Node.js • Redis",
            desc: "A backend service created to handle volatile network states, guaranteeing that retried HTTP requests do not trigger duplicate database transactions or payment operations.",
            design: "Uses Redis caching and distributed locks to intercept incoming request signatures and gracefully handle overlaps synchronously.",
            challenges: "Avoiding race conditions across horizontally scaled Node instances requiring deep dives into Redis TTL and SETNX limitations.",
            liveUrl: "",
            repoUrl: ""
        },
        oauth: {
            title: "Google OAuth Module",
            subtitle: "Reusable, framework-agnostic OAuth implementation.",
            tech: "Node.js • OAuth 2.0",
            desc: "A completely modular authentication system wrapped around Google's API, decoupled from heavy libraries like Passport to provide absolute control over the auth pipeline.",
            design: "Implemented rigorous refresh-token rotation and HTTP-only cookie strategies to maximize security against XSS attacks.",
            challenges: "Handling token expiration states seamlessly through middleware interceptors without degrading client-side performance.",
            liveUrl: "",
            repoUrl: ""
        }
    };

    const modalOverlay = document.getElementById('project-modal');
    const modalClose = document.getElementById('modal-close');
    const modalContent = document.getElementById('modal-content');

    const openModal = (projectId) => {
        const data = projectsData[projectId];
        if (!data) return;

        // Dynamically build the Modal UI
        modalContent.innerHTML = `
            <span class="m-badge">Systems Showcase</span>
            <h2 class="m-title">${data.title}</h2>
            <p class="m-subtitle">${data.subtitle}</p>
            
            <div class="m-stack">
                <span class="tech-tag">${data.tech}</span>
            </div>

            <h4 class="m-section-title">System Overview</h4>
            <p class="m-text">${data.desc}</p>
            
            <details class="m-accordion" open>
                <summary>Architectural Decisions</summary>
                <div class="m-accordion-content">${data.design}</div>
            </details>
            
            <details class="m-accordion">
                <summary>Engineering Challenges</summary>
                <div class="m-accordion-content">${data.challenges}</div>
            </details>
            
            <div class="m-links">
                ${data.liveUrl ? `<a href="${data.liveUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary primary-glow">View Deployment</a>` : ''}
                ${data.repoUrl ? `<a href="${data.repoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline"><i class="fa-brands fa-github"></i> Repository</a>` : ''}
            </div>
        `;

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Stop background scrolling
        
        // Track project view
        logEvent(analytics, 'project_view', {
            project_id: projectId,
            project_name: data.title
        });
    };

    // Bind click listeners to ALL teaser cards
    document.querySelectorAll('.project-teaser').forEach(card => {
        card.addEventListener('click', () => {
            const key = card.getAttribute('data-project');
            openModal(key);
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    /* =========================================================================
       6. JOURNEY MODAL LOGIC
       ========================================================================= */
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
