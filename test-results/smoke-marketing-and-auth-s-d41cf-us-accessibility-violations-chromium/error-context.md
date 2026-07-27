# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> marketing and auth shells >> landing has no serious accessibility violations
- Location: tests/e2e/smoke.spec.ts:13:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at /var/folders/dy/84t234t13734t4zt94wczqjm0000gn/T/cursor-sandbox-cache/441e197b761fbc42f375a69b185395ff/playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```