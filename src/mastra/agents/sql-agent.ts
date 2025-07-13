import { createOpenAI } from "@ai-sdk/openai";

import { Agent } from "@mastra/core";

const sqlModel = process.env.SQL_MODEL || "qwen2.5-coder-32b-instruct"; //deepseek-r1-distill-llama-70b"; //llama-3.3-70b-instruct";

const databaseSchema = `
## View: public.active_users

Liste des membres de la communauté

| Column        | Data Type                | Comment              |
| ------------- | ------------------------ | -------------------- |
| username      | text                     |                      |
| bio           | text                     | long description     |
| fullname      | character varying(255)   |                      |
| competences   | text                     | list of skills       |
| domaine       | character varying(40)    | Main skill. one of "Développement", "Intraprenariat", "Data", "Design", "Déploiement", "Support", "Coaching", "Produit"          |
| primary_email | text                     |                      |
| link          | text                     |                      |
| updated_at    | timestamp with time zone |                      |
| created_at    | timestamp with time zone |                      |
| mission_end   | date                     |                      |



## View: public.active_startups

Liste des startups et des équipes

| Column               | Data Type                | Comment                              |
| -------------------- | ------------------------ | ------------------------------------ |
| derniere_phase       | timestamp with time zone | phase actuelle de la startup         |
| phase                | character varying        |  one of : "investigation","construction","acceleration","succes","alumni"                                    |
| members              | text                     |  list of active_users.username |
| ghid                 | character varying(255)   |                                      |
| name                 | character varying(255)   |                                      |
| pitch                | text                     | short description.                   |
| stats_url            | text                     |                                      |
| link                 | text                     |                                      |
| repository           | text                     |                                      |
| contact              | text                     |                                      |
| dashlord_url         | text                     |                                      |
| accessibility_status | character varying(255)   | one of "non conforme", "partiellement conforme", "totalement conforme", NULL                                     |
| analyse_risques_url  | text                     |                                      |
| stats                | boolean                  |                                      |
| description          | text                     | long detailed description            |
| incubator            | text                     | name of the incubator or fabrique. on of "Opérateur de produits interministériels (dinum_produits_interministeriels)", "Incubateur du MEFR (Bercy) (bercy)", "La Fabrique Numérique du Ministère des armées (fabnumdef)", "Mission interministérielle InserJeunes (mission-inserjeunes)", "Fabrique numérique des ministères sociaux (sgmas)", "Le laboratoire d'innovation de l'ANSSI (lab-innov-anssi)", "ALLiaNCE (alliance)", "La Fabrique des géocommuns (fab-geocommuns)", "La Fabrique Numérique du Ministère de l'Intérieur (FabNum-MI)", "La Fabrique numérique des Finances publiques (fabrique-dgfip)", "L'Incubateur de Services Numériques (DINUM) (dinum)", "L'Atelier Numérique du Ministère de la Culture (culture)", "L'Incubateur de la Justice (justice)", "Accélérema (accelerema)", "La Fabrique Numérique de l'Ecologie (MTE-MCT) (mtes)", "La Ruche numérique - l'Incubateur du Ministère de l'Agriculture et de la Souveraineté alimentaire (agriculture)", "L'Incubateur des Territoires (ANCT) (anct)", "Plateformes de l'Engagement Civique (engagement_civique)", "L'incubateur de l'Éducation nationale et de la Jeunesse (menj)", "Plateforme de l'inclusion (gip-inclusion)", "L'Atelier Numérique du Ministère de l'Europe et des Affaires Etrangères (latelier.numerique.du.ministere.de.leurope.et.des.affaires.etrangeres)", "L'Accélérateur de la Transition Écologique (ADEME) (ademe)", "L'Incubateur de France travail (francetravail)", "Mission interministérielle pour l’apprentissage (mission-apprentissage)"                                     |
| mon_service_securise | boolean                  | Utilisent mon-service-sécurisé                                     |
| techno               | jsonb                    |                                      |
| thematiques          | text                     | list of thematics from : "Écologie", "Administratif", "Travail / Emploi", "Territoires", "Collectivités", "Outil technique", "Open-Data", "Social", "Jeunesse", "Formation", "Santé", "Agriculture", "Entreprises", "Logement", "Inclusion numérique", "Justice", "Transports", "Démocratie", "Education", "Patrimoine", "Sécurité informatique", "Mer", "cybersécurité", "Culture", "Sport" |
| usertypes            | text                     | list of target audience  from : "etat", "particulier", "collectivite-territoriale", "entreprise", "association", "etablissement-scolaire"             |
| updated_at           | timestamp with time zone |                                      |
| budget_url           | text                     |                                      |
| created_at           | timestamp with time zone |                                      |
| has_mobile_app       | boolean                  |                                      |
| dsfr_status          | character varying(255)   |                                      |
| tech_audit_url       | character varying(255)   |                                      |
| ecodesign_url        | character varying(255)   |                                      |
| roadmap_url          | character varying(255)   |                                      |
| impact_url           | character varying(255)   |                                      |
`;

const instructionsSQL = `You're an expert at PostgreSQL queries. Return a valid raw PostgreSQL query from the user query to extract the data you need to answer.

RULES
 - Today date is 2025-07-25
 - prettify the SQL query and prefix with table names
 - dont alias tables
 - Use french date formats
 - use ILIKE and '%' operator when searching for text, strings, members, incubators
 - use group by when necessary
 - limit to 25 results
 - use active_startups.ghid as primary key for startups
 - use active_users.username as primary key for members
 - include the "pitch" and "thematiques" fields for startups
 - include the "fullname" and "domaine" and "competences" fields for users
 - dont include the users bio or dates unless needed
 - dont wrap the query, just return the executable query itself, with nothing else, no wrapping.

SCHEMA:
${databaseSchema}
`;

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export const sqlAgent = new Agent({
  name: "sql-query-agent",
  instructions: instructionsSQL,
  model: openai(sqlModel),
  defaultGenerateOptions: { maxSteps: 3, maxRetries: 5 },
});
