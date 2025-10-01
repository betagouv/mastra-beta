# mastra-beta

Agent IA au service de la communauté

## Workflow

```mermaid
graph LR

UserQuery-->Classify
subgraph agent
Classify-->|API_BetaGouv|Entities1[known entities]
Classify-->|doc.incubateur.net|RAGDoc2[documentation topics]
Classify-->|Espace_Membre|DbTopics[SQL queries]
Entities1-->Formatter
RAGDoc2-->Formatter
DbTopics-->Formatter
end
Formatter-->UserQuery
```

## Scope

- [x] queries about community members and startups
- [x] queries about documentation
- [ ] queries about code
- [ ] queries about news (members, products, community updates)

## Dev

Create a `.env` from example

```sh
npm i
export OPENAI_API_BASE=xxx
export OPENAI_API_KEY=xxx

# setup data

# vectorize documentation
npm run create-doc-store

# create espace-membre PostgreSQL view
psql $ESPACE_MEMBRE_DATABASE_URL < create-views.sql

npm run dev
```

## Todo

- improve initial routing
- sql query transparency (explain to the user)
- handle multi NER queries: "whats the diff in X and Y"
- cron to update datas (documentation + fiches)
- MCP
- data:
  - incubator & teams
  - calendar
  - données tech (stack, apis)
  - changelogs
  - https://betagouv.github.io/beta.gouv.fr/startups.html
