module.exports = {
  // Preview configuration for your app
  // This will add preview buttons and external browser button
  preview: {
    // The port your Next.js app runs on
    port: 3000,
    // The local URL where your app is running
    localUrl: 'http://localhost:3000',
    // The production URL (if applicable)
    productionUrl: 'https://your-production-url.vercel.app',
    // Preview buttons configuration
    buttons: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        description: 'View the main dashboard'
      },
      {
        label: 'Overview',
        path: '/overview',
        description: 'View the weekly overview'
      },
      {
        label: 'Edit Schedule',
        path: '/edit',
        description: 'Edit your schedule'
      }
    ]
  }
};
