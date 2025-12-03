export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  tokens?: number;
  title?: string;
  details?: string;
};

export interface ChatResponse {
  sql: string;
  query_summary: Querysummary;
  md_summary: string;
  tables_used: string[];
  question: string;
  validation: Validation;
  explanations: null;
  intent_analysis: null;
  clarification_analysis: null;
  metadata: Metadata;
  needs_conversational_clarification: boolean;
  clarification_message: null;
  execution_results: null;
  data?: Array<Record<string, unknown>>;
  row_count?: number;
  status?: string;
  error_message?: string | null;
  retry_count?: number;
}

interface Metadata {
  processing_time: number;
  model_used: string;
  tables_considered: number;
  has_conversation_context: boolean;
}

interface Validation {
  syntax: Syntax;
  schema: Schema;
}

interface Schema {
  is_valid: boolean;
  errors: any[];
  warnings: string[];
}

interface Syntax {
  is_valid: boolean;
  errors: string[];
  warnings: any[];
}

interface Querysummary {
  raw_columns: string[];
  tables_used: string[];
  filters_applied: string;
  aggregations: string;
  sorting_limits: string;
}