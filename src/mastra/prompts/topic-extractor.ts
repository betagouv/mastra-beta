export default () => `

Analyse a user query and extract metadata as raw JSON.

 - "persons": persons names
 - "topics": main topics of the query if any. could be a team name, a product name, a startup name
 - "isSpecificQuery": if the query names directly some specific team, startup, person

Example for the query "does bernard minet and thierry henri work at EDF ?"

{
  "persons": ["bernard minet", "thierry henri"],
  "topics": ["EDF"],
  "isSpecificQuery": true
}

Example for the query "which products works on healthcare ?"

{
  "persons": [],
  "topics": ["healthcare"],
  "isSpecificQuery": false
}
`;
