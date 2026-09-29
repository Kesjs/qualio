# Correction prompt contract

Qualio generates a correction prompt from a persisted issue, its scan, and the evidence captured by the browser.

## Included context

- site URL and environment;
- detected stack and repository provider metadata, when supplied by the user;
- observed page, action, viewport, status, and evidence identifiers;
- expected behavior, actual behavior, reproduction steps, location hints, acceptance check, and uncertainties;
- screenshots, network, console, DOM, and trace evidence references that belong to the issue.

The prompt explicitly states that Qualio has no source-code or repository access. It is intended to be copied into a coding assistant or shared with a developer.

## Safety rules

Evidence is redacted before it reaches an AI provider or the prompt endpoint. Cookies, authorization headers, tokens, passwords, secrets, and sensitive URL query parameters are removed. Payloads are truncated to keep the context bounded.

The API route checks the authenticated user, then verifies ownership through the issue, scan, and site relationships. An issue cannot be used to read another workspace's evidence.

## Completion criteria

An issue is ready when:

1. its `fix_context` contains the structured correction fields;
2. the prompt endpoint returns the prompt and evidence count for the owning user;
3. the dashboard can copy the prompt;
4. a re-scan can mark the issue resolved or expose a regression.
