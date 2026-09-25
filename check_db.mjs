import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdvzopitnulgvptsopcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkdnpvcGl0bnVsZ3ZwdHNvcGNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDE3MjE1MywiZXhwIjoyMTA1NzQ4MTUzfQ.xyo4paztn5f-wfYylgGDaCCQicYf9XKrYPYtr-Qo980';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = ['sites', 'scans', 'pages', 'checks', 'issues', 'evidence', 'screenshots', 'signup_attempts'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`Table '${table}': ERROR - ${error.message}`);
    } else {
      console.log(`Table '${table}': EXISTS (0 or more rows)`);
    }
  }
}

checkTables();
