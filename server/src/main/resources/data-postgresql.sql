SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = ON;
SET check_function_bodies = FALSE;
SET client_min_messages = WARNING;
SET row_security = OFF;
SET search_path = public, pg_catalog;

INSERT INTO server_user_authority (id, authority)
SELECT 1, 'USER'
WHERE NOT EXISTS(SELECT id FROM server_user_authority WHERE id = 1);

SELECT setval('server_user_authority_id_seq',
              (SELECT max(id)
               FROM server_user_authority) + 1, FALSE);
