# Instructions for AI Assistants

## Basic Guidelines

- Always ask questions before implementation if something is unclear
- Always read existing files before modifying them
- Check for lint errors after making changes and fix them
- When adding new features, follow existing patterns in the codebase
- Suggest updates to this `AGENTS.md` file when discovering new patterns, but only apply after user confirmation
- Do not leave obvious comments in code
- Do not create new documentation until I asked to do so

## Using the Open WebUI Knowledge MCP Server

When working in this workspace, use the **open-webui-knowledge** MCP server to search company knowledge bases whenever relevant. Prefer it over generic answers for internal standards, architecture, and Ronas IT context.

### When to Query Knowledge Bases

Use the MCP tools **list_knowledge_bases**, **search_knowledge_base**, and **get_knowledge_base_info** (server: `user-open-webui-knowledge`) in these cases:

1. **User mentions a knowledge base**
   e.g. “knowledge base”, “check the docs”, “per our guidelines”, “in our documentation”.

2. **Question is about architecture, standards, or recommended solutions** for:
   - **React** → search **Frontend Docs**
   - **React Native** → search **Frontend Docs**
   - **Next.js** → search **Frontend Docs**
   - **PHP / Laravel** → search **Backend Docs**

3. **User mentions Ronas (Ronas IT, the company, our product)**
   Use **Frontend Docs**, **Backend Docs**, or **Ronas IT Dribbble Portfolio** depending on whether the question is about frontend, backend, or design references.

4. **Sales, marketing, or task templates**
   Use **Sales Documentation**, **Sales**, **Marketing**, or **Tasks Templates** when the question is about processes, sales materials, or task formats.

### Knowledge Base IDs (for search_knowledge_base)

| Knowledge base           | ID                                     |
| ------------------------ | -------------------------------------- |
| Backend Docs (Laravel)   | `60603f2d-1318-4e81-adbd-681b47b22b3a` |
| Frontend Docs (RN, Next) | `7de525d2-a308-41e4-ab15-42d527549703` |
| Sales Documentation      | `b0d7f492-cf20-442b-a767-2255113f036f` |
| Ronas IT Dribbble        | `e64d0850-bd4d-4e68-9ca4-4e2211d795d4` |
| Sales                    | `8f8bb651-a5dc-43e5-a650-a3a145543690` |
| Marketing                | `5006584c-28f5-4a5b-8fa8-0f61e3c7f981` |
| Tasks Templates          | `44fc3e2e-c0eb-4700-bb51-4d80cadbf0f9` |

**Keeping the table up to date:** If you call **list_knowledge_bases** and the result shows new bases, different IDs, or missing entries compared to the table above, update the "Knowledge Base IDs" table in this file (AGENTS.md) so it matches the current list. That keeps the reference accurate for future sessions.

If in doubt, call **list_knowledge_bases** first to get the current list and descriptions.

### How to Search

- Use **search_knowledge_base** with `knowledge_base_id` and `query` (and optionally `k` for number of results).
- Formulate `query` from the user’s question (architecture, tech stack, “how we do X”, naming, etc.).
- Prefer the most specific base (e.g. Frontend Docs for React/Next/RN, Backend Docs for Laravel) and optionally search multiple bases when the question spans domains or company practices.

Cite retrieved snippets and, when they conflict with generic best practices, prefer the knowledge base content for this project.
