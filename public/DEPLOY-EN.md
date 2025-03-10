# Deployment Guide

## Extensions

The extension project is built on the `wxt` framework, supporting deployment across multiple browser platforms.

### Build Commands

```shell
# Generate the extension folder
pnpm run build:extensions

# Generate the extension file and package it in zip format
pnpm run build:extensions:zip
```

### Multi-Browser Support

By default, the build output is suitable for the Chrome browser. To support other browser platforms, you can use the `-b` parameter to specify the target platform:

```shell
# Example: Build for the Firefox extension
pnpm run build:extensions -b firefox
```

After the build is complete, the extension files will be located in the corresponding browser folder within the `dist/` directory.

For more platform support and publishing options, please refer to the [WXT Official Documentation](https://wxt.dev/guide/essentials/publishing.html).

## DWeb

The web project is developed on the `Nuxt.js` framework and optimized for cloud service deployment.

### Build Command

```shell
# Build the web application
pnpm run build:dweb
```

Once the build is complete, the output will be located in the `.output/` directory, containing static files and server-side code (if applicable).

### Deployment Configuration

- By default, the build optimization uses the `cloudflare` preset.
- To change the deployment target, modify the `preset` configuration item in `nuxt.config.ts`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Change to another deployment platform preset
  nitro: {
    preset: 'vercel' // or use 'netlify', 'aws-lambda', etc.
  }
})
```

For complete deployment options and platform support, please refer to the [Nuxt.js Deployment Documentation](https://nuxt.com/docs/getting-started/deployment).

### Deploying on Cloudflare Pages

The project recommends deploying on Cloudflare Pages, supporting two deployment methods:

1. **GitHub Repository Integration**: Automatically listens for code changes and deploys

   - Detailed Steps: [Cloudflare Pages Git Integration Deployment Guide](https://developers.cloudflare.com/pages/get-started/git-integration/)
   - Build Command Setting: `pnpm run build:dweb`
   - Output Directory Setting: `.output/public`

2. **Manual Upload Deployment**: Directly upload the build output to Cloudflare
   - Detailed Steps: [Cloudflare Pages Direct Upload Guide](https://developers.cloudflare.com/pages/get-started/direct-upload/)
   - Upload the contents of the `.output/public` directory.

### Other Deployment Platforms

This project can also be deployed to other platforms such as Vercel, Netlify, or traditional servers:

- **Vercel/Netlify**: Adjust the `preset` and configure according to platform guidelines.
- **Traditional Servers**: Deploy the contents of the `.output` directory to a web server.

Choose a deployment method that best fits your workflow, ensuring stable and reliable delivery of the application to end users.
