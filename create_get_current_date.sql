create or replace function get_current_date() returns timestamp with time zone language sql as \$\$ select current_timestamp at time zone 'America/Sao_Paulo'; \$\$;
