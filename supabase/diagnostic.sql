-- Colle ce texte dans le SQL Editor (New query), clique sur Run,
-- puis envoie-moi le tableau obtenu (capture d'écran ou texte). Cette requête ne modifie rien.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
