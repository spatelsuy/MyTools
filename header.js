class SiteHeader extends HTMLElement {
    connectedCallback() {
        const root = this.getAttribute('root') || '';
        const active = this.getAttribute('active') || '';
        this.innerHTML = `
        <header>
            <div class="header-inner">
                <div class="brand">
                    <a href="${root}index.html" class="logo"><span></span>SPBasic Tools</a>
                    <p class="tagline">Simple and practical utilities for everyday tasks.</p>
                </div>
                <nav aria-label="Main">
                    <a href="${root}index.html" ${active === 'tools' ? 'aria-current="page"' : ''}>Tools</a>
                    <a href="${root}about.html" ${active === 'about' ? 'aria-current="page"' : ''}>About</a>
                    <a href="https://www.youtube.com/watch?v=nhKAyrSPhgI&t=11s" target="_blank" rel="noopener noreferrer">Feedback</a>
                </nav>
            </div>
        </header>`;
    }
}
customElements.define('site-header', SiteHeader);
