// Script to update the .env.local file with the new Supabase URL and key
const fs = require('fs');
const path = require('path');

// New Supabase URL and key
const newSupabaseUrl = 'https://lzfsuovymvkkqdegiurk.supabase.co';
// You'll need to provide the correct API key from your Supabase dashboard

async function updateEnv() {
  console.log('Updating .env.local file with new Supabase URL...');
  
  try {
    const envPath = path.join(__dirname, '.env.local');
    
    // Check if the file exists
    if (!fs.existsSync(envPath)) {
      console.error('.env.local file not found. Creating a new one...');
      
      // Create a template .env.local file
      const envContent = `NEXT_PUBLIC_SUPABASE_URL=${newSupabaseUrl}
# Add your Supabase anon key below (from the Supabase dashboard)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
`;
      
      fs.writeFileSync(envPath, envContent);
      console.log('Created new .env.local file. Please add your Supabase anon key to it.');
      return;
    }
    
    // Read the existing .env.local file
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update the Supabase URL
    let updatedContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_URL=.*/,
      `NEXT_PUBLIC_SUPABASE_URL=${newSupabaseUrl}`
    );
    
    // Add a reminder to update the API key
    updatedContent += '\n# Remember to update your NEXT_PUBLIC_SUPABASE_ANON_KEY with the correct key from your Supabase dashboard\n';
    
    // Write the updated content back to the file
    fs.writeFileSync(envPath, updatedContent);
    
    console.log('Successfully updated .env.local file with new Supabase URL.');
    console.log('IMPORTANT: You need to update the NEXT_PUBLIC_SUPABASE_ANON_KEY in the .env.local file with the correct key from your Supabase dashboard.');
  } catch (error) {
    console.error('Error updating .env.local file:', error);
  }
}

updateEnv();
