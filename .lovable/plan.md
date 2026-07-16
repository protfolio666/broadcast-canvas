## Problem

The Netlify site fails because server functions can't find Supabase credentials. You added `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, but those are only for the browser bundle (baked in at build time). Server functions run on Netlify Edge and read `process.env.SUPABASE_URL` and `process.env.SUPABASE_PUBLISHABLE_KEY` — the non-VITE names. Those two are missing, so every server function throws "Missing Supabase environment variable(s)".

## Fix

**In Netlify → Site settings → Environment variables**, add these two additional variables (keep the VITE_ ones you already have):

- `SUPABASE_URL` = `https://yebrwuvavhphgwhzjxyt.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_m4XXmQ2AizttVuF088806Q_3qJr5ea_`

Optional (only needed if you use admin/service-role features later):
- `SUPABASE_SERVICE_ROLE_KEY` — not available on Lovable Cloud, skip for now.

Then **Deploys → Trigger deploy → Clear cache and deploy site**.

Final list on Netlify should be all 4:
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

## About the Google "dangerous site" warning

Free `*.netlify.app` subdomains get flagged by Google Safe Browsing regularly because scammers abuse them. There is nothing to fix in your code. Two options:
1. **Connect a custom domain** (recommended) — the warning goes away and your OBS URL becomes stable.
2. **Request a review** at https://safebrowsing.google.com/safebrowsing/report_error/ — often ignored for shared subdomains.

## No code changes needed

This is purely a Netlify config issue. Once you add the two env vars and redeploy, the app will work.
