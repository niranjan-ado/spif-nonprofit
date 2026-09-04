/**
 * SPIF Master Interactive Engine v5.6
 * Custom built by adostrophe
 * Architected with Progressive Enhancement & Zero-JS Fallback Safety.
 * Flash-free theme init handled in <head> inline script on every page.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    const isMobileQuery = window.matchMedia('(max-width: 768px)');
    
    /* UX FIX: Respect OS-level reduced motion settings for animations */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    /* ==========================================================================
       1. SMART HEADER
       ========================================================================== */
    const header = document.getElementById('smart-header');
    if (header) {
        let lastScrollY = window.scrollY;
        let ticking = false;
        let isHidden = false;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY < 0) return;
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const isNavOpen = document.body.classList.contains('body-nav-open');
                    if (currentScrollY <= 80) {
                        if (isHidden) { header.classList.remove('is-hidden'); isHidden = false; }
                    } else if (currentScrollY > lastScrollY && currentScrollY > 80 && !isNavOpen) {
                        if (!isHidden) { header.classList.add('is-hidden'); isHidden = true; }
                    } else if (currentScrollY < lastScrollY) {
                        if (isHidden) { header.classList.remove('is-hidden'); isHidden = false; }
                    }
                    lastScrollY = currentScrollY;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /* ==========================================================================
       2. THEME ENGINE — toggle only (init is in <head> snippet, flash-free)
       ========================================================================== */
    const themeBtns = document.querySelectorAll('.theme-toggle-btn');
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (isDark) => {
        const theme = isDark ? 'dark' : 'light';
        root.setAttribute('data-theme', theme);
        
        // Sync icon visibility and ARIA state
        document.querySelectorAll('.theme-icon-light').forEach(el => el.hidden = isDark);
        document.querySelectorAll('.theme-icon-dark').forEach(el => el.hidden = !isDark);
        themeBtns.forEach(btn => btn.setAttribute('aria-pressed', isDark));
        
        try { 
            localStorage.setItem('spif-theme', theme); 
        } catch (error) {
            console.warn('SPIF Storage: LocalStorage access denied (likely incognito/privacy mode). Session state applied.');
        }
    };

    // Sync icon and ARIA state on load (theme already applied by head snippet)
    const currentTheme = root.getAttribute('data-theme');
    const isDarkNow = currentTheme === 'dark';
    document.querySelectorAll('.theme-icon-light').forEach(el => el.hidden = isDarkNow);
    document.querySelectorAll('.theme-icon-dark').forEach(el => el.hidden = !isDarkNow);
    themeBtns.forEach(btn => btn.setAttribute('aria-pressed', isDarkNow));

    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            applyTheme(root.getAttribute('data-theme') !== 'dark');
        });
    });

    systemDark.addEventListener('change', (e) => {
        let hasSaved = false;
        try { 
            hasSaved = !!localStorage.getItem('spif-theme'); 
        } catch(error) {
            // Silently ignore storage blocks and allow system preferences to flow through
        }
        if (!hasSaved) applyTheme(e.matches);
    });

    /* ==========================================================================
       3. MOBILE NAVIGATION WITH FOCUS TRAP
       ========================================================================== */
    const menuBtn = document.querySelector('.menu-toggle-btn');
    const navMenu = document.querySelector('.nav-menu');

    const handleFocusTrap = (e) => {
        if (e.key !== 'Tab' || !navMenu) return;
        const focusableEls = navMenu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
        if (!focusableEls.length) return;
        const first = focusableEls[0], last = focusableEls[focusableEls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    const toggleMobileMenu = (forceState) => {
        const isOpen = document.body.classList.contains('body-nav-open');
        const willOpen = forceState !== undefined ? forceState : !isOpen;
        document.body.classList.toggle('body-nav-open', willOpen);
        document.body.style.overflow = willOpen ? 'hidden' : '';
        if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', willOpen);
            menuBtn.innerHTML = willOpen
                ? '<span class="material-symbols-rounded" aria-hidden="true">close</span>'
                : '<span class="material-symbols-rounded" aria-hidden="true">menu</span>';
        }
        if (navMenu) {
            if (willOpen) { navMenu.addEventListener('keydown', handleFocusTrap); setTimeout(() => navMenu.focus(), 50); }
            else { navMenu.removeEventListener('keydown', handleFocusTrap); }
        }
    };

    if (menuBtn) menuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMobileMenu(); });

    document.addEventListener('click', (e) => {
        if (document.body.classList.contains('body-nav-open') && navMenu && menuBtn &&
            !navMenu.contains(e.target) && !menuBtn.contains(e.target)) toggleMobileMenu(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('body-nav-open')) {
            toggleMobileMenu(false);
            if (menuBtn) menuBtn.focus();
        }
    });

    /* ==========================================================================
       4. SMOOTH NATIVE ACCORDIONS
       ========================================================================== */
    class Accordion {
        constructor(el) {
            this.el = el;
            this.summary = el.querySelector('summary');
            this.content = el.querySelector('.accordion-body') || el.querySelector('ul');
            this.animation = null;
            this.isClosing = false;
            this.isExpanding = false;
            this.animDuration = prefersReducedMotion ? 0 : 350; 
            
            if (this.summary && this.content) {
                this.summary.addEventListener('click', (e) => this.onClick(e));
            }
        }
        onClick(e) {
            if (window.getComputedStyle(this.summary).pointerEvents === 'none') return;
            e.preventDefault();
            this.el.style.overflow = 'hidden';
            if (this.isClosing || !this.el.open) this.open();
            else if (this.isExpanding || this.el.open) this.shrink();
        }
        shrink() {
            this.isClosing = true;
            this.summary.setAttribute('aria-expanded', 'false');
            const startH = `${this.el.offsetHeight}px`;
            const endH = `${this.summary.offsetHeight}px`;
            if (this.animation) this.animation.cancel();
            this.animation = this.el.animate({ height: [startH, endH] }, { duration: this.animDuration, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
            this.animation.onfinish = () => this.onFinish(false);
            this.animation.oncancel = () => { this.isClosing = false; };
        }
        open() {
            const sh = this.summary.offsetHeight;
            const ch = this.content.offsetHeight;
            this.el.style.height = `${sh}px`;
            this.el.open = true;
            this.summary.setAttribute('aria-expanded', 'true');
            window.requestAnimationFrame(() => {
                this.isExpanding = true;
                if (this.animation) this.animation.cancel();
                this.animation = this.el.animate({ height: [`${sh}px`, `${sh + ch}px`] }, { duration: this.animDuration, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
                this.animation.onfinish = () => this.onFinish(true);
                this.animation.oncancel = () => { this.isExpanding = false; };
            });
        }
        onFinish(open) {
            this.el.open = open;
            this.animation = null;
            this.isClosing = this.isExpanding = false;
            this.el.style.height = this.el.style.overflow = '';
            
            if (open) {
                const rect = this.el.getBoundingClientRect();
                const offset = 100; 
                
                if (rect.top < offset) {
                    window.scrollBy({ top: rect.top - offset, behavior: scrollBehavior });
                } else if (rect.bottom > window.innerHeight) {
                    const scrollDistance = rect.bottom - window.innerHeight + 24; 
                    window.scrollBy({ top: scrollDistance, behavior: scrollBehavior });
                }
            }
        }
    }

    document.querySelectorAll('details.accordion-item, details.footer-col').forEach(el => {
        if (el.classList.contains('footer-col') && isMobileQuery.matches) el.removeAttribute('open');
        new Accordion(el);
    });

    /* ==========================================================================
       5. SLIDERS
       ========================================================================== */
    const mediaSlider = document.querySelector('.logo-grid-manual');
    const mediaPrev = document.querySelector('.section-media .slider-controls button[aria-label="Previous logos"]');
    const mediaNext = document.querySelector('.section-media .slider-controls button[aria-label="Next logos"]');
    if (mediaSlider && mediaPrev && mediaNext) {
        mediaPrev.addEventListener('click', () => mediaSlider.scrollBy({ left: -250, behavior: scrollBehavior }));
        mediaNext.addEventListener('click', () => mediaSlider.scrollBy({ left: 250, behavior: scrollBehavior }));
    }

    const sliderContainer = document.querySelector('.section-recent-posts .blog-grid');
    const prevBtn = document.querySelector('.slider-controls button[aria-label="Previous posts"]');
    const nextBtn = document.querySelector('.slider-controls button[aria-label="Next posts"]');
    if (sliderContainer && prevBtn && nextBtn) {
        Object.assign(sliderContainer.style, { display:'flex', flexWrap:'nowrap', overflowX:'auto', scrollBehavior: scrollBehavior, scrollSnapType:'x mandatory', paddingBottom:'1rem', scrollbarWidth:'none', msOverflowStyle:'none' });
        const cards = sliderContainer.querySelectorAll('.blog-card');
        const updateCards = () => cards.forEach(c => Object.assign(c.style, { flex:'0 0 auto', width: isMobileQuery.matches ? '85vw' : '300px', scrollSnapAlign:'start' }));
        updateCards();
        prevBtn.addEventListener('click', () => sliderContainer.scrollBy({ left: isMobileQuery.matches ? -window.innerWidth*0.85 : -320, behavior: scrollBehavior }));
        nextBtn.addEventListener('click', () => sliderContainer.scrollBy({ left: isMobileQuery.matches ? window.innerWidth*0.85 : 320, behavior: scrollBehavior }));
    }

    /* ==========================================================================
       6. DROPDOWN NAVIGATION (A11Y Sync)
       ========================================================================== */
    const dropdownGroups = document.querySelectorAll('.has-dropdown');
    dropdownGroups.forEach(group => {
        const btn = group.querySelector('.nav-link');
        btn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            const isExpanded = group.classList.contains('is-expanded');
            dropdownGroups.forEach(item => {
                if (item !== group) { 
                    item.classList.remove('is-expanded'); 
                    item.querySelector('.nav-link').setAttribute('aria-expanded','false'); 
                }
            });
            group.classList.toggle('is-expanded', !isExpanded);
            btn.setAttribute('aria-expanded', !isExpanded);
        });
        group.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { 
                group.classList.remove('is-expanded'); 
                btn.setAttribute('aria-expanded','false'); 
                btn.focus(); 
            }
        });
    });
    document.addEventListener('click', () => {
        dropdownGroups.forEach(g => { 
            g.classList.remove('is-expanded'); 
            g.querySelector('.nav-link').setAttribute('aria-expanded','false'); 
        });
    });

    /* ==========================================================================
       7. BREAKPOINT SYNC
       ========================================================================== */
    let resizeTimer;
    isMobileQuery.addEventListener('change', (e) => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!e.matches) {
                if (document.body.classList.contains('body-nav-open')) toggleMobileMenu(false);
                document.querySelectorAll('details.footer-col').forEach(el => { el.setAttribute('open',''); el.style.height = el.style.overflow = ''; });
            } else {
                document.querySelectorAll('details.footer-col').forEach(el => { el.removeAttribute('open'); el.style.height = el.style.overflow = ''; });
            }
        }, 100);
    });
    if (!isMobileQuery.matches) document.querySelectorAll('details.footer-col').forEach(el => el.setAttribute('open',''));

    /* ==========================================================================
       8. ACTIVE NAV STATE
       ========================================================================== */
    const currentUrl = window.location.href.split('#')[0].replace(/\/$/, '');
    document.querySelectorAll('.nav-menu a').forEach(link => {
        const linkUrl = link.href.split('#')[0].replace(/\/$/, '');
        if (linkUrl === currentUrl || linkUrl === currentUrl + '/index.html') {
            link.classList.add('is-active');
            const parent = link.closest('.has-dropdown');
            if (parent) { const pb = parent.querySelector('.nav-link'); if (pb) pb.classList.add('is-active'); }
        }
    });

    /* ==========================================================================
       9. SCROLLSPY (Legal pages — High Specificity Desktop Only)
       ========================================================================== */
    const legalSections = document.querySelectorAll('.legal-document-body article');
    const spyLinks = document.querySelectorAll('.disclaimer-sidebar-nav a');
    if (legalSections.length > 0 && spyLinks.length > 0) {
        const spyObs = new IntersectionObserver((entries) => {
            /* UX UPGRADE: Completely kill the scroll spy loops on mobile viewports.
               The Table of Contents rolls cleanly off-screen, eliminating scroll fights. */
            if (window.matchMedia('(max-width: 899px)').matches) return;

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    spyLinks.forEach(link => {
                        link.classList.remove('is-active-spy');
                        if (link.getAttribute('href') === `#${entry.target.id}`) {
                            link.classList.add('is-active-spy');
                        }
                    });
                }
            });
        }, { rootMargin: '-10% 0px -50% 0px', threshold: 0 });
        legalSections.forEach(s => spyObs.observe(s));
    }

    /* ==========================================================================
       10. CAROUSEL (Resource pages)
       ========================================================================== */
    const track = document.getElementById('carouselTrack');
    if (track) {
        const slides = Array.from(track.children);
        const nextBtn2 = document.getElementById('btnNext');
        const prevBtn2 = document.getElementById('btnPrev');
        const dotsNav = document.getElementById('carouselDots');
        if (dotsNav) {
            slides.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.classList.add('carousel-dot');
                if (i === 0) dot.classList.add('active');
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', () => track.scrollTo({ left: slides[i].offsetLeft, behavior: scrollBehavior }));
                dotsNav.appendChild(dot);
            });
        }
        const dots = dotsNav ? Array.from(dotsNav.children) : [];
        const updateDots = () => {
            if (!dots.length || !slides.length) return;
            const idx = Math.round(track.scrollLeft / slides[0].getBoundingClientRect().width);
            dots.forEach(d => d.classList.remove('active'));
            if (dots[idx]) dots[idx].classList.add('active');
        };
        track.addEventListener('scroll', () => requestAnimationFrame(updateDots));
        if (nextBtn2) nextBtn2.addEventListener('click', () => track.scrollBy({ left: slides[0].getBoundingClientRect().width, behavior: scrollBehavior }));
        if (prevBtn2) prevBtn2.addEventListener('click', () => track.scrollBy({ left: -slides[0].getBoundingClientRect().width, behavior: scrollBehavior }));
    }

});