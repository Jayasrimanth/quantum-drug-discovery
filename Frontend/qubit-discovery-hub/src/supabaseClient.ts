import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lmyzbnlodwkvyjrypkxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteXpibmxvZHdrdnlqcnlwa3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODQ0NjksImV4cCI6MjA3MjQ2MDQ2OX0.QWYb8AYaQ9XW-ugPCU5Q-6byuLam5x4makgDUhco-VA';

export const supabase = createClient(supabaseUrl, supabaseKey);