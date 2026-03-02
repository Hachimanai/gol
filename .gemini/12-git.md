# Git Best Practices

## Branch Management
- **Naming Convention**: Use clear prefixes to categorize branches:
  - `feature/` for new features.
  - `bugfix/` for bug fixes.
  - `hotfix/` for critical production fixes.
  - `refactor/` for code restructuring without changing behavior.
  - `docs/` for documentation changes.
- **Hyphenated lowercase**: Use lowercase letters and hyphens for branch names (e.g., `feature/compact-header`).
- **One task per branch**: Keep branches focused on a single logical change to simplify code reviews.

## Commits
- **Atomic Commits**: Each commit should represent a single, self-contained change. This makes it easier to revert or cherry-pick specific changes.
- **Conventional Commits**: Follow the Conventional Commits specification for messages:
  - `feat`: A new feature.
  - `fix`: A bug fix.
  - `docs`: Documentation only changes.
  - `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc).
  - `refactor`: A code change that neither fixes a bug nor adds a feature.
  - `test`: Adding missing tests or correcting existing tests.
  - `chore`: Changes to the build process or auxiliary tools and libraries.
- **Message Structure**:
  - **Subject line**: Concise (50 chars max), capitalized, no period at the end. Use imperative mood (e.g., "Add cell size control" instead of "Added...").
  - **Body (optional)**: Detailed explanation of "what" and "why" if the change is complex.
- **Verified Commits**: Ensure the code builds, passes tests, and passes linting (`npm run lint`) before committing.
- **Automation**: Commit changes autonomously after each significant task or at the user's request, following these conventions.
