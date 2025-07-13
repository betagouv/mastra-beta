# mastra-beta

MCPs, agents and workflows to query beta.gouv.fr public data

## Workflow

```mermaid
graph LR

UserQuery-->Hinters
Hinters-->Entities1[known entities]
Hinters-->Documentation[documentation topics]
Hinters-->DbTopics[database topics]
DbTopics-->Enrichers
Entities1-->Enrichers
Documentation-->Enrichers
Enrichers-->Entities2[known entities]
Enrichers-->RAGDoc2[RAG documentation]
Enrichers-->SQLQuery2[SQL query]
Entities2-->Formatter
RAGDoc2-->Formatter
SQLQuery2-->Formatter
```

## Datasources:

- beta.gouv API for members & startups
- some espace-membre dedicated PostreSQL views
- doc.incubateur.net

## Dev

Create a `.env` from example

```sh
npm i
export OPENAI_API_BASE=xxx
export OPENAI_API_KEY=xxx
npm run dev
```

## Todo

- improve intial routing
- data:
  - incubator teams
  - fast
  - données tech (stack, apis)
  - automate schema syncs
  - add incubators in names entities
