# ORC Frontend Deployment Guide

## Vercel Deployment

### Prerequisites
1. [Vercel Account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/cli) (optional)
3. Git repository connected to GitHub/GitLab/Bitbucket

### Quick Deploy

#### Option 1: Deploy via Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js and configure build settings
5. Set environment variables (see below)
6. Click "Deploy"

#### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: orc-frontend
# - Directory: ./
# - Override settings? N
```

### Environment Variables

Set these environment variables in your Vercel project settings:

```bash
NEXT_PUBLIC_API_URL=https://orc-backend-production.up.railway.app/api/v1
```

#### Setting Environment Variables in Vercel:
1. Go to your project dashboard on Vercel
2. Navigate to "Settings" → "Environment Variables"
3. Add the variables above
4. Set them for "Production", "Preview", and "Development" environments

### Custom Domain (Optional)

1. In your Vercel project dashboard, go to "Settings" → "Domains"
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_DOMAIN` environment variable if needed

### Build Configuration

The project is pre-configured with:
- ✅ Next.js optimization
- ✅ ESLint errors ignored during build (for faster deployment)
- ✅ Image optimization
- ✅ Security headers
- ✅ API proxy configuration
- ✅ Cache optimization

### Monitoring

- **Analytics**: Enable Vercel Analytics in project settings
- **Performance**: Monitor Core Web Vitals in Vercel dashboard
- **Logs**: View function logs in Vercel dashboard

### Troubleshooting

#### Build Failures
```bash
# Check build locally
npm run build

# Check for TypeScript errors
npm run lint
```

#### Environment Issues
- Ensure all required environment variables are set
- Check variable names match exactly (case-sensitive)
- Verify API endpoints are accessible

#### Performance Issues
- Enable Vercel Analytics
- Check bundle size with `npm run build`
- Optimize images and assets

### Production Checklist

- [ ] Environment variables configured
- [ ] Custom domain set up (if applicable)
- [ ] SSL certificate active
- [ ] Analytics enabled
- [ ] Error monitoring configured
- [ ] Performance monitoring active
- [ ] API endpoints tested
- [ ] Mobile responsiveness verified

### Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main`/`master` branch
- **Preview**: Pull requests and other branches

To disable auto-deployment:
1. Go to project settings
2. Navigate to "Git" section
3. Configure deployment branches

### Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Community](https://github.com/vercel/vercel/discussions)