# Rules

Rules provide system-level instructions to Agent and Inline Edit. They are persistent context, preferences, or workflows for your projects.

Cursor supports four types of rules:
Project Rules
Stored in .cursor/rules, version-controlled and scoped to your codebase.
User Rules
Global to your Cursor environment. Defined in settings and always applied.
AGENTS.md
Agent instructions in markdown format. Simple alternative to .cursor/rules.

## How rules work

Large language models don't retain memory between completions. Rules provide persistent, reusable context at the prompt level.

When applied, rule contents are included at the start of the model context. This gives the AI consistent guidance for generating code, interpreting edits, or helping with workflows.

## Project rules

Project rules live in .cursor/rules. Each rule is a file and version-controlled. They are scoped using path patterns, invoked manually, or included based on relevance. Subdirectories include their own .cursor/rules directory scoped to that folder.

Use project rules to:

Encode domain-specific knowledge about your codebase
Automate project-specific workflows or templates
Standardize style or architecture decisions

### Rule anatomy

Each rule file is written in MDC (.mdc), a format supporting metadata and content. Control how rules are applied from the type dropdown which changes properties description, globs, alwaysApply.

Rule Type Description
Always Always included in model context
Auto Attached Included when files matching a glob pattern are referenced
Agent Requested Available to AI, which decides whether to include it. Must provide a description
Manual Only included when explicitly mentioned using @ruleName

---

description: RPC Service boilerplate
globs:
alwaysApply: false

---

- Use our internal RPC pattern when defining services
- Always use snake_case for service names.

@service-template.ts

## Nested rules

Organize rules by placing them in .cursor/rules directories throughout your project. Nested rules automatically attach when files in their directory are referenced.

project/
.cursor/rules/ # Project-wide rules
backend/
server/
.cursor/rules/ # Backend-specific rules
frontend/
.cursor/rules/ # Frontend-specific rules

## Creating a rule

Create rules using the New Cursor Rule command or going to Cursor Settings > Rules. This creates a new rule file in .cursor/rules. From settings you can see all rules and their status.

## Generating rules

Generate rules directly in conversations using the /Generate Cursor Rules command. Useful when you've made decisions about agent behavior and want to reuse them.

## Best practices

Good rules are focused, actionable, and scoped.

Keep rules under 500 lines
Split large rules into multiple, composable rules
Provide concrete examples or referenced files
Avoid vague guidance. Write rules like clear internal docs
Reuse rules when repeating prompts in chat

## Examples

### Standards for frontend components and API validation

This rule provides standards for frontend components:

When working in components directory:

Always use Tailwind for styling
Use Framer Motion for animations
Follow component naming conventions
This rule enforces validation for API endpoints:

In API directory:

Use zod for all validation
Define return types with zod schemas
Export types generated from schemas

### Templates for Express services and React components

This rule provides a template for Express services:

Use this template when creating Express service:

Follow RESTful principles
Include error handling middleware
Set up proper logging
@express-service-template.ts

This rule defines React component structure:

React components should follow this layout:

Props interface at top
Component as named export
Styles at bottom
@component-template.tsx

### Automating development workflows and documentation generation

This rule automates app analysis:

When asked to analyze the app:

Run dev server with npm run dev
Fetch logs from console
Suggest performance improvements
This rule helps generate documentation:

Help draft documentation by:

Extracting code comments
Analyzing README.md
Generating markdown documentation

### Adding a new setting in Cursor

First create a property to toggle in @reactiveStorageTypes.ts.

Add default value in INIT_APPLICATION_USER_PERSISTENT_STORAGE in @reactiveStorageService.tsx.

For beta features, add toggle in @settingsBetaTab.tsx, otherwise add in @settingsGeneralTab.tsx. Toggles can be added as SettingsSubSection for general checkboxes. Look at the rest of the file for examples.

```tsx
<SettingsSubSection
label="Your feature name"
description="Your feature description"
value={
    vsContext.reactiveStorageService.applicationUserPersistentStorage
    .myNewProperty ?? false
}
onChange={(newVal) => {
    vsContext.reactiveStorageService.setApplicationUserPersistentStorage(
    "myNewProperty",
    newVal,
);
}}
/>
To use in the app, import reactiveStorageService and use the property:
const flagIsEnabled =
vsContext.reactiveStorageService.applicationUserPersistentStorage
.myNewProperty;
```
