import OpenAI from "openai";

let _llm: OpenAI | null = null;

export function getLlm() {
	if (!_llm) {
		_llm = new OpenAI({
			baseURL: process.env.LOCAL_LLM_BASE_URL ?? "http://localhost:5001/v1",
			apiKey: process.env.LOCAL_LLM_API_KEY ?? "no-key",
		});
	}
	return _llm;
}
