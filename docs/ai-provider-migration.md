# OpenRouter release checklist

The extraction workflow, brand-kit discovery, voice analysis, vibe synthesis and
DESIGN.md generation all use OpenRouter with `google/gemini-2.5-flash`.
The model is present in OpenRouter's public catalog as of October 26, 2026.
The four old bare Qwen model overrides and B3IQ routing were removed so every
stage uses a valid OpenRouter model ID.

Before deploying, provision a valid `OPENROUTER_API_KEY` secret for `extractvibe`.
The production Worker had no such binding in the October 26 audit. Never put
its value in source, a PR, logs or chat. Local development reads ignored
`.dev.vars`; `.dev.vars.example` lists the expected name.

`LLM_PROVIDER`, `B3IQ_API_KEY` and `ANDROMEDA_LLM_API_KEY` are no longer read.
An old `LLM_PROVIDER=b3iq` setting in the ignored production `wrangler.jsonc`
cannot send migrated requests to B3IQ. Clean these obsolete vars/secrets only
after the new deployment and representative output are verified.

CI builds and tests but does not deploy. Use the normal `npm run deploy` release
path after approval and credentials are ready. Verify the active Worker revision
and run a representative authorized extraction. Inspect voice/vibe degradation
flags, brand-kit results and DESIGN.md prose: the pipeline can complete using
deterministic fallbacks when a provider fails. A completed workflow alone does
not establish working AI output. No paid call is needed for mocked local tests.

Reference: https://openrouter.ai/api/v1/models.
