<?php
/* ============================================================
   SALES DNA — configuration
   ------------------------------------------------------------
   1. Copy this file to  config.php  (same folder)
   2. Put the MySQL password you set in Plesk into 'db_pass'
   3. Never commit or share config.php — it holds the password

   ⚠ If Plesk shows the database or user with a prefix
     (for example driftx_dna), write exactly what Plesk shows.
   ============================================================ */

return array(
  'db_host' => 'localhost',
  'db_name' => 'dna',
  'db_user' => 'dna',
  'db_pass' => 'PUT_THE_PASSWORD_HERE',
  'db_port' => 3306,

  /* set to false the moment installation is finished */
  'allow_install' => true,

  /* how long a login stays valid, in hours */
  'session_hours' => 12,

  /* OPTIONAL — the AI layer works without this.
     Leave it empty and similarity, neighbours and the predictive count all
     run on the trait vector, on this server, at no cost and with no employee
     data leaving the machine. Fill it in only if you have decided that
     sending trait and performance figures to OpenAI is acceptable; see
     AI-LAYER.md section 9. Never commit this file. */
  'openai_key' => '',
  'openai_embed_model' => 'text-embedding-3-small',
  'openai_chat_model' => 'gpt-4o-mini',
);
