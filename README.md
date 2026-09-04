# spif.in

The website of the **Suicide Prevention India Foundation**, a Section-8 not-for-profit
incubated at IIM Bangalore.

Hand-written HTML, CSS and vanilla JavaScript. No framework, no CMS, no build step,
no dependencies. 86 pages, deployed to Azure Static Web Apps on push and served
through Cloudflare.

> If you or someone you know needs support: **Tele-MANAS 14416** or **KIRAN
> 1800-599-0019**. Both are free, confidential and answered 24/7 in multiple
> Indian languages.

---

## Why it is built this way

Most people arrive here on a phone, on a patchy connection, at a moment that
matters. Someone looking for a helpline number should not wait on a database
query, and the number should still be on screen if a script fails to load.

The previous site ran on a CMS. Replacing it with static files removed the
database, the admin login and the plugin surface at the same time as the latency.

---

## Structure

```
├── *.html                    top-level pages
├── blog/                     12 posts + index
├── resources/                35 guides + index
├── authors/                  6 author profiles + index
├── assets/css/main.css       all styles; design tokens at the top
├── assets/js/main.js         all behaviour
├── staticwebapp.config.json  routing, 79 redirects, security headers
├── sitemap.xml · robots.txt
└── llms.txt                  guidance for AI crawlers
```

| Layer | Choice |
|---|---|
| Hosting | Azure Static Web Apps |
| CDN, DNS, TLS | Cloudflare |
| Analytics | GA4 through Cloudflare Zaraz, processed at the edge so the visitor's device does not download an analytics library and IPs are not forwarded directly to Google |
| CI | GitHub Actions, deploy on push to `main` |

---

## Decisions worth explaining

**Guides are HTML, not PDF.** Several clinical toolkits previously existed only as
PDFs. A PDF on a phone means a download, a viewer, pinch-zooming, no reflow and
often nothing useful for a screen reader. They are now semantic HTML, with a print
stylesheet for anyone who wants a physical copy.

**Illustrations, not stock photography.** Custom vector illustrations replaced stock
imagery: lighter to load, and a more neutral register for the subject.

**Old URLs are preserved.** The site carries backlinks from news coverage going back
years. Every previous URL is mapped in `staticwebapp.config.json` rather than left
to 404.

**Training is described, not sold.** QPR gatekeeper training in India is delivered by
[QPR Institute India](https://qprindia.com), a separate organisation. This site
explains the method and links onward. Nothing is sold here, which keeps the Google
Ad Grant uncomplicated.

---

## Accessibility and contrast

Both themes are checked against WCAG AA by a script that walks every text node,
composites the actual alpha stack up the DOM tree, and computes the ratio against
the threshold for that font size and weight.

Two failures it caught, both since fixed:

- `--text-muted` had no dark-theme override and sat at **3.07:1** on cards
- `.btn--primary` hardcoded white text, so in dark mode white on `#38bdf8` was **2.14:1**

There is now a `--text-on-brand` token that flips with the theme. Every page passes
in both themes at 390px.

Also in place: a skip link, one `h1` per page, alt text on every image with
decorative images marked `alt=""`, visible focus states, and `prefers-reduced-motion`
honoured in CSS and JS.

---

## Security

Set in `staticwebapp.config.json`: HSTS with preload, CSP, `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy` and `Permissions-Policy`.

There is no database, no login, no user input and no server-side code.

---

## Cache busting

`main.css` and `main.js` are linked with a `?v=N` query string. **When you change
either file, bump the number on every page**, or the change will not reach people
who have already visited:

```bash
sed -i '' 's|main.css?v=2|main.css?v=3|g; s|main.js?v=2|main.js?v=3|g' \
  *.html blog/*.html resources/*.html authors/*.html
```

If you forget, purge the Cloudflare cache.

---

## Local development

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Nothing to install, nothing to compile. Clean
URLs are resolved by Azure at the edge, so local links may need the `.html`
extension.

Note that the security headers only exist in production. To test against the real
conditions, serve with the headers from `staticwebapp.config.json` applied — a CSP
that blocks an inline script will pass silently on a plain local server and fail
on the live site.

---

## Deployment

Azure generates its own workflow file in `.github/workflows/` on first connect,
with a deployment-token secret name matching the app. Keep that file; do not
replace it. Every push to `main` deploys.

---

## Known limitations

- **English only.** Tele-MANAS operates in more than 13 languages; this site does not yet.
- **No on-site search.** 86 pages is past the point where it would earn its place.
- **Contact is `mailto:` only.** No form handler, so no record of submissions.
- **Fonts load from Google's CDN.** Self-hosting would remove a third-party round trip
  on the slowest connections, and would remove a failure mode: Material Symbols is a
  ligature font, so if it does not load, icon spans render their names as text.
- **No service worker.** Caching the helpline directory for offline access is the
  strongest available version of this site's purpose and is not built yet.

---

## Credits

Built and maintained pro bono by [Adostrophe](https://adostrophe.com/), Bengaluru.

Site content © Suicide Prevention India Foundation. The code is published for
transparency and reference; please ask before reusing the content.

**SPIF does not provide crisis intervention.** The helplines above are run by the
Government of India and answered by trained counsellors.
