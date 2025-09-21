# GitHub Pages Deployment Guide for georgenekwaya.com

## Overview
This guide will help you deploy your Next.js portfolio to GitHub Pages with your custom domain `georgenekwaya.com` from Namecheap.

## Current Status
✅ Next.js configured for static export  
✅ GitHub Actions workflow created  
✅ CNAME file configured  
✅ .nojekyll file added  

## Step-by-Step Deployment Process

### 1. GitHub Repository Setup

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Configure for GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository: `https://github.com/thependalorian/porfolio`
   - Navigate to Settings → Pages
   - Under "Source", select "GitHub Actions"
   - The workflow will automatically deploy when you push to main

### 2. DNS Configuration in Namecheap

**Current Issue:** Your DNS records are pointing to GitHub Pages IPs, but you need to configure them properly.

**Required DNS Records:**

1. **Remove existing A records** (the ones pointing to 185.199.x.x)

2. **Add these DNS records:**

   **For Apex Domain (georgenekwaya.com):**
   ```
   Type: A
   Host: @
   Value: 185.199.108.153
   TTL: Automatic
   
   Type: A
   Host: @
   Value: 185.199.109.153
   TTL: Automatic
   
   Type: A
   Host: @
   Value: 185.199.110.153
   TTL: Automatic
   
   Type: A
   Host: @
   Value: 185.199.111.153
   TTL: Automatic
   ```

   **For WWW Subdomain:**
   ```
   Type: CNAME
   Host: www
   Value: thependalorian.github.io
   TTL: Automatic
   ```

   **Keep existing TXT record:**
   ```
   Type: TXT
   Host: @
   Value: v=spf1 include:spf.efwd.registrar-servers.com ~all
   TTL: Automatic
   ```

### 3. GitHub Pages Custom Domain Configuration

1. **In your GitHub repository:**
   - Go to Settings → Pages
   - Under "Custom domain", enter: `georgenekwaya.com`
   - Check "Enforce HTTPS" (this will be available after DNS propagation)

2. **Wait for DNS propagation:**
   - DNS changes can take up to 24-48 hours to fully propagate
   - You can check propagation status at: https://www.whatsmydns.net/

### 4. Verification Steps

1. **Check DNS propagation:**
   ```bash
   # Check A records
   dig georgenekwaya.com A
   
   # Check CNAME record
   dig www.georgenekwaya.com CNAME
   ```

2. **Test your site:**
   - Visit: https://georgenekwaya.com
   - Visit: https://www.georgenekwaya.com
   - Both should redirect properly

### 5. Troubleshooting Common Issues

**Issue: "DNS check in progress"**
- Solution: Wait for DNS propagation (up to 24 hours)
- Ensure DNS records are correctly configured

**Issue: "Certificate Request Error"**
- Solution: This is normal during initial setup
- GitHub will automatically retry certificate provisioning
- Wait up to 15 minutes for certificate to be issued

**Issue: Site not loading**
- Check if GitHub Actions workflow completed successfully
- Verify DNS records are pointing to correct IPs
- Ensure CNAME file contains only `georgenekwaya.com`

**Issue: HTTPS not working**
- Wait for SSL certificate to be provisioned
- Enable "Enforce HTTPS" in GitHub Pages settings after certificate is ready

### 6. Final Configuration Checklist

- [ ] Code pushed to GitHub main branch
- [ ] GitHub Pages enabled with GitHub Actions source
- [ ] DNS A records configured for apex domain
- [ ] DNS CNAME record configured for www subdomain
- [ ] Custom domain set in GitHub Pages settings
- [ ] DNS propagation completed (check with whatsmydns.net)
- [ ] SSL certificate issued and HTTPS enforced
- [ ] Site accessible at both georgenekwaya.com and www.georgenekwaya.com

### 7. Post-Deployment

Once everything is working:

1. **Monitor the deployment:**
   - Check GitHub Actions tab for successful deployments
   - Monitor GitHub Pages settings for any issues

2. **Performance optimization:**
   - Your Next.js app is already optimized for static export
   - Images are configured for WebP format
   - All assets are properly optimized

3. **Future updates:**
   - Simply push changes to main branch
   - GitHub Actions will automatically rebuild and deploy
   - No manual intervention required

## Support

If you encounter any issues:
1. Check GitHub Actions logs for build errors
2. Verify DNS configuration with your domain provider
3. Ensure all files are committed and pushed to main branch
4. Wait for DNS propagation if changes were recent

## Files Created/Modified

- `.github/workflows/deploy.yml` - GitHub Actions deployment workflow
- `.nojekyll` - Prevents Jekyll processing
- `CNAME` - Custom domain configuration (already exists)
- `next.config.js` - Updated for GitHub Pages compatibility
- `DEPLOYMENT_GUIDE.md` - This guide

Your portfolio should be live at https://georgenekwaya.com once DNS propagation is complete!
