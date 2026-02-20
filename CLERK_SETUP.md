# Clerk Authentication Setup (GitGuide)

Configure your Clerk project (e.g., G1901) for GitGuide with the following settings.

## 1. Gmail and Outlook Only

To allow login only with Gmail (Google) and Outlook (Microsoft):

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → your project
2. Navigate to **Configure** → **SSO connections** (User & authentication → Social connections)
3. **Enable** only:
   - **Google** – for Gmail users
   - **Microsoft** – for Outlook/ Microsoft account users
4. **Disable** all other social providers (GitHub, Apple, etc.)
5. In **Email, phone, username** (or similar), disable **Email address** and **Phone number** as sign-in options if you want OAuth-only (Gmail/Outlook)
6. For production: add your own OAuth credentials (Client ID, Secret) for Google and Microsoft in each provider’s settings

## 2. Username Requirement

To require users to provide a username:

1. Go to **User & authentication** → **Username** (or **Personal information**)
2. Enable **Username**
3. Set it to **Required** if available
4. Username rules: 4–64 chars, Latin characters, no special characters (^$!.`#+~)

With social sign-in, new users will see a “complete your profile” step to enter their username after the first OAuth step.

## 3. Branding: “Secured by GitGuide”

“Powered by Clerk” branding is replaced with “Secured by GitGuide” via:

- `app/globals.css` – overrides footer content for SignIn, SignUp, and UserButton
- Do not set `footer: "hidden"` in `appearance.elements`; the footer must render for this override to work

## 4. Environment Variables

### Frontend (`frontend-nextjs/.env.local`)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... or pk_live_...
CLERK_SECRET_KEY=sk_test_... or sk_live_...
```

### Backend (`ai_tutor_for_github_repositories/.env`)

The backend must use the **same** Clerk application. Set:

```
CLERK_SECRET_KEY=sk_test_... or sk_live_...
```

Use the same `CLERK_SECRET_KEY` as the frontend (from the same Clerk project in the dashboard). If they differ, you'll get "User not found" when the dashboard calls the backend—Clerk's API returns 404 because the user exists in one app but not the other.

Use **Production** keys for live apps.
