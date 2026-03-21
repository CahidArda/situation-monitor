import type { z } from "zod";
import type { WorkflowContext } from "@upstash/workflow";

/** What every handler returns. */
export interface EventResult {
  followUpEvents: Array<{
    eventName: string;
    metadata: unknown;
    delaySeconds?: number;
  }>;
}

/** Every event in the registry has this shape. */
export interface EventDefinition<T extends z.ZodType> {
  name: string;
  description: string;
  schema: T;
  handler: (
    ctx: WorkflowContext,
    metadata: z.infer<T>,
  ) => Promise<EventResult>;
}

/** Seed events are entry points selected by the periodic trigger. */
export interface SeedEventDefinition<T extends z.ZodType>
  extends EventDefinition<T> {
  weight: number;
  cooldownSeconds: number;
  requiredConditions?: () => Promise<boolean>;
}
