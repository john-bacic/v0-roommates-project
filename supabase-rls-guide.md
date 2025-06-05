# Implementing Row Level Security (RLS) in Supabase

This guide will help you implement the necessary Row Level Security policies to fix the security warnings in your Supabase project.

## Step 1: Access the SQL Editor

1. Log in to your Supabase dashboard
2. Select your project
3. Go to the "SQL Editor" section in the left sidebar
4. Click "New Query" to create a new SQL query

## Step 2: Run the SQL Script

Copy and paste the contents of the `supabase-rls-setup.sql` file into the SQL Editor, then click "Run" to execute the script.

## Step 3: Verify the Policies

After running the script:

1. Go to the "Table Editor" section in the left sidebar
2. Select the `users` table
3. Click on the "Policies" tab
4. Verify that RLS is enabled and the policies are listed
5. Repeat steps 2-4 for the `schedules` table

## Step 4: Test Your Application

Test your application to ensure everything still works as expected. The policies are designed to:

- Allow authenticated users to view all users and schedules
- Allow users to only modify their own data
- Include a service role policy for server-side operations

## Understanding the Policies

### Users Table Policies:
- **Users are viewable by all authenticated users**: Allows any authenticated user to read all user records
- **Users can update their own data**: Allows users to only update their own records
- **Users can insert their own data**: Ensures users can only create records with their own ID

### Schedules Table Policies:
- **Schedules are viewable by all authenticated users**: Allows any authenticated user to read all schedule records
- **Users can insert their own schedules**: Ensures users can only create schedules linked to their own user ID
- **Users can update their own schedules**: Allows users to only update schedules linked to their user ID
- **Users can delete their own schedules**: Allows users to only delete schedules linked to their user ID

### Service Role Policies:
- Special policies that allow your server-side code to bypass RLS when needed

## Troubleshooting

If you encounter issues after implementing these policies:

1. Check the Supabase logs for specific error messages
2. Verify that your application is correctly authenticating users
3. Ensure your application is using the correct user IDs when creating or updating records

For more information, refer to the [Supabase RLS documentation](https://supabase.com/docs/guides/auth/row-level-security).
