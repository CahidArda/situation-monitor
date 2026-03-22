import type { WorkflowContext } from "@upstash/workflow";

/** A seed event — the entry point for a chain. The handler runs the entire chain. */
export interface SeedEventDefinition {
  name: string;
  description: string;
  weight: number;
  cooldownTicks: number;
  requiredConditions?: () => Promise<boolean>;
  handler: (ctx: WorkflowContext) => Promise<void>;
}
