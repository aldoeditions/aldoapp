-- Import Notion « Prospection artistes ».
--
-- On ajoute un champ TEXT nullable pour conserver la valeur BRUTE de la colonne
-- Notion « Dans le pipe » (Pas encore / Oui / En cours / Prochaine drop).
-- Cette notion n'est pas encore modélisée proprement : on la garde brute pour ne
-- rien perdre, on la traitera plus tard. (Distinct du champ booléen `dans_le_pipe`.)
alter table public.artists
  add column if not exists dans_le_pipe_notion text;

comment on column public.artists.dans_le_pipe_notion is
  'Valeur brute Notion "Dans le pipe" (Pas encore / Oui / En cours / Prochaine drop). Non modélisée — à traiter plus tard.';

-- NB : `renommee` est libre (aucune contrainte CHECK) et l'import fusionne
-- Star / Très connu → Connu, donc AUCUNE modification de contrainte n'est
-- nécessaire ici. Les valeurs importées restent dans { Connu, En devenir, null }.
