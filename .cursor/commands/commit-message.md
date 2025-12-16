# Auto-generate commit message

Analyze the staged git changes and generate an appropriate commit message following conventional commits format.

The commit message should:

- Use conventional commit types (feat, fix, chore, refactor, docs, etc.)
- Include a clear, concise subject line (50-72 characters)
- Include a detailed body explaining what changed and why (if significant changes)
- Note any breaking changes if applicable
- Follow the project's existing commit message style

Analyze:

- The files that were changed
- The nature of the changes (additions, deletions, modifications)
- The scope of changes (which services/apps were affected)
- Whether this is a feature, bugfix, refactor, or other type of change
- Any dependencies or configuration changes

Generate a commit message that accurately describes the changes in a professional, clear manner. Return the commit message in the chat, don't write it to a file.
