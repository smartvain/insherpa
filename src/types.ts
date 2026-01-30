import type { SlashCommand, RespondFn } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";

export interface IncidentKnowledge {
  title: string;
  symptoms: string;
  cause: string;
  resolution: string;
  severity: "monitor" | "action_required" | "critical";
  occurred_at: string;
  responder: string;
  services: string[];
  error_message: string;
}

export interface SearchResult {
  title: string;
  resolution: string;
  url: string;
  severity: string;
  occurred_at: string;
}

export interface SummaryCommandArgs {
  command: SlashCommand;
  respond: RespondFn;
  client: WebClient;
}

export interface SearchCommandArgs {
  keyword: string;
  respond: RespondFn;
  client: WebClient;
}
