const fs = require('fs');
const path = require('path');

// Environment variables
const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://lzfsuovymvkkqdegiurk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZnN1b3Z5bXZra3FkZWdpdXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzIzNzAsImV4cCI6MjA2MDMwODM3MH0.fpfKpIRbXAQLjaJ7Bz7QYphrUYbwJ8BtfkFrmdq-a6E
`;

// Write to .env.local file
fs.writeFileSync(path.join(__dirname, '.env.local'), envContent);

console.log('Environment file created successfully!');
console.log('You can now run your application with Supabase integration.');
