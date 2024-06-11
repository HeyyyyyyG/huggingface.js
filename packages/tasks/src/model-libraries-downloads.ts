/**
 * This file contains the (simplified) types used
 * to represent queries that are made to Elastic
 * in order to count number of model downloads
 *
 * Read this doc about download stats on the Hub:
 *
 * https://huggingface.co/docs/hub/models-download-stats
 *
 * see also:
 * https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html
 */

export type ElasticField = "path" | "path_extension" | "path_prefix" | "path_filename";

export type ElasticBoolQueryFilter =
	// match a single filename
	| { term?: Partial<{ [k in ElasticField]: string }> }
	// match multiple possible filenames
	| { terms?: Partial<{ [k in ElasticField]: string[] }> }
	// match a wildcard
	| { wildcard?: Partial<{ [k in Extract<ElasticField, "path_filename">]: string }> }
	| { exists: { field: ElasticField } };
