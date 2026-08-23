const { createClient } = require('@supabase/supabase-js');

let _client = null;

/**
 * Returns the Supabase client, initializing it on first use.
 * This lazy pattern ensures dotenv has loaded before the env vars are read.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
function getSupabaseClient() {
  if (_client) return _client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  }

  // Use the service role key so uploads bypass row-level security.
  // Never expose this key to the client.
  _client = createClient(supabaseUrl, supabaseServiceKey);
  return _client;
}

module.exports = getSupabaseClient;
