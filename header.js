class SiteHeader extends HTMLElement {
    connectedCallback() {
        const root = this.getAttribute('root') || '';
        const active = this.getAttribute('active') || '';
        this.innerHTML = `
        <header>
            <div class="header-inner">
                <a href="${root}index.html" class="brand">
                    <svg class="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="30" height="30" aria-hidden="true">
                        <rect fill="var(--accent, #1f6f54)" width="42" height="42" rx="10"/>
                        <rect fill="var(--accent, #1f6f54)" x="54" width="42" height="42" rx="10"/>
                        <rect fill="var(--accent, #1f6f54)" y="54" width="42" height="42" rx="10"/>
                        <rect fill="#4cc3b0" x="54" y="54" width="42" height="42" rx="10"/>
                    </svg>
                    <div class="brand-text">
                        <span class="logo-title">SPBasic Tools</span>
                        <span class="tagline">Simple and practical utilities for everyday tasks.</span>
                    </div>
                </a>
                <nav aria-label="Main">
                    <a href="${root}index.html" ${active === 'tools' ? 'aria-current="page"' : ''}>Tools</a>
                    <a href="${root}about.html" ${active === 'about' ? 'aria-current="page"' : ''}>About</a>
                    <a href="https://www.youtube.com/watch?v=P0ZwJGeLymU" target="_blank" rel="noopener noreferrer">Feedback</a>
                </nav>
            </div>
        </header>`;
    }
}
customElements.define('site-header', SiteHeader);
