# Commit Message Tuner Guide

This guide documents the commit message pattern used in this project. Follow this for consistent, clear commits.

---

## ⚠️ CRITICAL FORMAT RULE ⚠️

**The format is `component(type):` NOT `type(component):`**

### ✅ CORRECT Examples:
```
auth(fix): resolve infinite loading state
api(feat): add axios client and query setup
sidebar(refactor): update sizing and spacing
types(fix): augment axios module
```

### ❌ WRONG Examples:
```
fix(auth): resolve infinite loading state     ← WRONG! Should be auth(fix):
feat(api): add axios client                    ← WRONG! Should be api(feat):
refactor(sidebar): update sizing               ← WRONG! Should be sidebar(refactor):
fix(types): augment axios module               ← WRONG! Should be types(fix):
```

**ALWAYS put the component FIRST, then the type in parentheses!**

---

## Format

```
<component>(type): <brief description>

- <bullet point 1>
- <bullet point 2>
- <bullet point 3>

<optional longer explanation paragraph>
```

## Components

The component name is the **primary feature/file/module** being changed:
- `live` - Live forecasting session page
- `compose` - Question creation/compose page
- `DocumentUpload` - Document upload component
- `DocumentSelector` - Document selection component
- `QuestionContent` - Question content component
- `GenerationSession` - Backend generation session
- `forecast_session` - Backend WebSocket handler
- etc.

## Types

Use one of these types:

| Type | Use Case | Examples |
|------|----------|----------|
| `feat` | New feature or functionality | Adding cancel command, adding collapsible feature |
| `fix` | Bug fix | Resolving duplicate function, fixing width constraint |
| `refactor` | Code improvement without changing behavior | Using existing type instead of duplicating |

## Subject Line Rules

1. **Keep it concise** - 50-70 characters max
2. **Use imperative mood** - "implement", "add", "remove", not "implemented", "adds"
3. **Start with lowercase** after component
4. **No period at the end**
5. **Be specific** - What is being done, not just "update"

## Bullet Points Rules

- **One change per bullet** - Each bullet = one clear action
- **Use imperative mood** - "Add", "Remove", "Update", "Changed"
- **Be detailed but concise** - Explain the WHAT and sometimes WHY
- **Include file/component names** when relevant
- **3-6 bullets is ideal** - More than 6 might need splitting

### Bullet Point Examples

❌ **Bad:**
```
- stuff changed
- made it work
- fixed things
```

✅ **Good:**
```
- Add 'cancel' to sendSessionCommands type to support cancellation
- Update handleCancel to send WebSocket cancel command before navigation
- Add 300ms delay to allow cancel message to reach backend
- Only send cancel command if forecast is in progress
```

## Longer Explanation (Optional)

Include a longer paragraph ONLY if:
- The change has complex reasoning
- You need to explain the problem it solves
- The impact on users/workflow needs clarification

**Format:**
- Separated from bullets by blank line
- 2-3 sentences max
- Plain language, not technical jargon
- Focus on WHY and IMPACT

### Explanation Examples

❌ **Bad:**
```
This changes the behavior of the session management system to handle
cancellation in a more efficient way by utilizing the existing pause
mechanism and adding a new cancel method which sets isMounted to false.
```

✅ **Good:**
```
This ensures the backend forecast session is properly stopped when user clicks
the cancel button, instead of just navigating away and leaving processes running.
```

## Real Examples from Project

### Example 1: Feature with backend changes
```
GenerationSession(feat): implement cancel() method for user-initiated cancellation

- Add async cancel() method to gracefully stop forecast generation
- Set isMounted = false to exit main execution loop
- Update session status to 'cancelled' and save to database
- Clear status update intervals and cleanup resources
- Update forecast status in database with cancellation log
- Broadcast session_termination event to all connected clients
- Follow error handling pattern for consistency

The cancel method stops running processes, saves state, and notifies all
connected clients when a user cancels a forecast session.
```

### Example 2: Fix with specific technical details
```
DocumentUpload(fix): remove width constraint from DocumentUpload to match DocumentSelector

- Changed max-w-lg to w-full in DocumentUpload root wrapper
- DocumentSelector has no max-width constraint (100% width)
- When switching from DocumentSelector to DocumentUpload during save, width was shrinking from 100% to ~50% (max-w-lg = 512px)
- Now both components maintain consistent full width across the transition
```

### Example 3: Refactor
```
compose(refactor): used ts Actors type since it already exist
```
*Note: Brief refactors can skip bullets and explanation*

### Example 4: Feature with user workflow
```
compose(feat): add full document upload to DocumentSelector (PDF/URL/Text)

- Add tabbed upload interface (File/URL/Text)
- Implement handleUploadDocument with file upload support
- Auto-select newly uploaded documents immediately
- Show upload progress with toast notifications
- Reset form after successful upload

Users can now upload NEW documents directly in question creation and choose between
PDF file, URL, or text content. Documents are uploaded and auto-selected immediately.
```

## Commit Best Practices

1. **One logical change per commit** - Don't mix features with fixes
2. **Test before committing** - Ensure the change works
3. **Small, focused commits** - Easier to review and understand
4. **Related changes can be grouped** - e.g., frontend handler + backend handler for same feature
5. **Write in present tense** - "Add" not "Added"
6. **Use default git author** - Do not specify custom author with `--author` flag, let git use the configured default author

## Anti-Patterns to Avoid

❌ Don't do this:
```
update stuff
fixed it
WIP
random changes
fix(auth): message here           ← WRONG FORMAT! Should be auth(fix):
feat(api): message here            ← WRONG FORMAT! Should be api(feat):
type(component): message           ← WRONG FORMAT! Should be component(type):
component(type): This is a very long commit message that tries to explain everything in the subject line instead of using bullets
-
-
```

✅ Do this instead:
```
component(type): brief clear description

- specific change 1
- specific change 2
- specific change 3

Optional: One or two sentence explanation of impact.
```

## Quick Checklist

Before committing, ask yourself:

- [ ] **CRITICAL: Is the format `component(type):` and NOT `type(component):`?**
- [ ] Is the component name clear and specific?
- [ ] Is the type (feat/fix/refactor) correct?
- [ ] Is the subject line 50-70 characters?
- [ ] Do all bullets use imperative mood?
- [ ] Can someone understand what changed without reading code?
- [ ] Is there an optional explanation if the change is complex?
- [ ] Does each bullet represent one distinct change?

## Final Reminder

**Before you write ANY commit message, remember:**
- Component comes FIRST: `auth`, `api`, `sidebar`, etc.
- Type comes SECOND in parentheses: `(fix)`, `(feat)`, `(refactor)`
- Final format: `component(type): description`

**DO NOT write `fix(component):` or `feat(component):` - This is WRONG!**
