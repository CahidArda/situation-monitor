import type { ContentEntity, DirectMessage, DMConversation, DMType, DMMetadata } from "./types";

export interface DMInterface {
  /** Send a DM (called by event handlers). */
  send(params: {
    fromPersonaId: string;
    content: string;
    type: DMType;
    entities?: ContentEntity[];
    metadata?: DMMetadata;
  }): Promise<DirectMessage>;

  /** List conversations (unique personas with their latest message). */
  listConversations(): Promise<DMConversation[]>;

  /** List messages in a conversation, newest first. */
  listMessages(
    personaId: string,
    params?: { limit?: number; beforeTs?: number },
  ): Promise<{ messages: DirectMessage[]; hasMore: boolean }>;
}
