# Security Policy

## Reporting a Vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report security issues privately via **GitHub Private Security Advisories** (repository → **Security** tab → **Report a vulnerability**), or contact the maintainers directly. Include:

- Affected file / skill / script
- Steps to reproduce
- Potential impact

We will acknowledge your report within **3 business days** and keep you informed of the fix timeline.

## Security Considerations for This Skill Pack

ai-tutor is a set of agent skills (SKILL.md files) plus local Node.js scripts. Key security notes:

- **Prompt injection**: The skill receives user content (questions, images, PDFs). The teaching workflows in `SKILL.md` are written to treat user input as *data to teach*, not as instructions. If you extend the skills, keep this boundary explicit.
- **Local data only**: Learning data (e.g. `data/mistake-book.json`) stays local to the user's machine. Never add endpoints, telemetry, or network calls that exfiltrate user learning data.
- **No secrets**: Never commit API keys or tokens (e.g. the OpenAI-compatible endpoint used in the demo) into this repository.
- **Academic integrity**: Skills must not be used to write answers for cheating or exam fraud — the workflows are designed to explain reasoning and let learners produce their own final answers.

## Reporting Non-Security Issues

Open a regular issue or pull request — see [CONTRIBUTING.md](./CONTRIBUTING.md).
