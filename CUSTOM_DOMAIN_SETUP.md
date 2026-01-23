# Custom Domain Setup for GitGuide.com

Guide to configure `www.gitguide.com` (or `gitguide.com`) on Vercel.

## Prerequisites

✅ Domain purchased from a registrar (Namecheap, GoDaddy, Google Domains, etc.)
✅ Vercel project deployed and working
✅ Access to your domain registrar's DNS settings

---

## Step 1: Purchase Domain (If Not Already Owned)

If you don't own `gitguide.com` yet:

1. **Choose a Registrar:**
   - [Namecheap](https://www.namecheap.com) - Recommended, good prices
   - [GoDaddy](https://www.godaddy.com)
   - [Google Domains](https://domains.google)
   - [Cloudflare Registrar](https://www.cloudflare.com/products/registrar) - At-cost pricing

2. **Search and Purchase:**
   - Search for `gitguide.com`
   - Purchase the domain (usually $10-15/year)

---

## Step 2: Add Domain in Vercel

### 2.1 In Vercel Dashboard

1. Go to your project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `www.gitguide.com`
4. Click **"Add"**

### 2.2 Vercel Will Show DNS Configuration

Vercel will display DNS records you need to add:

**For `www.gitguide.com`:**

- **Type:** `CNAME`
- **Name:** `www`
- **Value:** `cname.vercel-dns.com` (or similar - Vercel will show exact value)
- **TTL:** `3600` (or Auto)

**For root domain `gitguide.com` (optional but recommended):**

- **Type:** `A` or `ALIAS`
- **Name:** `@` (or blank/root)
- **Value:** Vercel will provide IP addresses or ALIAS target
- **TTL:** `3600`

---

## Step 3: Configure DNS at Your Domain Registrar

### 3.1 Log into Your Domain Registrar

Go to your registrar's dashboard (Namecheap, GoDaddy, etc.)

### 3.2 Navigate to DNS Management

- **Namecheap:** Domain List → Manage → Advanced DNS
- **GoDaddy:** My Products → Domains → DNS
- **Google Domains:** DNS → Custom records

### 3.3 Add DNS Records

**Add CNAME for www:**

```
Type: CNAME
Host: www
Value: cname.vercel-dns.com (use exact value from Vercel)
TTL: Automatic (or 3600)
```

**Add A Record for root domain (gitguide.com):**

```
Type: A
Host: @ (or blank)
Value: 76.76.21.21 (Vercel will provide exact IPs - usually 2-4 IPs)
TTL: Automatic (or 3600)
```

**OR use ALIAS/ANAME (if your registrar supports it):**

```
Type: ALIAS (or ANAME)
Host: @
Value: cname.vercel-dns.com
TTL: Automatic
```

**Note:** Some registrars (like Namecheap) use different formats:

- Host might be `@` or blank for root domain
- Some use `www` as subdomain, `@` for root

---

## Step 4: Wait for DNS Propagation

1. **DNS changes take 24-48 hours** to fully propagate globally
2. **Usually works within 1-2 hours** in most regions
3. Check status in Vercel → Domains → Your domain will show "Valid Configuration" when ready

**Check DNS propagation:**

- Use [whatsmydns.net](https://www.whatsmydns.net) to check globally
- Or use command: `nslookup www.gitguide.com`

---

## Step 5: Update Clerk Configuration

### 5.1 Add Domain to Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. **Configure** → **Domains**
3. Click **"Add Domain"**
4. Enter: `www.gitguide.com`
5. Also add: `gitguide.com` (without www)

### 5.2 Update Redirect URLs (Optional)

In Clerk → **Paths**:

- Ensure redirect URLs work with your domain
- Test sign-in/sign-up flows

---

## Step 6: Update Backend CORS (If Needed)

If you restricted CORS to specific domains, add your custom domain:

### 6.1 Update Cloud Run Environment Variables

Add to your Cloud Run service environment variables:

```bash
CORS_ORIGINS=https://www.gitguide.com,https://gitguide.com,https://*.vercel.app
```

Or update in your backend code (`app/config.py`):

```python
cors_origins = [
    "https://www.gitguide.com",
    "https://gitguide.com",
    "https://*.vercel.app",  # Keep for preview deployments
]
```

### 6.2 Redeploy Backend

After updating CORS, redeploy:

```bash
git commit -m "Update CORS for custom domain"
git push  # Triggers GitHub Actions deployment
```

---

## Step 7: Update Frontend Environment Variables (Optional)

If you want to use your custom domain in API calls (not necessary, but good practice):

In Vercel → Environment Variables, you can add:

```
NEXT_PUBLIC_APP_URL=https://www.gitguide.com
```

But `NEXT_PUBLIC_API_URL` should still point to Cloud Run.

---

## Step 8: SSL Certificate (Automatic)

✅ **Vercel automatically provisions SSL certificates** via Let's Encrypt
✅ **No manual configuration needed**
✅ Certificate renews automatically

Your site will be available at:

- `https://www.gitguide.com` ✅
- `https://gitguide.com` ✅ (if configured)

---

## Step 9: Verify Everything Works

### 9.1 Test Domain

1. Visit `https://www.gitguide.com`
2. Should load your Vercel deployment
3. Check browser shows 🔒 (SSL certificate)

### 9.2 Test Authentication

1. Sign in/Sign up should work
2. Clerk should recognize the domain
3. No CORS errors in console

### 9.3 Test API Calls

1. Create a project
2. Verify API calls succeed
3. Check browser Network tab for successful requests

---

## Common Issues & Solutions

### Issue: Domain Shows "Invalid Configuration"

**Solution:**

- Double-check DNS records match exactly what Vercel shows
- Wait 24-48 hours for full propagation
- Use [DNS checker](https://www.whatsmydns.net) to verify records globally

### Issue: www Works But Root Domain Doesn't

**Solution:**

- Add A record or ALIAS for root domain (`@`)
- Some registrars require both www and root records

### Issue: SSL Certificate Not Issued

**Solution:**

- Wait up to 24 hours (Vercel auto-provisions SSL)
- Ensure DNS records are correct
- Check Vercel dashboard for SSL status

### Issue: CORS Errors After Adding Domain

**Solution:**

- Update backend CORS to include `https://www.gitguide.com`
- Redeploy backend
- Clear browser cache

---

## DNS Record Examples by Registrar

### Namecheap

```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic

Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic
```

### GoDaddy

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600 seconds

Type: A
Name: @
Value: 76.76.21.21
TTL: 600 seconds
```

### Cloudflare

```
Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy: Off (DNS only)

Type: A
Name: @
Target: 76.76.21.21
Proxy: Off (DNS only)
```

---

## Quick Checklist

- [ ] Domain purchased
- [ ] Domain added in Vercel
- [ ] DNS records added at registrar
- [ ] DNS propagated (check with whatsmydns.net)
- [ ] Domain shows "Valid Configuration" in Vercel
- [ ] SSL certificate issued (automatic, wait 24h)
- [ ] Domain added to Clerk dashboard
- [ ] Backend CORS updated (if restricted)
- [ ] Tested sign-in/sign-up
- [ ] Tested API calls
- [ ] Both www and root domain work

---

## Cost Estimate

- **Domain:** $10-15/year (one-time purchase)
- **Vercel:** Free tier supports custom domains ✅
- **SSL:** Free (automatic via Let's Encrypt) ✅

**Total:** ~$10-15/year for the domain

---

## Next Steps

1. **Set up email** (optional): Use services like [Mailgun](https://www.mailgun.com) or [SendGrid](https://sendgrid.com) for `noreply@gitguide.com`

2. **Configure subdomains** (optional):
   - `api.gitguide.com` → Could point to Cloud Run (requires Cloud Load Balancer)
   - `docs.gitguide.com` → Documentation site

3. **Set up monitoring:** Use Vercel Analytics or external tools

---

## Support

If you need help:

- Vercel Docs: [Custom Domains](https://vercel.com/docs/concepts/projects/domains)
- Check DNS: [whatsmydns.net](https://www.whatsmydns.net)
- Vercel Support: Available in dashboard
