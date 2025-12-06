/*
SELECT distinct(competence), count(*) AS c
FROM users, jsonb_array_elements(users.competences) competence 
GROUP  BY competence having count(*)>1 order by c desc;

TODO: extract from DB
*/
const competences = [
  "Développement Full-stack",
  "Développement Backend",
  "Administration Publique",
  "UX",
  "Communication",
  "Coaching",
  "Product strategy",
  "Développement Frontend",
  "Croissance",
  "Facilitation",
  "Product design",
  "Intrapreneur(se)",
  "UI",
  "JavaScript/TypeScript",
  "Gestion de Produit",
  "Python",
  "PostgreSQL",
  "DevOps",
  "Data Science",
  "Accessibilité",
  "Administration Système",
  "Docker",
  "Metabase",
  "Machine learning",
  "Sécurité informatique",
  "PHP",
  "Droit / Affaires juridiques",
  "SEO",
  "Matomo",
  "Développement",
  "ElasticSearch",
  "Kubernetes",
  "SEM",
  "Ruby",
  "Déploiement",
  "React",
  "Django",
  "Elm",
  "déploiement",
  "Design graphique",
  "Drupal",
  "IA",
  "Support",
  "Agilité",
  "Android",
  "business development",
  "Business Developpement",
  "Design",
  "Écoconception",
  "Grist",
  "Langage clair",
  "LLM",
  "NextJS",
  "Rédaction",
  "Relation usagers",
  "Rust",
  "UX Writing",
];

export default () => `Analyse a user query and select appropriate categories of skills from the given list.

return results as a raw JSON only with entries from the given list.

Only include results with 80% relevance trust

Possibles categories:${competences.join("; ")}

Example : 
 - Q: aide pour les bases de données
   R: ["PostgreSQL", "ElasticSearch", "Développement Backend", "Grist"]
 - Q: parler d'IA
   R: ["LLM", "IA", "Machine learning"]
 - Q: comment faire une recette de cuisine
   R: []

`;
