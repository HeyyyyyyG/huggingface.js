import type { PipelineType } from "../pipelines.js";
import { getModelInputSnippet } from "./inputs.js";
import type { ModelDataMinimal } from "./types.js";

export const snippetBasic = (model: ModelDataMinimal, accessToken: string): string =>
	`async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/${model.id}",
		{
			headers: {
				Authorization: "Bearer ${accessToken || `{API_TOKEN}`}"
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({"inputs": ${getModelInputSnippet(model)}}).then((response) => {
	console.log(JSON.stringify(response));
});`;

export const snippetTextGeneration = (model: ModelDataMinimal, accessToken: string): string => {
	if (model.config?.tokenizer_config?.chat_template) {
		// Conversational model detected, so we display a code snippet that features the OpenAI Messages API
		// Code adapted from https://huggingface.co/blog/tgi-messages-api
		return `// npm install openai
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api-inference.huggingface.co/models/${model.id}/v1/",
  apiKey: "${accessToken || `{API_TOKEN}`}",
});

async function main() {
  const stream = await openai.chat.completions.create({
    model: "tgi",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Tell me a funny joke." },
    ],
    stream: true,
    max_tokens: 500,
  });
  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main();
`;
	} else {
		return snippetBasic(model, accessToken);;
	}
}
export const snippetZeroShotClassification = (model: ModelDataMinimal, accessToken: string): string =>
	`async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/${model.id}",
		{
			headers: {
				Authorization: "Bearer ${accessToken || `{API_TOKEN}`}"
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({"inputs": ${getModelInputSnippet(
		model
	)}, "parameters": {"candidate_labels": ["refund", "legal", "faq"]}}).then((response) => {
	console.log(JSON.stringify(response));
});`;

export const snippetTextToImage = (model: ModelDataMinimal, accessToken: string): string =>
	`async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/${model.id}",
		{
			headers: {
				Authorization: "Bearer ${accessToken || `{API_TOKEN}`}"
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.blob();
	return result;
}
query({"inputs": ${getModelInputSnippet(model)}}).then((response) => {
	// Use image
});`;

export const snippetTextToAudio = (model: ModelDataMinimal, accessToken: string): string => {
	const commonSnippet = `async function query(data) {
		const response = await fetch(
			"https://api-inference.huggingface.co/models/${model.id}",
			{
				headers: {
					Authorization: "Bearer ${accessToken || `{API_TOKEN}`}"
					"Content-Type": "application/json",
				},
				method: "POST",
				body: JSON.stringify(data),
			}
		);`;
	if (model.library_name === "transformers") {
		return (
			commonSnippet +
			`
			const result = await response.blob();
			return result;
		}
		query({"inputs": ${getModelInputSnippet(model)}}).then((response) => {
			// Returns a byte object of the Audio wavform. Use it directly!
		});`
		);
	} else {
		return (
			commonSnippet +
			`
			const result = await response.json();
			return result;
		}
		
		query({"inputs": ${getModelInputSnippet(model)}}).then((response) => {
			console.log(JSON.stringify(response));
		});`
		);
	}
};

export const snippetFile = (model: ModelDataMinimal, accessToken: string): string =>
	`async function query(filename) {
	const data = fs.readFileSync(filename);
	const response = await fetch(
		"https://api-inference.huggingface.co/models/${model.id}",
		{
			headers: {
				Authorization: "Bearer ${accessToken || `{API_TOKEN}`}"
				"Content-Type": "application/json",
			},
			method: "POST",
			body: data,
		}
	);
	const result = await response.json();
	return result;
}

query(${getModelInputSnippet(model)}).then((response) => {
	console.log(JSON.stringify(response));
});`;

export const jsSnippets: Partial<Record<PipelineType, (model: ModelDataMinimal, accessToken: string) => string>> = {
	// Same order as in js/src/lib/interfaces/Types.ts
	"text-classification": snippetBasic,
	"token-classification": snippetBasic,
	"table-question-answering": snippetBasic,
	"question-answering": snippetBasic,
	"zero-shot-classification": snippetZeroShotClassification,
	translation: snippetBasic,
	summarization: snippetBasic,
	"feature-extraction": snippetBasic,
	"text-generation": snippetBasic,
	"text2text-generation": snippetBasic,
	"fill-mask": snippetBasic,
	"sentence-similarity": snippetBasic,
	"automatic-speech-recognition": snippetFile,
	"text-to-image": snippetTextToImage,
	"text-to-speech": snippetTextToAudio,
	"text-to-audio": snippetTextToAudio,
	"audio-to-audio": snippetFile,
	"audio-classification": snippetFile,
	"image-classification": snippetFile,
	"image-to-text": snippetFile,
	"object-detection": snippetFile,
	"image-segmentation": snippetFile,
};

export function getJsInferenceSnippet(model: ModelDataMinimal, accessToken: string): string {
	return model.pipeline_tag && model.pipeline_tag in jsSnippets
		? jsSnippets[model.pipeline_tag]?.(model, accessToken) ?? ""
		: "";
}

export function hasJsInferenceSnippet(model: ModelDataMinimal): boolean {
	return !!model.pipeline_tag && model.pipeline_tag in jsSnippets;
}
