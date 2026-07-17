# Contributing to CallingGen Frontend

## First-Time Setup

### 1. Clone the Repo
```bash
git clone https://github.com/callinggen/livekit-forntend-main1.git
cd livekit-forntend-main1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Your `.env.local` File
Create a new file called `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This points the frontend to your local backend. Never use the staging URL during local development.

---

## Running Locally

```bash
npm run dev
```
Open http://localhost:3000 in your browser.
The page auto-updates instantly when you save any file.

---

## Git Workflow

1. **Always branch off main:**
   ```bash
   git checkout main && git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Branch naming convention:**
   - `feature/short-description` — new features
   - `fix/short-description` — bug fixes

3. **Commit messages:**
   - `feat: add X`
   - `fix: resolve Y issue`
   - `refactor: clean up Z`

4. **Push and open a Pull Request:**
   ```bash
   git push origin feature/your-feature-name
   ```
   Open a PR on GitHub targeting `main`. Tag the team lead as reviewer.

5. **Never push directly to `main`.**

---

## Environment Variables

| Variable | Local Value | Description |
|----------|------------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

Never commit `.env.local` — it is already in `.gitignore`.
