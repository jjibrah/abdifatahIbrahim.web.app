import { collection, onSnapshot, query, orderBy, deleteDoc, doc, setDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { db, auth, storage } from "./firestore.js";

/**
 * PRODUCTION-GRADE CMS LOGIC
 * FOR PORTFOLIO SYSTEMS
 */

(function initializeAdmin() {
    
    // --- STATE MANAGEMENT ---
    let localProjects = {};
    let localHighlights = {};
    let localServices = {};
    let projectTags = [];
    let highlightTags = [];

    const UI = {
        toast: (msg, type = 'success') => {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> <span>${msg}</span>`;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        },
        toggleModal: (id, active) => {
            const modal = document.getElementById(id);
            if (active) modal.classList.add('active');
            else modal.classList.remove('active');
        }
    };

    // --- AUTH CHANNEL ---
    onAuthStateChanged(auth, (user) => {
        if (!user) window.location.href = "login.html";
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));

    // --- NAVIGATION / TABS ---
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            navBtns.forEach(b => b.classList.remove('active'));
            document.getElementById(btn.dataset.tab).classList.add('active');
            btn.classList.add('active');
        });
    });

    // --- FORM MODAL UTILITIES ---
    const closeFormBtns = document.querySelectorAll('.close-form-btn');
    closeFormBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            UI.toggleModal('project-overlay', false);
            UI.toggleModal('highlight-overlay', false);
            UI.toggleModal('service-overlay', false);
        });
    });

    // --- FIRESTORE SUBSCRIPTIONS ---
    onSnapshot(query(collection(db, "services"), orderBy("order", "asc")), (snap) => {
        const list = document.getElementById('services-admin-list');
        if (!list) return;
        list.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            localServices[d.id] = data;
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerHTML = `
                <div class="card-info">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <i class="${data.icon || 'fa-solid fa-server'}" style="color: var(--admin-accent);"></i>
                        <h3 style="margin: 0;">${data.title}</h3>
                    </div>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-outline" onclick="window.editService('${d.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-outline" onclick="window.deleteItem('services', '${d.id}')" style="color: #ef4444;"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            list.appendChild(card);
        });
    });

    // --- FILE UPLOAD STRATEGY ---
    const handleFileUpload = async (file, path, targetInputId, btn) => {
        if (!file) return;
        
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;
        btn.disabled = true;

        try {
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            
            document.getElementById(targetInputId).value = url;
            UI.toast("File uploaded and synced successfully.");
        } catch (err) {
            console.error("Storage Error:", err);
            UI.toast("Upload failed: " + err.message, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    };

    document.querySelectorAll('.file-trigger').forEach(btn => {
        const inputId = btn.dataset.target;
        const input = document.getElementById(inputId);
        const targetUrlInput = input.previousElementSibling.previousElementSibling; // Target input is 2 siblings back in the grid layout I just made

        btn.onclick = () => input.click();

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // Determine path based on input ID
                let path = `branding/${Date.now()}_${file.name}`;
                if (inputId === 'file-profile') path = `profile/${Date.now()}_${file.name}`;
                if (inputId === 'file-resume') path = `documents/${Date.now()}_${file.name}`;
                if (inputId === 'file-project-img') path = `projects/${Date.now()}_${file.name}`;
                
                // We need to find the specific URL input associated with this trigger
                let urlFieldId = '';
                if (inputId === 'file-profile') urlFieldId = 's-profile-img';
                if (inputId === 'file-resume') urlFieldId = 's-hero-resumeUrl';
                if (inputId === 'file-project-img') urlFieldId = 'p-coverImage';

                handleFileUpload(file, path, urlFieldId, btn);
            }
        };
    });

    // --- TAG INPUT SYSTEM ---
    const setupTagInput = (containerId, inputId, tagArray, limit = null) => {
        const container = document.getElementById(containerId);
        const input = document.getElementById(inputId);

        const renderTags = () => {
            // Clear existing pills except input
            const pills = container.querySelectorAll('.tag-pill');
            pills.forEach(p => p.remove());

            tagArray.forEach((tag, index) => {
                const pill = document.createElement('div');
                pill.className = 'tag-pill';
                pill.innerHTML = `
                    <span>${tag}</span>
                    <i class="fa-solid fa-xmark tag-remove" data-index="${index}"></i>
                `;
                container.insertBefore(pill, input);
            });
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = input.value.trim();
                if (val && !tagArray.includes(val)) {
                    if (limit && tagArray.length >= limit) return;
                    tagArray.push(val);
                    input.value = '';
                    renderTags();
                }
            }
            if (e.key === 'Backspace' && !input.value && tagArray.length > 0) {
                tagArray.pop();
                renderTags();
            }
        });

        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-remove')) {
                const index = e.target.dataset.index;
                tagArray.splice(index, 1);
                renderTags();
            }
            input.focus();
        });

        return { renderTags, clear: () => { tagArray.length = 0; renderTags(); }, set: (arr) => { tagArray.length = 0; tagArray.push(...arr); renderTags(); } };
    };

    const projectStackUI = setupTagInput('p-stack-container', 'p-stack-input', projectTags);
    const highlightLangsUI = setupTagInput('h-langs-container', 'h-langs-input', highlightTags);

    // --- DYNAMIC LIST MANAGERS (Highlights & Metrics) ---
    const setupDynamicList = (containerId, addBtnId, templateFn) => {
        const container = document.getElementById(containerId);
        const addBtn = document.getElementById(addBtnId);

        const addItem = (data = {}) => {
            const item = document.createElement('div');
            item.className = 'dynamic-item';
            item.innerHTML = templateFn(data);
            container.appendChild(item);

            item.querySelector('.remove-item-btn').addEventListener('click', () => {
                item.remove();
            });
        };

        addBtn.addEventListener('click', () => addItem());

        return {
            addItem,
            clear: () => container.innerHTML = '',
            getData: (selectors) => {
                const items = container.querySelectorAll('.dynamic-item');
                return Array.from(items).map(item => {
                    const obj = {};
                    selectors.forEach(s => {
                        obj[s.key] = item.querySelector(s.selector).value;
                    });
                    return obj;
                });
            }
        };
    };

    const pHighlightsUI = setupDynamicList('p-highlights-list', 'add-highlight-segment', (data) => `
        <button type="button" class="remove-item-btn"><i class="fa-solid fa-trash"></i></button>
        <div class="form-group"><label>Segment Title</label><input type="text" class="glass-input h-title" value="${data.title || ''}" placeholder="System Overview"></div>
        <div class="form-group"><label>Segment Content</label><textarea class="glass-input glass-textarea h-content" placeholder="Content...">${data.content || ''}</textarea></div>
    `);

    const pMetricsUI = setupDynamicList('p-metrics-list', 'add-metric-segment', (data) => `
        <button type="button" class="remove-item-btn"><i class="fa-solid fa-trash"></i></button>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group"><label>Label</label><input type="text" class="glass-input m-label" value="${data.label || ''}" placeholder="Latency"></div>
            <div class="form-group"><label>Value</label><input type="text" class="glass-input m-value" value="${data.value || ''}" placeholder="< 300ms"></div>
        </div>
    `);

    // --- SITE SETTINGS ENGINE ---
    let settingsChips = [];
    const settingsChipsUI = setupTagInput('s-about-chips-container', 's-about-chips-input', settingsChips);

    const loadSettings = (data) => {
        // Hero
        const hero = data.hero || {};
        document.getElementById('s-hero-status').value = hero.status || '';
        document.getElementById('s-hero-title').value = hero.title || '';
        document.getElementById('s-hero-subtitle').value = hero.subtitle || '';
        document.getElementById('s-hero-cta').value = hero.cta || '';
        document.getElementById('s-hero-resumeLabel').value = hero.resumeLabel || '';
        document.getElementById('s-hero-resumeUrl').value = hero.resumeUrl || '';

        // Profile
        const profile = data.profile || {};
        document.getElementById('s-profile-name').value = profile.name || '';
        document.getElementById('s-profile-tag').value = profile.tag || '';
        document.getElementById('s-profile-role').value = profile.role || '';
        document.getElementById('s-profile-location').value = profile.location || '';
        document.getElementById('s-profile-img').value = profile.img || '';

        // About
        const about = data.about || {};
        document.getElementById('s-about-heading').value = about.heading || '';
        document.getElementById('s-about-highlight').value = about.highlight || '';
        document.getElementById('s-about-body').value = about.body || '';
        settingsChipsUI.set(about.chips || []);

        // Socials
        const socials = data.socials || {};
        document.getElementById('s-socials-github').value = socials.github || '';
        document.getElementById('s-socials-linkedin').value = socials.linkedin || '';
        document.getElementById('s-socials-twitter').value = socials.twitter || '';
        document.getElementById('s-socials-whatsapp').value = socials.whatsapp || '';
        document.getElementById('s-socials-email').value = socials.email || '';
        document.getElementById('s-socials-tiktok').value = socials.tiktok || '';
    };

    onSnapshot(doc(db, "meta", "global"), (snap) => {
        if (snap.exists()) loadSettings(snap.data());
    });

    const saveSettingsBtn = document.getElementById('btn-save-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            const data = {
                hero: {
                    status: document.getElementById('s-hero-status').value,
                    title: document.getElementById('s-hero-title').value,
                    subtitle: document.getElementById('s-hero-subtitle').value,
                    cta: document.getElementById('s-hero-cta').value,
                    resumeLabel: document.getElementById('s-hero-resumeLabel').value,
                    resumeUrl: document.getElementById('s-hero-resumeUrl').value
                },
                profile: {
                    name: document.getElementById('s-profile-name').value,
                    tag: document.getElementById('s-profile-tag').value,
                    role: document.getElementById('s-profile-role').value,
                    location: document.getElementById('s-profile-location').value,
                    img: document.getElementById('s-profile-img').value
                },
                about: {
                    heading: document.getElementById('s-about-heading').value,
                    highlight: document.getElementById('s-about-highlight').value,
                    body: document.getElementById('s-about-body').value,
                    chips: settingsChips
                },
                socials: {
                    github: document.getElementById('s-socials-github').value,
                    linkedin: document.getElementById('s-socials-linkedin').value,
                    twitter: document.getElementById('s-socials-twitter').value,
                    whatsapp: document.getElementById('s-socials-whatsapp').value,
                    email: document.getElementById('s-socials-email').value,
                    tiktok: document.getElementById('s-socials-tiktok').value
                },
                branding: { title: 'ibrahim.' }, // Default or add field
                updatedAt: serverTimestamp()
            };

            try {
                await setDoc(doc(db, "meta", "global"), data, { merge: true });
                UI.toast("Global site settings updated.");
            } catch (err) {
                UI.toast(err.message, 'error');
            }
        });
    }

    // --- FIRESTORE SUBSCRIPTIONS ---
    onSnapshot(query(collection(db, "projects"), orderBy("order", "asc")), (snap) => {
        const list = document.getElementById('project-admin-list');
        if (!list) return;
        list.innerHTML = '';
        document.getElementById('stat-projects').innerText = snap.size;

        snap.forEach(d => {
            const data = d.data();
            localProjects[d.id] = data;
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerHTML = `
                <div class="card-info">
                    <span style="font-size: 0.7rem; color: var(--admin-accent); text-transform: uppercase;">${data.tier}</span>
                    <h3>${data.title}</h3>
                    <div class="card-preview-text">${data.desc}</div>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-outline" onclick="window.editProject('${d.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-outline" onclick="window.deleteItem('projects', '${d.id}')" style="color: #ef4444;"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            list.appendChild(card);
        });
    });

    onSnapshot(query(collection(db, "highlights"), orderBy("order", "asc")), (snap) => {
        const list = document.getElementById('highlight-admin-list');
        if (!list) return;
        list.innerHTML = '';
        document.getElementById('stat-highlights').innerText = snap.size;

        snap.forEach(d => {
            const data = d.data();
            localHighlights[d.id] = data;
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerHTML = `
                <div class="card-info">
                    <span style="font-size: 0.7rem; color: var(--admin-accent); text-transform: uppercase;">${data.year}</span>
                    <h3>${data.title}</h3>
                    <div class="card-preview-text">${data.description}</div>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-outline" onclick="window.editHighlight('${d.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-outline" onclick="window.deleteItem('highlights', '${d.id}')" style="color: #ef4444;"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            list.appendChild(card);
        });
    });

    // --- ACTIONS ---
    window.deleteItem = async (c, id) => {
        if (confirm("This action is destructive and will purge this entry from production. Continue?")) {
            try {
                await deleteDoc(doc(db, c, id));
                UI.toast("Resource purged selected work successfully.");
            } catch (err) {
                UI.toast(err.message, 'error');
            }
        }
    };

    window.editProject = (id) => {
        const d = localProjects[id];
        document.getElementById('p-id').value = id;
        document.getElementById('p-title').value = d.title || '';
        document.getElementById('p-tier').value = d.tier || 'major';
        document.getElementById('p-order').value = d.order || 1;
        document.getElementById('p-status').value = d.status || '';
        document.getElementById('p-desc').value = d.desc || '';
        
        // Metadata
        document.getElementById('p-timeline').value = d.timeline || '';
        document.getElementById('p-role').value = d.role || '';
        document.getElementById('p-teamSize').value = d.teamSize || '';
        document.getElementById('p-projectType').value = d.projectType || '';
        document.getElementById('p-featured').checked = d.featured || false;

        // Links
        document.getElementById('p-liveUrl').value = d.liveUrl || '';
        document.getElementById('p-githubUrl').value = d.githubUrl || '';
        document.getElementById('p-caseStudyUrl').value = d.caseStudyUrl || '';
        document.getElementById('p-demoUrl').value = d.demoUrl || '';

        // Media
        document.getElementById('p-coverImage').value = d.coverImage || '';
        document.getElementById('p-videoEmbed').value = d.videoEmbed || '';

        // Tags
        projectStackUI.set(d.techStack || []);

        // Dynamic Lists
        pHighlightsUI.clear();
        (d.highlights || []).forEach(h => pHighlightsUI.addItem(h));
        
        pMetricsUI.clear();
        (d.metrics || []).forEach(m => pMetricsUI.addItem(m));

        document.getElementById('p-form-title').innerText = "Update System Architecture";
        UI.toggleModal('project-overlay', true);
    };

    window.editHighlight = (id) => {
        const d = localHighlights[id];
        document.getElementById('h-id').value = id;
        document.getElementById('h-year').value = d.year || '';
        document.getElementById('h-title').value = d.title || '';
        document.getElementById('h-preview').value = d.preview || '';
        document.getElementById('h-desc').value = d.description || '';
        document.getElementById('h-order').value = d.order || 1;

        highlightLangsUI.set(d.languages || []);

        document.getElementById('h-form-title').innerText = "Edit Journey Node";
        UI.toggleModal('highlight-overlay', true);
    };

    window.editService = (id) => {
        const d = localServices[id];
        document.getElementById('service-id').value = id;
        document.getElementById('service-icon').value = d.icon || 'fa-solid fa-code';
        document.getElementById('service-title').value = d.title || '';
        document.getElementById('service-description').value = d.description || '';
        document.getElementById('service-order').value = d.order || 1;

        document.getElementById('s-form-title').innerText = "Update Service Specification";
        UI.toggleModal('service-overlay', true);
    };

    // --- FORM SUBMISSION ---
    const serviceSubmitBtn = document.getElementById('service-form-submit');
    if (serviceSubmitBtn) {
        serviceSubmitBtn.addEventListener('click', async () => {
            const id = document.getElementById('service-id').value;
            const data = {
                icon: document.getElementById('service-icon').value,
                title: document.getElementById('service-title').value,
                description: document.getElementById('service-description').value,
                order: parseInt(document.getElementById('service-order').value),
                updatedAt: serverTimestamp()
            };

            try {
                if (id) await setDoc(doc(db, "services", id), data, { merge: true });
                else await addDoc(collection(db, "services"), data);
                
                UI.toast("Service deployment successful.");
                UI.toggleModal('service-overlay', false);
            } catch (err) {
                UI.toast(err.message, 'error');
            }
        });
    }

    const projectSubmitBtn = document.getElementById('project-form-submit');
    if (projectSubmitBtn) {
        projectSubmitBtn.addEventListener('click', async () => {
            const id = document.getElementById('p-id').value;
            const data = {
                title: document.getElementById('p-title').value,
                tier: document.getElementById('p-tier').value,
                order: parseInt(document.getElementById('p-order').value),
                status: document.getElementById('p-status').value,
                desc: document.getElementById('p-desc').value,
                
                // Metadata
                timeline: document.getElementById('p-timeline').value,
                role: document.getElementById('p-role').value,
                teamSize: document.getElementById('p-teamSize').value,
                projectType: document.getElementById('p-projectType').value,
                featured: document.getElementById('p-featured').checked,

                // Links
                liveUrl: document.getElementById('p-liveUrl').value,
                githubUrl: document.getElementById('p-githubUrl').value,
                caseStudyUrl: document.getElementById('p-caseStudyUrl').value,
                demoUrl: document.getElementById('p-demoUrl').value,

                // Media
                coverImage: document.getElementById('p-coverImage').value,
                videoEmbed: document.getElementById('p-videoEmbed').value,

                // Tags
                techStack: projectTags,

                // Dynamic Lists
                highlights: pHighlightsUI.getData([
                    { key: 'title', selector: '.h-title' },
                    { key: 'content', selector: '.h-content' }
                ]),
                metrics: pMetricsUI.getData([
                    { key: 'label', selector: '.m-label' },
                    { key: 'value', selector: '.m-value' }
                ]),

                updatedAt: serverTimestamp()
            };

            try {
                if (id) await setDoc(doc(db, "projects", id), data, { merge: true });
                else await addDoc(collection(db, "projects"), data);
                
                UI.toast("System changes committed successfully.");
                UI.toggleModal('project-overlay', false);
            } catch (err) {
                UI.toast(err.message, 'error');
            }
        });
    }

    const highlightSubmitBtn = document.getElementById('highlight-form-submit');
    if (highlightSubmitBtn) {
        highlightSubmitBtn.addEventListener('click', async () => {
            const id = document.getElementById('h-id').value;
            const data = {
                year: document.getElementById('h-year').value,
                title: document.getElementById('h-title').value,
                preview: document.getElementById('h-preview').value,
                description: document.getElementById('h-desc').value,
                languages: highlightTags,
                order: parseInt(document.getElementById('h-order').value),
                updatedAt: serverTimestamp()
            };

            try {
                if (id) await setDoc(doc(db, "highlights", id), data, { merge: true });
                else await addDoc(collection(db, "highlights"), data);

                UI.toast("Journey milestone updated.");
                UI.toggleModal('highlight-overlay', false);
            } catch (err) {
                UI.toast(err.message, 'error');
            }
        });
    }

    // --- ADD BUTTONS ---
    const addProjectBtn = document.getElementById('btn-add-project');
    if (addProjectBtn) {
        addProjectBtn.onclick = () => {
            document.getElementById('project-form').reset();
            document.getElementById('p-id').value = '';
            projectStackUI.clear();
            pHighlightsUI.clear();
            pMetricsUI.clear();
            document.getElementById('p-form-title').innerText = "Initialize New System";
            UI.toggleModal('project-overlay', true);
        };
    }

    const addServiceBtn = document.getElementById('btn-add-service');
    if (addServiceBtn) {
        addServiceBtn.onclick = () => {
            document.getElementById('service-form').reset();
            document.getElementById('service-id').value = '';
            document.getElementById('s-form-title').innerText = "Propose New Service";
            UI.toggleModal('service-overlay', true);
        };
    }

    const addHighlightBtn = document.getElementById('btn-add-highlight');
    if (addHighlightBtn) {
        addHighlightBtn.onclick = () => {
            document.getElementById('highlight-form').reset();
            document.getElementById('h-id').value = '';
            highlightLangsUI.clear();
            document.getElementById('h-form-title').innerText = "New Journey Node";
            UI.toggleModal('highlight-overlay', true);
        };
    }

})();
