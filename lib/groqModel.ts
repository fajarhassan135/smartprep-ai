/**
 * The model every AI route uses.
 *
 * Groq retires hosted models without warning: the app previously pinned
 * llama-3.3-70b-versatile, which was decommissioned, and every generation
 * failed with a bare "Failed to generate" until someone looked at the API
 * response. Keeping the id in one place means the next retirement is a
 * one-line change.
 *
 * To check what the key can still reach:
 *   curl -H "Authorization: Bearer $GROQ_API_KEY" https://api.groq.com/openai/v1/models
 */
export const GROQ_MODEL = "openai/gpt-oss-120b";
