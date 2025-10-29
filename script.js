// Header Scroll Effect
class HeaderScroll {
    constructor() {
        this.header = document.querySelector('.header');
        this.scrollThreshold = 10; // 8-12px as requested
        this.init();
    }

    init() {
        if (!this.header) return;
        
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    }

    handleScroll() {
        const scrollY = window.scrollY;
        
        if (scrollY > this.scrollThreshold) {
            this.header.classList.add('is-scrolled');
        } else {
            this.header.classList.remove('is-scrolled');
        }
    }
}

// Mobile Menu Management
class MobileMenu {
    constructor() {
        this.burgerButton = document.querySelector('.burger-button');
        this.mobileMenu = document.querySelector('.mobile-menu');
        this.closeButton = document.querySelector('.mobile-menu__close');
        this.overlay = document.querySelector('.mobile-menu__overlay');
        this.mobileLinks = document.querySelectorAll('.mobile-menu__link');
        this.mobileCtaButton = document.querySelector('.mobile-menu__cta a[href="#form"]') || 
                               document.querySelector('.mobile-menu__cta .cta-button');
        
        this.isOpen = false;
        this.focusableElements = [];
        this.firstFocusableElement = null;
        this.lastFocusableElement = null;
        
        this.init();
    }

    init() {
        if (!this.burgerButton || !this.mobileMenu) return;
        
        this.setupEventListeners();
        this.setupFocusableElements();
    }

    setupEventListeners() {
        // Burger button click
        this.burgerButton.addEventListener('click', () => this.toggle());
        
        // Close button click
        this.closeButton?.addEventListener('click', () => this.close());
        
        // Overlay click
        this.overlay?.addEventListener('click', () => this.close());
        
        // Mobile links click
        this.mobileLinks.forEach(link => {
            link.addEventListener('click', () => this.close());
        });
        
        // Mobile CTA button click - use event delegation from mobile menu
        this.mobileMenu?.addEventListener('click', (event) => {
            const ctaButton = event.target.closest('.mobile-menu__cta a[href="#form"]') || 
                            event.target.closest('.mobile-menu__cta .cta-button');
            
            if (ctaButton) {
                event.preventDefault();
                event.stopPropagation();
                
                // Find target element
                const targetId = ctaButton.getAttribute('href')?.substring(1);
                if (!targetId) return;
                
                const targetElement = document.getElementById(targetId);
                if (!targetElement) return;
                
                // Close menu first
                this.close();
                
                // Scroll to form after menu closes
                setTimeout(() => {
                    const headerHeight = 70;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }, 300);
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Window resize - close menu on desktop
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    setupFocusableElements() {
        const focusableSelectors = [
            'button:not([disabled])',
            'a[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ];
        
        this.focusableElements = Array.from(
            this.mobileMenu.querySelectorAll(focusableSelectors.join(', '))
        );
        
        if (this.focusableElements.length > 0) {
            this.firstFocusableElement = this.focusableElements[0];
            this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
        }
    }

    handleKeydown(event) {
        if (!this.isOpen) return;
        
        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                this.close();
                break;
                
            case 'Tab':
                this.handleTabKey(event);
                break;
        }
    }

    handleTabKey(event) {
        if (this.focusableElements.length === 0) return;
        
        if (event.shiftKey) {
            // Shift + Tab (backwards)
            if (document.activeElement === this.firstFocusableElement) {
                event.preventDefault();
                this.lastFocusableElement?.focus();
            }
        } else {
            // Tab (forwards)
            if (document.activeElement === this.lastFocusableElement) {
                event.preventDefault();
                this.firstFocusableElement?.focus();
            }
        }
    }

    handleResize() {
        // Close menu if window is resized to desktop size
        if (window.innerWidth >= 992 && this.isOpen) {
            this.close();
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.mobileMenu.classList.add('is-open');
        this.burgerButton.setAttribute('aria-expanded', 'true');
        this.burgerButton.setAttribute('aria-label', 'Закрити меню');
        
        // Prevent body scroll
        document.body.classList.add('menu-open');
        
        // Focus first focusable element
        this.firstFocusableElement?.focus();
        
        // Announce to screen readers
        this.announceMenuState('Відкрито');
    }

    close() {
        this.isOpen = false;
        this.mobileMenu.classList.remove('is-open');
        this.burgerButton.setAttribute('aria-expanded', 'false');
        this.burgerButton.setAttribute('aria-label', 'Відкрити меню');
        
        // Restore body scroll
        document.body.classList.remove('menu-open');
        
        // Return focus to burger button
        this.burgerButton.focus();
        
        // Announce to screen readers
        this.announceMenuState('Закрито');
    }

    announceMenuState(state) {
        // Create or update live region for screen reader announcements
        let liveRegion = document.getElementById('menu-announcements');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'menu-announcements';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }
        
        liveRegion.textContent = `Мобільне меню ${state}`;
    }
}

// Active Link Highlighting
class ActiveLinkHighlighter {
    constructor() {
        this.sections = document.querySelectorAll('section[id]');
        this.navLinks = document.querySelectorAll('.nav__link, .mobile-menu__link');
        this.observer = null;
        
        this.init();
    }

    init() {
        if (!this.sections.length || !this.navLinks.length) return;
        
        this.setupIntersectionObserver();
        this.setupScrollListener();
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.updateActiveLink(entry.target.id);
                }
            });
        }, options);

        this.sections.forEach(section => {
            this.observer.observe(section);
        });
    }

    setupScrollListener() {
        // Fallback for when IntersectionObserver is not supported
        if (!this.observer) {
            window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        }
    }

    handleScroll() {
        const scrollY = window.scrollY;
        let currentSection = '';

        this.sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentSection = section.id;
            }
        });

        if (currentSection) {
            this.updateActiveLink(currentSection);
        }
    }

    updateActiveLink(activeId) {
        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            if (href === `#${activeId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Analytics Placeholder
class AnalyticsTracker {
    constructor() {
        this.init();
    }

    init() {
        // Delegate click events to capture analytics data
        document.addEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const element = event.target.closest('[data-analytics]');
        if (!element) return;

        const analyticsType = element.getAttribute('data-analytics');
        const data = this.extractAnalyticsData(element);

        this.logAnalytics(analyticsType, data);
    }

    extractAnalyticsData(element) {
        const data = {};

        // Extract data attributes
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                const key = attr.name.replace('data-', '');
                data[key] = attr.value;
            }
        });

        // Extract additional context
        data.element = element.tagName.toLowerCase();
        data.href = element.getAttribute('href') || '';
        data.text = element.textContent.trim();

        return data;
    }

    logAnalytics(type, data) {
        // Placeholder analytics logging
        console.group(`📊 Analytics Event: ${type}`);
        console.log('Event Data:', data);
        console.log('Timestamp:', new Date().toISOString());
        
        // Here you would normally send to your analytics service
        // Example: gtag('event', type, data);
        
        console.groupEnd();
    }
}

// Smooth Scroll Enhancement
class SmoothScrollEnhancer {
    constructor() {
        this.init();
    }

    init() {
        // Only enhance if user hasn't requested reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        document.addEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const link = event.target.closest('a[href^="#"]');
        if (!link) return;
        
        // Skip if this is a mobile menu CTA button (it has its own handler)
        if (link.closest('.mobile-menu__cta')) {
            return;
        }

        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (!targetElement) return;

        // Check if mobile menu is open
        const mobileMenu = document.querySelector('.mobile-menu');
        const isMobileMenuOpen = mobileMenu?.classList.contains('is-open');

        event.preventDefault();

        // Calculate offset for sticky header
        const headerHeight = 70; // Header height in pixels
        const targetPosition = targetElement.offsetTop - headerHeight - 20;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        // Close mobile menu if it was open
        if (isMobileMenuOpen) {
            setTimeout(() => {
                mobileMenu.classList.remove('is-open');
                document.body.classList.remove('menu-open');
                const burgerButton = document.querySelector('.burger-button');
                if (burgerButton) {
                    burgerButton.setAttribute('aria-expanded', 'false');
                    burgerButton.setAttribute('aria-label', 'Відкрити меню');
                    burgerButton.focus();
                }
            }, 300);
        }
    }
}

// Cooperation Form Manager
class CooperationFormManager {
    constructor() {
        this.form = document.getElementById('cooperationForm');
        this.sectionHeader = document.querySelector('.form__section-header');
        this.sectionContent = document.querySelector('.form__section-content');
        this.init();
    }

    init() {
        if (!this.form) return;
        
        // Setup questionnaire toggle
        this.setupQuestionnaireToggle();
        
        // Setup form validation
        this.setupFormValidation();
        
        // Setup form submission
        this.setupFormSubmission();
    }

    setupQuestionnaireToggle() {
        if (!this.sectionHeader || !this.sectionContent) return;

        this.sectionHeader.addEventListener('click', () => {
            this.toggleQuestionnaire();
        });

        // Keyboard support
        this.sectionHeader.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.toggleQuestionnaire();
            }
        });
    }

    toggleQuestionnaire() {
        const isExpanded = this.sectionHeader.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
            this.closeQuestionnaire();
        } else {
            this.openQuestionnaire();
        }
    }

    openQuestionnaire() {
        this.sectionHeader.setAttribute('aria-expanded', 'true');
        this.sectionContent.classList.add('is-open');
    }

    closeQuestionnaire() {
        this.sectionHeader.setAttribute('aria-expanded', 'false');
        this.sectionContent.classList.remove('is-open');
    }

    setupFormValidation() {
        // Real-time validation for inputs
        const inputs = this.form.querySelectorAll('.form__input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                // Clear error on input
                this.clearFieldError(input);
            });
        });

        // Real-time validation for radio groups
        const radioGroups = this.form.querySelectorAll('input[type="radio"]');
        radioGroups.forEach(radio => {
            radio.addEventListener('change', () => {
                this.clearFieldError(radio);
            });
        });
    }

    setupFormSubmission() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleSubmit();
        });
    }

    async handleSubmit() {
        // Clear all previous errors
        this.clearAllErrors();

        // Validate all fields
        const isValid = this.validateForm();

        if (!isValid) {
            // If questionnaire has errors and is closed, open it
            const questionnaireErrors = this.sectionContent.querySelectorAll('.form__error.is-visible');
            if (questionnaireErrors.length > 0 && !this.sectionContent.classList.contains('is-open')) {
                this.openQuestionnaire();
            }
            
            // Scroll to first error
            setTimeout(() => {
                this.scrollToFirstError();
            }, 400); // Wait for animation
            return;
        }

        // Collect form data
        const formData = this.collectFormData();

        // Log form data
        console.group('📋 Form Submission');
        console.log('Form Data:', formData);
        console.groupEnd();

        // Disable submit button to prevent double submission
        const submitButton = this.form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span>Надсилаємо...</span>';

        try {
            // Send data to webhook
            const webhookUrl = 'https://dmekhed.app.n8n.cloud/webhook/055db9ff-5526-4a48-83e1-9f3be2a5c245';
            
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            console.log('✅ Form data sent successfully');
            
            // Redirect to thank you page
            window.location.href = 'thankyou.html';
            
        } catch (error) {
            console.error('❌ Error sending form data:', error);
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            
            // Show error message to user
            alert('Виникла помилка при відправці форми. Будь ласка, спробуйте ще раз або зв\'яжіться з нами за телефоном.');
        }
    }

    validateForm() {
        let isValid = true;

        // Validate radio groups
        const radioGroups = ['objectStage', 'power', 'parkingSpots', 'infrastructure'];
        radioGroups.forEach(groupName => {
            if (!this.validateRadioGroup(groupName)) {
                isValid = false;
            }
        });

        // Validate text inputs
        const inputs = this.form.querySelectorAll('.form__input');
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateRadioGroup(groupName) {
        const radios = this.form.querySelectorAll(`input[name="${groupName}"]`);
        const isChecked = Array.from(radios).some(radio => radio.checked);

        if (!isChecked) {
            this.showFieldError(radios[0], 'Будь ласка, оберіть один з варіантів');
            return false;
        }

        return true;
    }

    validateField(input) {
        const value = input.value.trim();
        const name = input.name;

        // Check if field is required and empty
        if (input.hasAttribute('required') && !value) {
            this.showFieldError(input, 'Це поле обов\'язкове для заповнення');
            return false;
        }

        // Validate location type
        if (name === 'locationType' && value && value.length < 2) {
            this.showFieldError(input, 'Вкажіть тип вашої локації');
            return false;
        }

        // Validate phone number
        if (name === 'phone' && value) {
            const phoneRegex = /^(\+380|380|0)\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
            if (!phoneRegex.test(value.replace(/\s+/g, ' '))) {
                this.showFieldError(input, 'Введіть коректний номер телефону');
                return false;
            }
        }

        // Validate name
        if (name === 'name' && value && value.length < 2) {
            this.showFieldError(input, 'Ім\'я має містити принаймні 2 символи');
            return false;
        }

        // Validate location
        if (name === 'location' && value && value.length < 5) {
            this.showFieldError(input, 'Вкажіть повну адресу локації');
            return false;
        }

        return true;
    }

    showFieldError(field, message) {
        const fieldName = field.name;
        const errorElement = this.form.querySelector(`[data-error="${fieldName}"]`);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('is-visible');
        }

        if (field.classList) {
            field.classList.add('is-invalid');
        }
    }

    clearFieldError(field) {
        const fieldName = field.name;
        const errorElement = this.form.querySelector(`[data-error="${fieldName}"]`);
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('is-visible');
        }

        if (field.classList) {
            field.classList.remove('is-invalid');
        }
    }

    clearAllErrors() {
        const errorElements = this.form.querySelectorAll('.form__error');
        errorElements.forEach(error => {
            error.textContent = '';
            error.classList.remove('is-visible');
        });

        const invalidFields = this.form.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
        });
    }

    scrollToFirstError() {
        const firstError = this.form.querySelector('.form__error.is-visible');
        if (firstError) {
            const field = firstError.parentElement;
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    collectFormData() {
        const formData = new FormData(this.form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    }
}

// Segment Tabs Manager
class SegmentTabsManager {
    constructor() {
        this.tabs = document.querySelectorAll('.segment-tab');
        this.packages = document.querySelectorAll('.segment-package');
        this.init();
    }

    init() {
        if (!this.tabs.length || !this.packages.length) return;

        // Setup click handlers for tabs
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchSegment(tab));
            
            // Keyboard support
            tab.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.switchSegment(tab);
                }
            });
        });
    }

    switchSegment(selectedTab) {
        const targetSegment = selectedTab.getAttribute('data-segment');
        const isExpanded = selectedTab.getAttribute('aria-expanded') === 'true';
        const isActive = selectedTab.classList.contains('active');

        // If clicking on active tab, toggle it
        if (isActive && isExpanded) {
            // Close the active tab
            this.closeTab(selectedTab);
            selectedTab.classList.remove('active');
        } else {
            // Close all other tabs first
            this.tabs.forEach(tab => {
                if (tab !== selectedTab) {
                    this.closeTab(tab);
                    tab.classList.remove('active');
                }
            });

            // Activate and open the clicked tab
            selectedTab.classList.add('active');
            this.openTab(selectedTab);
        }

        // Log analytics
        console.log(`📊 Segment: ${targetSegment}, expanded: ${!isExpanded}`);
    }

    openTab(tab) {
        const targetSegment = tab.getAttribute('data-segment');
        
        tab.setAttribute('aria-expanded', 'true');
        
        // Find and show corresponding package
        this.packages.forEach(pkg => {
            const packageSegment = pkg.getAttribute('data-package');
            
            if (packageSegment === targetSegment) {
                // Add active class first
                pkg.classList.add('active');
                
                // Trigger reflow to ensure transition works
                void pkg.offsetHeight;
                
                // Add expanded class for smooth transition
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        pkg.classList.add('is-expanded');
                    });
                });
            }
        });

        // Removed automatic scroll - let user stay where they are
    }

    closeTab(tab) {
        const targetSegment = tab.getAttribute('data-segment');
        
        tab.setAttribute('aria-expanded', 'false');
        
        // Find and hide corresponding package
        this.packages.forEach(pkg => {
            const packageSegment = pkg.getAttribute('data-package');
            
            if (packageSegment === targetSegment) {
                // Remove expanded class first
                pkg.classList.remove('is-expanded');
                
                // Remove active class after transition
                setTimeout(() => {
                    pkg.classList.remove('active');
                }, 700);
            }
        });
    }
}

// Cooperation Models Management (Accordion-like behavior)
class CooperationAccordionManager {
    constructor() {
        this.cards = document.querySelectorAll('.cooperation-card');
        this.init();
    }

    init() {
        if (!this.cards.length) return;

        this.cards.forEach(card => {
            const header = card.querySelector('.cooperation-card__header');
            const content = card.querySelector('.cooperation-card__content');

            if (!header || !content) return;

            // Setup click handler
            header.addEventListener('click', () => this.toggle(card));

            // Setup keyboard handler
            header.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.toggle(card);
                }
            });
        });
    }

    toggle(card) {
        const header = card.querySelector('.cooperation-card__header');
        const content = card.querySelector('.cooperation-card__content');
        const isExpanded = header.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
            this.close(card);
        } else {
            this.open(card);
        }
    }

    open(card) {
        const header = card.querySelector('.cooperation-card__header');
        const content = card.querySelector('.cooperation-card__content');

        header.setAttribute('aria-expanded', 'true');
        content.classList.add('is-open');

        // Announce to screen readers
        this.announceState(card, 'розгорнуто');
    }

    close(card) {
        const header = card.querySelector('.cooperation-card__header');
        const content = card.querySelector('.cooperation-card__content');

        header.setAttribute('aria-expanded', 'false');
        content.classList.remove('is-open');

        // Announce to screen readers
        this.announceState(card, 'згорнуто');
    }

    closeAll() {
        this.cards.forEach(card => this.close(card));
    }

    openAll() {
        this.cards.forEach(card => this.open(card));
    }

    announceState(card, state) {
        const title = card.querySelector('.cooperation-card__title')?.textContent || '';
        
        // Create or update live region for screen reader announcements
        let liveRegion = document.getElementById('cooperation-card-announcements');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'cooperation-card-announcements';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }
        
        liveRegion.textContent = `${title} ${state}`;
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    new HeaderScroll();
    new MobileMenu();
    new ActiveLinkHighlighter();
    new AnalyticsTracker();
    new SmoothScrollEnhancer();
    new CooperationFormManager();
    new SegmentTabsManager();
    new CooperationAccordionManager();

    // Log initialization
    console.log('🚀 Landing page initialized successfully');
    console.log('📱 Mobile menu ready');
    console.log('📊 Analytics tracking active');
    console.log('🎯 Active link highlighting enabled');
    console.log('📋 Cooperation form ready');
    console.log('🎛️ Segment tabs ready');
    console.log('🤝 Cooperation models ready');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📄 Page hidden');
    } else {
        console.log('📄 Page visible');
    }
});

// Export for potential testing or external use
window.LandingPage = {
    HeaderScroll,
    MobileMenu,
    ActiveLinkHighlighter,
    AnalyticsTracker,
    SmoothScrollEnhancer,
    CooperationFormManager,
    SegmentTabsManager,
    CooperationAccordionManager
};
