# AGENTS Instructions

## Commit policy (required)
-Never not stage nor commit any file under `assistant` folder
- Always create as many small, logical commits as possible for any change.
- Follow the commit format and rules in `assistant/commiter.md` for every commit.
- Prefer splitting by logical change, even within the same file, when it stays coherent.
- Never combine unrelated changes in one commit.
- Before sending a final response for any code or file change, stage and commit
  all non-`assistant` changes made for that task unless the user explicitly says
  not to commit.
- If the AI adds a `console.log`, it must parse the logged value into a string first.
