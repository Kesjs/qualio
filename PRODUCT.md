# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Developers, solopreneurs, and tech founders shipping web products. They deploy fast and need confidence their site actually works post-deploy — but don't have time for 80-page PDF audits or raw Sentry logs.

Secondary: Small product teams (2–6 people) running weekly QA cycles without a dedicated QA engineer.

Situation: Post-deploy or pre-launch. They have shipped code and need to know if the critical flows (signup, contact, checkout, CTAs) still work.

## Product Purpose

Qualio is a continuous website QA workspace. It runs real Playwright browser sessions against a site, captures evidence (screenshots, network logs, DOM state, console errors), and uses AI to transform raw browser data into actionable diagnostic reports with impact severity, likely cause, and confidence level.

Success = the user finds a critical issue before their users do, understands exactly what broke and why, and can verify the fix with a single re-scan.

## Positioning

Qualio does not summarize syntax errors or give Lighthouse scores. It physically interacts with the site (clicks CTAs, submits forms, follows links) and explains the business impact of each failure — not just its technical signature. No other tool in the space combines real Playwright interaction + AI diagnostic narrative + scan history diffs.

## Operating Context

- Used after deploys, before launches, and on a weekly basis
- Primary entry point: web dashboard at qualio.dev
- User adds a site URL → configures scan depth → Qualio crawls and interacts → AI produces a diagnostic workspace per site
- Re-scan flow: fix issue → click "Re-scan" → see diff (resolved vs new regressions)
- No SDK, no code instrumentation required

## Capabilities and Constraints

Confirmed MVP scope:
- Sites: add multiple sites per account
- New Scan: URL + environment (Production / Staging) + depth (Quick / Standard / Full) + check types (links, buttons, forms, console, network, mobile, images, metadata)
- Scanner: Playwright + crawler + network/console recording + responsive check
- AI Diagnosis: impact statement, likely cause, confidence level (High/Medium/Low)
- Issues: list + detail + evidence panel
- Scan History: timeline, resolved/new diff per scan
- Re-scan: from issue or workspace

Not in MVP: GitHub integration, Slack alerts, CI/CD, auto-fix, agent mode

## Brand Commitments

Name: Qualio
Tagline: "Your website QA workspace"
Voice: Direct, technical, undecorated. Speaks to engineers, not marketers.
Visual identity: Factory.ai-inspired — OLED black canvas (#000000), bone text (#eeeeee), signal orange (#ee6018) for live states, metric green (#a0ca92) for positive states. Geist weight 400 for everything. No gradients, no shadows, no bold weight headings.
Logo: Signal-orange filled 3px-radius square with scan/scope SVG mark.

## Evidence on Hand

No real testimonials, no real customers yet (pre-launch).
No benchmark data yet.
Do not fabricate: customer quotes, usage numbers, company names, scan counts.

## Product Principles

1. Evidence before diagnosis — AI interprets only what the browser observed, never invents causes
2. Impact over noise — every issue surfaces user impact, not just technical error codes
3. Continuous, not one-shot — scan history and diffs make Qualio a workspace, not a report
4. Confidence declared — AI states its confidence level; uncertainty is shown, not hidden
5. Minimal setup — no SDK, no instrumentation, just a URL
