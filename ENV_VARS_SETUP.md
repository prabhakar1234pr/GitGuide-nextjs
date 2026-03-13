# Environment Variables Setup

## Required: Update DNS First

**workspaces.gitguide.dev** must point to the load balancer IP for HTTPS to work.

1. Go to your DNS provider (Namecheap, Cloudflare, etc.)
2. Update the **A record** for `workspaces.gitguide.dev`:
   - **Type:** A
   - **Host:** workspaces (or @ if using root)
   - **Value:** `34.102.224.212`
   - **TTL:** 300 or Auto

3. Wait 15–60 minutes for DNS propagation and SSL certificate provisioning.

4. Verify: `curl https://workspaces.gitguide.dev/health`

---

## Vercel (crysivo-frontend)

| Variable                             | Value                             | Environments        |
| ------------------------------------ | --------------------------------- | ------------------- |
| `WORKSPACE_API_BASE_URL`             | `https://workspaces.gitguide.dev` | Production, Preview |
| `NEXT_PUBLIC_WORKSPACE_API_BASE_URL` | `https://workspaces.gitguide.dev` | Production, Preview |

---

## Summary

- [ ] Update DNS: workspaces.gitguide.dev → 34.102.224.212
- [ ] Add both env vars in Vercel
- [ ] Redeploy frontend
