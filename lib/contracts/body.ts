import type { ContractData } from "./types";

/**
 * Texte JURIDIQUE INTÉGRAL du contrat, VERBATIM depuis la source, avec :
 *  - les seules valeurs variables remplacées par des {{PLACEHOLDERS}} ;
 *  - la coquille « Goodlfag » → « Goodflag » corrigée (art. 21).
 * Aucune autre formulation n'est modifiée. Le bloc « FAIT À … » + signatures
 * est rendu séparément (voir template.tsx).
 */
const RAW = String.raw`ENTRE LES SOUSSIGNÉS :
La société ALDO, société SAS, au capital de 10 euros, immatriculée au Registre du Commerce et
des Sociétés de Bordeaux sous le numéro 992745844, dont le siège social est situé 18 RUE
SAINT-SAENS 33150 CENON, représentée par Louison Dupont, en qualité de Président, dûment
habilité(e) aux fins des présentes,
Ci-après dénommée « Aldo » ou « le Licencié »,
D'UNE PART,
ET :
{{IDENTITY}}
Ci-après dénommé(e) « l'Artiste » ou « le Concédant »,
D'AUTRE PART,
Aldo et l'Artiste sont ci-après désignés ensemble « les Parties » et individuellement « une Partie ».
IL A ÉTÉ PRÉALABLEMENT EXPOSÉ CE QUI SUIT :
L'Artiste est l'auteur d'œuvres originales relevant de la protection du droit d'auteur au sens des
articles L111-1 et suivants du Code de la propriété intellectuelle.
Aldo exploite une plateforme de vente en ligne dédiée à la commercialisation d'affiches, sous la forme
de reproductions d'œuvres artistiques, auprès des consommateurs.
Les Parties souhaitent définir les conditions et modalités selon lesquelles l'Artiste concède à Aldo une
licence d'exploitation de ses œuvres sous forme d'affiches, dans le respect des droits moraux de
l'Artiste et du formalisme requis par les articles L131-3 et suivants du Code de la propriété
intellectuelle.
CECI ÉTANT EXPOSÉ, IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :
ARTICLE 1 – DÉFINITIONS
Au sens du présent contrat, les termes suivants ont la signification qui leur est attribuée ci-après:
1.1. « Œuvre(s) » : désigne toute création artistique originale de l'Artiste, réalisée dans les domaines
des arts graphiques, plastiques ou visuels (peinture, dessin, photographie, illustration, création
numérique), identifiée dans l'Annexe 1 du présent contrat ou dans tout avenant ultérieur, et dont
l'Artiste garantit être le titulaire exclusif de l'intégralité des droits de propriété intellectuelle ou disposer
des autorisations nécessaires à sa reproduction et représentation.
1.2. « Affiche(s) » : désigne la reproduction matérielle d'une œuvre sur support papier ou assimilé,
réalisée selon les spécifications techniques définies à l'article 4, destinée à la vente au public via la
Plateforme.
1.3. « Plateforme » : désigne le site internet exploité par Aldo à l'adresse [aldo-editions.com], ainsi
que toute application mobile ou extension développée par Aldo permettant la commercialisation des
Affiches.
1.4. « Campagne » : désigne une période mensuelle de commercialisation des Affiches, débutant le
premier jour de chaque mois calendaire et se terminant le dernier jour du même mois.
1.5. « Consommateur » : désigne toute personne physique ou morale acquérant une Affiche via la
Plateforme pour un usage non professionnel.
ARTICLE 2 – OBJET DU CONTRAT
Le présent contrat a pour objet de définir les conditions dans lesquelles l'Artiste concède à Aldo une
licence d'exploitation de ses Œuvres, ainsi que les modalités de leur commercialisation sous forme
d'Affiches auprès des Consommateurs via la Plateforme, dans le respect des droits moraux
perpétuels, inaliénables et imprescriptibles de l'Artiste.
ARTICLE 3 – CONCESSION DE LICENCE DE DROITS D'AUTEUR
3.1. Étendue de la licence
Conformément aux articles L131-3 et suivants du Code de la propriété intellectuelle, l'Artiste concède
à Aldo, qui l'accepte, une licence non exclusive portant sur les droits patrimoniaux suivants :
a) Droit de reproduction : Aldo est autorisée à reproduire les Œuvres par tous procédés
d'impression offset, numérique, sérigraphie ou tout autre procédé technique actuel ou futur, sur
support papier, carton, toile ou tout support matériel similaire, aux fins de fabrication des Affiches. La
reproduction est autorisée dans le monde entier.
b) Droit de représentation : Aldo est autorisée à représenter les Œuvres au public par tout moyen
de communication électronique, notamment :
● La mise en ligne sur la Plateforme sous forme d'images numériques (formats JPEG, PNG,
WEBP) ;
● La diffusion sur les réseaux sociaux exploités par Aldo (Facebook, Instagram, Pinterest,
TikTok, LinkedIn) ;
● L'insertion dans des newsletters, campagnes d'emailing et supports de communication
digitale ;
● La communication dans le cadre de partenariats presse, à condition que le nom de l'artiste
soit systématiquement mentionné.
c) Droit de distribution : Aldo est autorisée à commercialiser les Affiches reproduisant les Œuvres
auprès des Consommateurs, par vente directe via la Plateforme, avec livraison dans le monde entier.
3.2. Territoire
La licence est concédée pour le monde entier.
3.3. Durée de la licence
La licence est concédée pour la durée du présent contrat, telle que définie à l'article 11.
3.4. Caractère non exclusif et clause de non-concurrence
3.4.1 La licence est concédée à titre non exclusif. L'Artiste demeure libre d'exploiter ses Œuvres
directement ou d'en concéder l'exploitation à des tiers, sous réserve de la clause de non-concurrence
suivante :
3.4.2 Pendant la durée du présent contrat et pour chaque Œuvre effectivement exploitée par Aldo au
cours d'une Campagne en cours, l'Artiste s'interdit de concéder à une plateforme de vente en ligne
concurrente (définie comme toute plateforme exploitant un modèle économique similaire de vente
directe d'affiches et reproductions artistiques au public) une licence portant sur la reproduction et la
commercialisation du même visuel sous forme d'affiche ou de reproduction papier, dans le monde
entier.
3.4.3 Cette restriction ne s'applique pas :
● À la vente directe par l'Artiste de tirages originaux ou numérotés ;
● À la commercialisation via des galeries physiques ou virtuelles ;
● À l'exploitation sur des supports différents (textile, céramique, produits dérivés) ;
● À partir du premier jour du mois suivant le retrait de l'Œuvre conformément à l'article 12.
3.4.4. Pendant la durée de chaque Campagne au sens de l'article 11, l'Artiste s'engage à ne pas
proposer à la vente, sur son propre site internet ou sur tout autre canal de vente en ligne qu'il exploite
directement, la même Œuvre sous forme d'affiche ou de reproduction papier présentant des
caractéristiques identiques (même visuel, même format, même type de support et de finition) à un prix
de vente au public inférieur au prix de vente pratiqué par Aldo pour ladite Œuvre pendant la
Campagne concernée.
L'Artiste demeure libre :
- de fixer librement ses prix pour cette Œuvre sur ses autres canaux, dès lors que le prix n'est
pas inférieur au prix pratiqué par Aldo pendant la Campagne ;
- de proposer des formats, supports ou éditions différents de la même Œuvre, à des prix
librement déterminés ;
- de fixer librement tous ses prix en dehors des périodes de Campagne.
Cette obligation est limitée à la durée de la Campagne considérée et a pour objet de protéger
l'investissement commercial et promotionnel consenti par Aldo pour la mise en avant de l'Artiste et de
ses Œuvres pendant cette période.
3.4.5 L'Artiste s'engage à informer Aldo par écrit, au moins quinze (15) jours à l'avance, de tout projet
de commercialisation d'une Œuvre sous une forme susceptible d'affecter l'exploitation par Aldo.
3.5. Respect de l'intégrité des Œuvres et droits moraux
Conformément à l'article L121-1 du Code de la propriété intellectuelle, Aldo s'engage à respecter
scrupuleusement les droits moraux de l'Artiste, et notamment :
a) Droit à la paternité : Aldo s'engage à mentionner systématiquement le nom de l'Artiste à proximité
immédiate de toute représentation ou reproduction de l'Œuvre, que ce soit sur la Plateforme, sur les
Affiches elles-mêmes, sur les réseaux sociaux ou dans tout support de communication. La mention
comportera le format suivant : « [Nom/Pseudonyme de l'Artiste] » et sera apposée de manière visible
et lisible.
b) Droit au respect de l'intégrité de l'Œuvre : Aldo s'interdit formellement de modifier, altérer,
adapter, transformer, recadrer, recolorer ou dénaturer les Œuvres de quelque manière que ce soit,
sans l'accord écrit préalable et exprès de l'Artiste. Toute modification sollicitée par Aldo devra faire
l'objet d'une demande écrite précisant la nature exacte de la modification souhaitée, et l'Artiste
disposera d'un délai de sept (7) jours pour accepter ou refuser, étant précisé que son silence vaudra
refus.
3.6. Absence de cession des droits
La présente licence n'emporte en aucun cas cession ou transfert de propriété des droits d'auteur
patrimoniaux ou moraux sur les Œuvres, dont l'Artiste demeure le seul et unique titulaire.
À l'expiration ou la résiliation du présent contrat, l'intégralité des droits concédés retournera
automatiquement et de plein droit à l'Artiste, sans formalité.
ARTICLE 4 – OBLIGATIONS D'ALDO
Aldo s'engage à :
4.1. Reproduire les Œuvres sous forme d'Affiches en garantissant une qualité d'impression
professionnelle, conforme aux standards de l'industrie graphique (respect de la gamme
colorimétrique, netteté, absence de défauts visuels), sur des supports papier d'un grammage de 210
g/m², sans acide, certifiés FSC ou équivalent.
4.2. Mettre en ligne les Affiches sur la Plateforme avec une présentation valorisante (photographies
de mise en situation, description détaillée mentionnant le nom de l'Artiste, dimensions,
caractéristiques techniques du tirage).
4.3. Promouvoir activement les Œuvres par des campagnes de communication digitale (newsletters,
publicités sur les réseaux sociaux, partenariats avec des influenceurs ou médias spécialisés).
4.4. Assurer le service après-vente auprès des Consommateurs, la gestion des réclamations, des
retours produits et des demandes de remboursement, conformément aux dispositions du Code de la
consommation. Les retours de produits pour non-conformité ou défaut de fabrication seront
intégralement à la charge d'Aldo et ne donneront lieu à aucune déduction sur la rémunération de
l'Artiste. Les retours pour exercice du droit de rétractation par les Consommateurs seront également à
la charge d'Aldo, et la rémunération de l'Artiste sera calculée sur les ventes nettes effectivement
encaissées après déduction des retours.
4.5. Tenir l'Artiste régulièrement informé des performances commerciales de ses Œuvres en lui
transmettant, dans les dix (10) jours suivant la fin de chaque Campagne, un relevé détaillé des ventes
indiquant, pour chaque Œuvre : le nombre d'exemplaires vendus, le prix de vente hors taxes unitaire,
le montant total hors taxes des ventes, le nombre de retours, le montant de la rémunération due.
4.6. Préserver la confidentialité de toutes informations techniques, commerciales, financières ou
personnelles relatives à l'Artiste obtenues dans le cadre du présent contrat, et ne les divulguer à
aucun tiers sans l'accord écrit préalable de l'Artiste, sauf obligation légale, réglementaire ou judiciaire.
4.7. Se conformer strictement à l'ensemble des dispositions du Règlement (UE) 2016/679 du 27 avril
2016 (RGPD) et de la loi n° 78-17 du 6 janvier 1978 modifiée relative à l'informatique, aux fichiers et
aux libertés, dans le traitement des données à caractère personnel de l'Artiste, conformément aux
stipulations de l'article 10.
4.8. Respecter l'ensemble des obligations résultant de sa qualité d'opérateur de plateforme en ligne,
notamment les obligations d'information loyale, claire et transparente prévues à l'article L111-7 du
Code de la consommation .
4.9. Souscrire et maintenir en vigueur pendant toute la durée du contrat une assurance responsabilité
civile professionnelle couvrant les conséquences pécuniaires de sa responsabilité civile du fait de ses
activités d'exploitation de la Plateforme et de commercialisation des Affiches, avec un plafond de
garantie minimal de [montant] euros par sinistre et par année d'assurance. Aldo transmettra à
l'Artiste, sur simple demande, une attestation d'assurance en cours de validité.
ARTICLE 5 – OBLIGATIONS DE L'ARTISTE
L'Artiste s'engage à :
5.1. Fournir à Aldo les fichiers numériques des Œuvres dans un format haute résolution adapté à
l'impression professionnelle (minimum 300 DPI, format JPG non compressé, PSD ou TIFF, profil
colorimétrique RVB), par transfert via un système sécurisé (WeTransfer, Dropbox, ou tout autre
moyen convenu entre les Parties).
5.2. Préserver la confidentialité de toutes informations techniques, commerciales ou financières
relatives à Aldo obtenues dans le cadre du présent contrat, et ne les divulguer à aucun tiers sans
l'accord écrit préalable d'Aldo, sauf obligation légale, réglementaire ou judiciaire.
5.3. Accomplir l'ensemble des formalités administratives, sociales et fiscales liées à sa qualité
d'artiste-auteur et à la perception de revenus de droits d'auteur, notamment :
● Maintenir son inscription à la Maison des Artistes ou à l'Agessa (ou tout organisme lui
succédant) ;
● Déclarer les revenus perçus au titre du présent contrat auprès des autorités fiscales et
sociales compétentes ;
● S'acquitter des cotisations sociales et fiscales afférentes ;
● Informer immédiatement Aldo de toute modification de sa situation administrative (radiation,
changement de statut, etc.).
ARTICLE 6 – GARANTIES DE L'ARTISTE
L'Artiste garantit à Aldo :
6.1. Être le créateur originaire et l'unique titulaire de l'intégralité des droits de propriété intellectuelle
(droits d'auteur patrimoniaux et moraux) portant sur les Œuvres, ou disposer de l'ensemble des
autorisations, cessions ou licences nécessaires à la concession des droits prévus au présent contrat.
6.2. Que les Œuvres sont des créations originales au sens de l'article L111-1 du Code de la propriété
intellectuelle, portant l'empreinte de sa personnalité artistique, et ne constituent ni une contrefaçon
totale ou partielle d'une œuvre préexistante, ni une reproduction, imitation ou adaptation non
autorisée d'une œuvre d'un tiers.
6.3. Que les Œuvres ne portent atteinte à aucun droit de tiers, notamment :
● Aux droits de propriété intellectuelle (droits d'auteur, droits voisins, droits des producteurs,
marques, dessins et modèles) ;
● Aux droits de la personnalité (droit à l'image, droit au respect de la vie privée) ;
● À l'ordre public et aux bonnes mœurs (absence de contenu diffamatoire, injurieux, raciste,
pédopornographique, incitant à la haine ou à la violence).
6.4. Que l'exploitation des Œuvres par Aldo dans les conditions du présent contrat ne nécessite
l'autorisation d'aucun tiers (personne physique ou morale, société de gestion collective, etc.).
En cas de réclamation, mise en demeure, action en justice ou condamnation d'Aldo par un tiers
fondée sur la violation alléguée ou avérée de l'une de ces garanties, l'Artiste s'engage à :
● Informer immédiatement Aldo par écrit ;
● Garantir Aldo en cas d'action judiciaire, demande ou réclamation portant sur tout cas
d'atteinte aux droits de tiers ;
● Indemniser Aldo de l'intégralité du préjudice direct subi, incluant les dommages et intérêts,
frais, dépens et honoraires d'avocat.
ARTICLE 7 – RÉMUNÉRATION DE L'ARTISTE
7.1. Principe de rémunération proportionnelle
Conformément au principe édicté par l'article L131-4 du Code de la propriété intellectuelle, l'Artiste
percevra une rémunération proportionnelle aux recettes d'exploitation de ses Œuvres sous forme
d'Affiches.
Cette rémunération est fixée à {{COMMISSION_WORDS}} pour cent ({{COMMISSION_PCT}}%) du prix de vente hors taxes (HT) de chaque
Affiche effectivement vendue et encaissée par Aldo, après déduction des retours de Consommateurs
intervenus dans le cadre de l'exercice de leur droit de rétractation ou de la garantie légale de
conformité.
Les frais de port et de livraison facturés aux Consommateurs ne sont pas inclus dans l'assiette de
calcul de la rémunération.
7.2. Relevé des ventes et modalités de paiement
Dans les dix (10) jours ouvrés suivant la fin de chaque Campagne mensuelle, Aldo transmettra à
l'Artiste par voie électronique, un relevé détaillé des ventes comprenant les informations suivantes :
● Pour chaque Œuvre : titre, référence interne, nombre d'exemplaires vendus, nombre de
retours, nombre de ventes nettes ;
● Prix de vente hors taxes unitaire ;
● Montant total hors taxes des ventes brutes ;
● Montant total hors taxes des ventes nettes (après déduction des retours) ;
● Taux de rémunération applicable ({{COMMISSION_PCT}}%) ;
● Montant de la rémunération due à l'Artiste ;
● Montant net à verser.
Le paiement de la rémunération due sera effectué par virement bancaire sur le compte de
l'Artiste (IBAN : {{IBAN}}), dans un délai maximum de trente
(30) jours calendaires à compter de la date de production du relevé mensuel.
ARTICLE 8 – RESPONSABILITÉ ET ASSURANCE
8.1. Responsabilité contractuelle
Chaque Partie est responsable de l'exécution de ses obligations contractuelles, dans les conditions
du droit commun. En cas d'inexécution ou de mauvaise exécution du contrat, la Partie défaillante sera
condamnée au paiement de dommages et intérêts réparant le préjudice direct, prévisible et certain
subi par l'autre Partie , sauf à démontrer que l'inexécution résulte de la force majeure au sens de
l'article 1218 du Code civil .
8.2. Limitation de responsabilité
La responsabilité de chaque Partie au titre du présent contrat, tous dommages confondus (à
l'exception des dommages corporels, de la violation des droits de propriété intellectuelle de tiers
engageant les garanties de l'article 6, et de la faute lourde ou dolosive), est limitée au montant total
des rémunérations effectivement versées à l'Artiste au cours des douze (12) mois précédant la
survenance du dommage.
Aucune des Parties ne pourra être tenue responsable des dommages indirects tels que la perte de
chiffre d'affaires, la perte de clientèle, la perte de bénéfices, la perte de données, le préjudice d'image
ou commercial.
8.4. Assurance
Chaque Partie s'engage à souscrire et maintenir en vigueur pendant toute la durée du présent contrat
une assurance responsabilité civile professionnelle couvrant les conséquences pécuniaires de sa
responsabilité pouvant être engagée au titre du présent contrat.
ARTICLE 9 – RÉSILIATION ET RÉSOLUTION DU CONTRAT
9.1. Résolution pour inexécution
En cas de manquement grave ou persistant de l'une des Parties à l'une quelconque de ses
obligations contractuelles, la Partie non défaillante pourra solliciter la résolution judiciaire du contrat
dans les conditions de l'article 1224 du Code civil , ou mettre en œuvre la clause résolutoire prévue à
l'article 9.2, sans préjudice de tous dommages et intérêts .
Constituent notamment des manquements graves au sens du présent article :
● La violation par l'Artiste de la clause de garantie relative à la titularité des droits (article 6) ;
● La divulgation d'informations confidentielles en violation de l'article 4.7 ou 5.4 ;
● La cessation d'activité de la Plateforme pendant plus de trente (30) jours consécutifs sans
motif légitime ;
● Le non-paiement par Aldo de trois (3) mensualités consécutives de rémunération.
9.2. Clause résolutoire de plein droit
Conformément à l'article 1225 du Code civil , le présent contrat sera résolu de plein droit, trente (30)
jours après une mise en demeure d'exécuter restée totalement ou partiellement infructueuse,
adressée par lettre recommandée avec accusé de réception ou par acte d'huissier, en cas de
manquement grave de l'une des Parties à l'une des obligations listées à l'article 9.1.
La mise en demeure devra :
● Décrire précisément le ou les manquements constatés ;
● Viser les stipulations contractuelles et, le cas échéant, les dispositions légales ou
réglementaires non respectées ;
● Fixer un délai de trente (30) jours pour remédier au manquement ;
● Indiquer expressément que, à défaut de régularisation dans le délai imparti, le contrat sera
résilié de plein droit sans autre formalité.
La résolution prendra effet à l'expiration du délai de trente (30) jours si le manquement n'a pas été
remédié. La Partie non défaillante pourra alors solliciter l'allocation de dommages et intérêts réparant
son préjudice, sans préjudice des sommes restant dues au titre de l'exécution antérieure du contrat.
9.3. Résiliation pour inexploitation
Conformément à l'article L131-5-2 du Code de la propriété intellectuelle , si Aldo cesse toute
exploitation commerciale des Œuvres pendant une durée continue de six (6) mois, l'Artiste pourra
résilier de plein droit la licence en notifiant sa décision par lettre recommandée avec accusé de
réception. La résiliation prendra effet trente (30) jours après la réception de cette notification, sauf si
Aldo démontre avoir repris une exploitation effective des Œuvres avant l'expiration de ce délai.
9.4. Sort des Œuvres en cas de résiliation
En cas de résiliation ou résolution du contrat pour quelque cause que ce soit, Aldo disposera d'un
délai de trente (30) jours à compter de la date de prise d'effet de la résiliation pour :
● Retirer les Œuvres de la Plateforme et cesser toute forme de représentation publique ;
● Honorer les commandes de Consommateurs passées avant la date de résiliation ;
● Établir un relevé final des ventes et procéder au paiement de la rémunération due à l'Artiste.
ARTICLE 10 – PROTECTION DES DONNÉES À CARACTÈRE PERSONNEL
10.1. Responsable de traitement et finalités
Aldo, en qualité de responsable de traitement au sens de l'article 4, paragraphe 7, du Règlement (UE)
2016/679 (RGPD) , collecte et traite des données à caractère personnel concernant l'Artiste pour les
finalités suivantes :
● Gestion du présent contrat (identification des parties, exécution des obligations
contractuelles) ;
● Calcul, versement et justification de la rémunération de l'Artiste ;
● Communication commerciale relative aux Œuvres et à l'Artiste ;
● Respect des obligations légales et réglementaires (déclarations sociales, fiscales, archivage
légal).
10.2. Bases juridiques et données traitées
Les bases juridiques du traitement sont :
● L'exécution du présent contrat (article 6, paragraphe 1, point b, du RGPD) pour les
traitements liés à la gestion contractuelle et au versement de la rémunération ;
● Le respect d'une obligation légale (article 6, paragraphe 1, point c, du RGPD) pour les
traitements liés aux déclarations sociales et fiscales ;
● Le consentement de l'Artiste (article 6, paragraphe 1, point a, du RGPD) pour les
communications commerciales.
Les catégories de données traitées incluent : identité (nom, prénom, pseudonyme), coordonnées
(adresse postale, email, téléphone), données d'identification professionnelle (numéro SIRET, numéro
Maison des Artistes/Agessa), coordonnées bancaires (IBAN, BIC), données relatives à la
rémunération.
10.3. Destinataires des données
Les données personnelles de l'Artiste pourront être communiquées :
● Aux services internes d'Aldo strictement habilités (service comptable, service juridique,
service commercial) ;
● Aux sous-traitants d'Aldo intervenant pour l'hébergement de la Plateforme, le traitement des
paiements, la gestion comptable et sociale, dans le respect de l'article 28 du RGPD ;
● Aux organismes sociaux (Sécurité sociale des artistes-auteurs) et fiscaux (administration
fiscale) dans le cadre des obligations légales.
10.4. Durée de conservation
Les données personnelles de l'Artiste seront conservées :
● Pendant la durée du présent contrat et pendant une durée de dix (10) ans à compter de son
terme, au titre de l'archivage comptable et fiscal ;
● Les données relatives aux communications commerciales seront conservées jusqu'au retrait
du consentement de l'Artiste.
10.5. Droits de l'Artiste
Conformément aux articles 15 à 22 du RGPD, l'Artiste dispose des droits suivants :
● Droit d'accès à ses données personnelles ;
● Droit de rectification en cas d'inexactitude ;
● Droit à l'effacement dans les cas prévus par le RGPD (notamment à l'issue de la durée de
conservation) ;
● Droit à la limitation du traitement ;
● Droit à la portabilité des données fournies ;
● Droit d'opposition pour motifs légitimes ;
● Droit de retirer son consentement à tout moment pour les traitements fondés sur celui-ci.
L'Artiste peut exercer ces droits en adressant sa demande par email à contact@aldo-editions.com ou
par courrier au 4 rue Henri Lebrun, 37540 Saint cyr sur Loire. Aldo répondra dans un délai d'un (1)
mois à compter de la réception de la demande.
L'Artiste dispose également du droit d'introduire une réclamation auprès de la Commission Nationale
de l'Informatique et des Libertés (CNIL), 3 place de Fontenoy, 75007 Paris, www.cnil.fr.
10.6. Sécurité des données
Aldo s'engage à mettre en œuvre des mesures techniques et organisationnelles appropriées pour
garantir la sécurité, l'intégrité et la confidentialité des données personnelles de l'Artiste, et notamment
à les protéger contre la destruction accidentelle ou illicite, la perte, l'altération, la divulgation non
autorisée ou l'accès non autorisé.
ARTICLE 11 – DURÉE DU CONTRAT
11.1. Durée déterminée – Campagne unique
Le présent contrat est conclu pour une durée déterminée correspondant à une seule Campagne de
vente d'une durée d'un (1) mois.
Il débute le {{CAMPAIGN_START}} et s'achève automatiquement et de plein droit le {{CAMPAIGN_END}}, sans
qu'aucune formalité supplémentaire ne soit nécessaire et sans qu'aucune indemnité ne soit due de
part et d'autre.
À la date d'échéance, toutes les exploitations des Œuvres dans le cadre de la Campagne prennent
fin, sous réserve des dispositions de l'article. Les droits concédés à Aldo cessent en conséquence, à
l'exception de ce qui est strictement nécessaire à l'exécution et à la facturation des ventes
intervenues pendant la campagne.
11.2. Absence de renouvellement automatique
Le présent contrat ne fait l'objet d'aucun renouvellement exprès ni tacite.
Toute nouvelle Campagne donnera lieu, si les Parties en sont d'accord, à la conclusion d'un nouveau
contrat distinct, comportant ses propres dates de début et de fin, et ses propres conditions
éventuellement adaptées.
Le fait pour les Parties d'avoir exécuté ensemble une ou plusieurs Campagnes antérieures ou de
conclure ultérieurement un ou plusieurs nouveaux contrats n'aura pas pour effet de transformer le
présent contrat en contrat à durée indéterminée ni de créer un quelconque droit acquis au
renouvellement.
11.3. Absence de reconduction et de préavis de non-renouvellement
Les Parties conviennent expressément qu'aucune d'elles n'a à notifier un non-renouvellement à
l'issue de la Campagne : le contrat prend fin à la date d'échéance prévue à l'article 11.1, sans qu'il
soit besoin de respecter un préavis ni d'adresser une notification quelconque.
Toute poursuite de la collaboration au-delà de la date d'échéance suppose la conclusion préalable
d'un nouveau contrat écrit.
11.4. Campagnes successives et indépendance des contrats
Si les Parties décident de collaborer pour plusieurs Campagnes successives, chacune de ces
Campagnes fera l'objet d'un contrat autonome, conclu pour la durée strictement nécessaire à la
Campagne considérée.
Les Parties reconnaissent que chaque contrat est indépendant des autres :
● la fin d'un contrat n'emporte aucun droit au maintien ou au renouvellement de la
collaboration,
● la succession de contrats à durée déterminée est justifiée par l'organisation par périodes
commerciales distinctes et l'évolution du catalogue d'Œuvres,
● aucun des contrats successifs ne confère à l'une ou l'autre Partie un droit à la conclusion d'un
contrat ultérieur.
ARTICLE 12 – FORCE MAJEURE
12.1. Définition
Conformément à l'article 1218 du Code civil , constitue un cas de force majeure tout événement
échappant au contrôle de la Partie qui l'invoque, qui ne pouvait être raisonnablement prévu lors de la
conclusion du contrat, et dont les effets ne peuvent être évités par des mesures appropriées,
empêchant l'exécution de son obligation.
Sont notamment considérés comme des cas de force majeure, sous réserve qu'ils remplissent les
conditions précitées : les catastrophes naturelles, les incendies, les inondations, les épidémies ou
pandémies, les guerres, les émeutes, les grèves générales non limitées à l'entreprise d'une Partie, les
actes de terrorisme, les défaillances majeures des réseaux de télécommunications ou d'internet non
imputables à la Partie concernée, les modifications législatives ou réglementaires rendant impossible
l'exécution du contrat.
12.2. Effets de la force majeure
En cas de survenance d'un événement de force majeure :
a) Suspension temporaire : Si l'empêchement est temporaire, l'exécution des obligations de la
Partie empêchée est suspendue pendant la durée de l'événement de force majeure. La Partie
concernée devra notifier l'autre Partie par écrit dans les plus brefs délais (et au plus tard dans les sept
(7) jours suivant la survenance de l'événement), en décrivant la nature de l'événement et ses
conséquences sur l'exécution du contrat. Les obligations contractuelles seront suspendues pour une
durée équivalente, sans que cette suspension n'ouvre droit à indemnisation.
b) Résolution de plein droit : Si l'empêchement est définitif, ou si la suspension se prolonge au-delà
d'une durée continue de deux (2) mois, le contrat sera résolu de plein droit et les Parties seront
libérées de leurs obligations réciproques, sans qu'aucune indemnité ne soit due. Les sommes dues
au titre de l'exécution antérieure du contrat resteront exigibles.
ARTICLE 13 – CESSION DU CONTRAT
Aucune des Parties ne pourra céder, transférer ou transmettre à un tiers, à titre gratuit ou onéreux,
tout ou partie des droits et obligations résultant du présent contrat, sans l'accord écrit préalable et
exprès de l'autre Partie.
Par exception, Aldo pourra céder le présent contrat à toute société qui lui serait substituée dans le
cadre d'une opération de fusion, scission, apport partiel d'actifs, transmission universelle de
patrimoine ou cession de fonds de commerce, sous réserve d'en informer l'Artiste par lettre
recommandée avec accusé de réception au moins trente (30) jours à l'avance et de garantir le
maintien de l'ensemble des droits et obligations de l'Artiste.
Toute cession réalisée en violation du présent article sera nulle et de nul effet.
ARTICLE 15 – CONFIDENTIALITÉ
15.1. Obligations de confidentialité
Chaque Partie s'engage à préserver la confidentialité de toutes informations techniques,
commerciales, financières, stratégiques ou personnelles, communiquées par l'autre Partie ou dont
elle aurait eu connaissance dans le cadre de l'exécution du présent contrat, qu'elles soient transmises
par écrit, oralement ou par tout autre moyen, et qu'elles soient ou non explicitement désignées
comme confidentielles (ci-après les « Informations Confidentielles »).
15.2. Obligations concrètes
Les Parties s'engagent à :
● Ne pas divulguer les Informations Confidentielles à des tiers, sauf accord écrit préalable de la
Partie dont émanent les informations ;
● Ne pas utiliser les Informations Confidentielles à d'autres fins que l'exécution du présent
contrat ;
● Limiter la communication des Informations Confidentielles aux seuls membres de leur
personnel, sous-traitants ou conseils ayant strictement besoin d'en connaître pour l'exécution
du contrat, et après les avoir préalablement informés du caractère confidentiel de ces
informations et les avoir soumis à des obligations de confidentialité au moins équivalentes.
15.3. Exceptions
Les obligations de confidentialité ne s'appliquent pas aux informations :
● Qui étaient déjà dans le domaine public au moment de leur communication, ou qui y
tomberaient ultérieurement sans violation du présent contrat par la Partie destinataire ;
● Dont la Partie destinataire peut démontrer qu'elle en avait légitimement connaissance
antérieurement à leur communication ;
● Qui seraient reçues légitimement d'un tiers non soumis à une obligation de confidentialité ;
● Dont la divulgation est imposée par une obligation légale, réglementaire ou judiciaire, sous
réserve que la Partie concernée en informe préalablement l'autre Partie dans la mesure du
possible et limite la divulgation au strict nécessaire.
15.4. Durée
Les obligations de confidentialité prévues au présent article s'appliquent pendant toute la durée du
contrat et demeureront en vigueur pendant une durée de cinq (5) ans à compter de la date de fin du
contrat, quelle qu'en soit la cause.
ARTICLE 16 – INDÉPENDANCE DES PARTIES
Les Parties sont et demeurent des professionnels indépendants. Le présent contrat ne crée entre
elles aucun lien de subordination, de mandat, de société de fait, d'association, de partenariat, de
franchise ou de consortium.
Chaque Partie conserve l'entière responsabilité de la direction et de la gestion de son activité, ainsi
que du respect de ses obligations sociales, fiscales et administratives. Aucune des Parties ne pourra
prendre d'engagement au nom et pour le compte de l'autre Partie, ni la représenter de quelque
manière que ce soit vis-à-vis de tiers, sans mandat écrit préalable.
ARTICLE 17 – INTÉGRALITÉ ET MODIFICATION DU CONTRAT
17.1. Intégralité de l'accord
Le présent contrat, ainsi que ses éventuelles annexes et avenants, constituent l'intégralité de l'accord
conclu entre les Parties concernant son objet. Il annule et remplace tout accord, protocole, lettre
d'intention, échange de courriers ou document antérieur, écrit ou oral, ayant le même objet.
17.2. Modification
Aucune modification, ajout ou renonciation au présent contrat ne sera valable s'il n'est constaté par
un avenant écrit, daté et signé par les représentants dûment habilités des deux Parties.
Toutefois, les modifications purement techniques ou administratives n'affectant pas l'économie
générale du contrat (changement d'adresse, de coordonnées bancaires, de représentant) pourront
être notifiées par simple email.
ARTICLE 18 – NULLITÉ PARTIELLE
Si une ou plusieurs stipulations du présent contrat étaient déclarées nulles, invalides ou inopposables
en application d'une loi, d'un règlement ou à la suite d'une décision définitive d'une juridiction
compétente, elles seraient réputées non écrites, mais n'entraîneraient pas la nullité du contrat dans
son ensemble, sauf si la stipulation déclarée nulle présentait un caractère essentiel et déterminant
pour l'une ou l'autre des Parties.
Les Parties s'engagent dans ce cas à négocier de bonne foi, dans un délai de trente (30) jours, une
stipulation de remplacement aussi proche que possible, dans ses effets économiques et juridiques,
de la stipulation annulée.
ARTICLE 19 – MÉDIATION ET RÈGLEMENT DES LITIGES
19.1. Médiation préalable (clause optionnelle)
En cas de différend relatif à l'interprétation, l'exécution ou la résiliation du présent contrat, les Parties
s'engagent, préalablement à toute action contentieuse, à tenter de résoudre leur différend par la voie
de la médiation conventionnelle.
Les Parties désignent l'association Bordeaux Médiation (Bordeaux Médiation, 18 Rue du Maréchal
Joffre, 33000 Bordeaux) comme compétente pour intervenir dans le cadre de la tentative de
résolution amiable.
La médiation devra être engagée dans un délai de trente (30) jours à compter de la notification du
différend par l'une des Parties à l'autre. Les Parties s'engagent à participer de bonne foi au processus
de médiation pendant une durée maximale de trois (3) mois. Les frais de médiation seront partagés
par moitié entre les Parties, sauf accord contraire.
Si aucun accord n'est trouvé à l'issue de cette période, les Parties seront libres d'engager toute action
contentieuse.
19.2. Droit applicable
Le présent contrat est régi par le droit français, et notamment par les dispositions du Code civil et du
Code de la propriété intellectuelle.
19.3. Attribution de compétence juridictionnelle
Tout différend relatif à la validité, l'interprétation, l'exécution ou la résiliation du présent contrat, qui
n'aurait pu être résolu à l'amiable entre les Parties (le cas échéant après échec de la médiation), sera
soumis à la compétence exclusive des juridictions du ressort du siège social d'Aldo, nonobstant
pluralité de défendeurs, appel en garantie ou référé.
Les Parties pourront toutefois, d'un commun accord exprès, soumettre leur différend à une juridiction
différente.
ARTICLE 20 – NOTIFICATIONS
Toutes les notifications, mises en demeure, demandes ou communications prévues par le présent
contrat devront être effectuées par écrit et transmises :
● Soit par lettre recommandée avec accusé de réception ;
● Soit par acte d'huissier de justice ;
● Soit par email avec accusé de réception (pour les communications courantes non
essentielles).
Les notifications seront adressées aux coordonnées suivantes, sauf notification écrite d'un
changement d'adresse :
Pour Aldo :
Aldo Editions - 4 rue Henri Lebrun, 37540 Saint cyr sur Loire
Email : contact@aldo-editions.com
Pour l'Artiste :
{{NOTIF_NAME}}
{{NOTIF_ADDRESS}}
Email : {{NOTIF_EMAIL}}
Les notifications sont réputées reçues :
● À la date de première présentation du courrier recommandé (même en cas de refus ou de
non-réclamation) ;
● À la date de signification de l'acte d'huissier ;
● À la date de l'accusé de réception électronique pour les emails (pour les communications non
essentielles).
ARTICLE 21 – SIGNATURE ÉLECTRONIQUE
Le présent contrat peut être signé par voie électronique via la plateforme Goodflag, conformément
aux dispositions du Règlement (UE) n° 910/2014 (règlement eIDAS) et des articles 1366 et 1367 du
Code civil.
Chaque exemplaire signé électroniquement a valeur d'original. Les Parties reconnaissent que la
signature électronique a la même force probante qu'une signature manuscrite.
ARTICLE 22 – ANNEXES
Font partie intégrante du présent contrat les annexes suivantes :
Annexe 1 : Liste initiale des Œuvres concédées en licence, comprenant pour chaque Œuvre : titre,
description, format et caractéristiques du fichier numérique fourni, date de création.`;

/** Injecte les variables dans le texte brut. */
export function buildContractBody(data: ContractData): string {
  return RAW.replace(/\{\{IDENTITY\}\}/g, data.identityLine)
    .replace(/\{\{COMMISSION_WORDS\}\}/g, data.commissionWords)
    .replace(/\{\{COMMISSION_PCT\}\}/g, data.commissionPct)
    .replace(/\{\{IBAN\}\}/g, data.iban)
    .replace(/\{\{CAMPAIGN_START\}\}/g, data.campaignStart)
    .replace(/\{\{CAMPAIGN_END\}\}/g, data.campaignEnd)
    .replace(/\{\{NOTIF_NAME\}\}/g, data.notifName)
    .replace(/\{\{NOTIF_ADDRESS\}\}/g, data.address)
    .replace(/\{\{NOTIF_EMAIL\}\}/g, data.email);
}

/* --------------------------- Parseur en blocs --------------------------- */

export type BlockType = "article" | "heading" | "bullet" | "letter" | "struct" | "para";
export type Block = { type: BlockType; text: string };

const STRUCT = new Set([
  "ENTRE LES SOUSSIGNÉS :",
  "D'UNE PART,",
  "ET :",
  "D'AUTRE PART,",
  "Ci-après dénommée « Aldo » ou « le Licencié »,",
  "Ci-après dénommé(e) « l'Artiste » ou « le Concédant »,",
  "Aldo et l'Artiste sont ci-après désignés ensemble « les Parties » et individuellement « une Partie ».",
  "IL A ÉTÉ PRÉALABLEMENT EXPOSÉ CE QUI SUIT :",
  "CECI ÉTANT EXPOSÉ, IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :",
  "Pour Aldo :",
  "Pour l'Artiste :",
]);

const isArticle = (l: string) => /^ARTICLE\s+\d+/.test(l);
const isBullet = (l: string) => /^●\s?/.test(l) || /^-\s/.test(l);
const isLetter = (l: string) => /^[a-z]\)\s/.test(l);
const isSubclause = (l: string) => /^\d+(\.\d+)+\.?\s+\S/.test(l);
const endsTerminal = (t: string) => /[.;:!?]$/.test(t.trimEnd());

/** Un sous-titre court sans ponctuation finale (ex. « 3.1. Étendue de la licence »). */
function isHeading(l: string): boolean {
  return isSubclause(l) && l.length < 66 && !/[.;:!?]$/.test(l.trim());
}

/**
 * Reflue le texte (avec sauts de ligne d'origine dus à l'habillage) en blocs
 * sémantiques. Les lignes de continuation sont rejointes tant que le bloc
 * courant ne se termine pas par une ponctuation forte.
 */
export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    if (STRUCT.has(line)) {
      blocks.push({ type: "struct", text: line });
      current = null;
    } else if (isArticle(line)) {
      blocks.push({ type: "article", text: line });
      current = null;
    } else if (isBullet(line)) {
      current = { type: "bullet", text: line.replace(/^●\s?/, "").replace(/^-\s/, "") };
      blocks.push(current);
    } else if (isLetter(line)) {
      current = { type: "letter", text: line };
      blocks.push(current);
    } else if (isHeading(line)) {
      blocks.push({ type: "heading", text: line });
      current = null;
    } else if (isSubclause(line)) {
      current = { type: "para", text: line };
      blocks.push(current);
    } else {
      // Ligne « nue » : continuation du bloc courant, ou nouveau paragraphe.
      if (current && (current.type === "para" || current.type === "bullet" || current.type === "letter") && !endsTerminal(current.text)) {
        current.text += " " + line;
      } else {
        current = { type: "para", text: line };
        blocks.push(current);
      }
    }
  }

  return blocks;
}
