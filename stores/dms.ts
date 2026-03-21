import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DMConversation, DirectMessage } from "@/lib/interfaces/types";

type DMStore = {
  conversations: DMConversation[];
  activeConversation: string | null;
  messages: Record<string, DirectMessage[]>;
  readTimestamps: Record<string, number>;

  setConversations: (data: DMConversation[]) => void;
  setMessages: (personaId: string, messages: DirectMessage[]) => void;
  setActiveConversation: (personaId: string | null) => void;
  markRead: (personaId: string) => void;
  getUnreadCount: (personaId: string) => number;
  getTotalUnread: () => number;
};

export const useDMStore = create<DMStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversation: null,
      messages: {},
      readTimestamps: {},

      setConversations: (data) => set({ conversations: data }),

      setMessages: (personaId, messages) =>
        set((state) => ({
          messages: { ...state.messages, [personaId]: messages },
        })),

      setActiveConversation: (personaId) =>
        set({ activeConversation: personaId }),

      markRead: (personaId) =>
        set((state) => ({
          readTimestamps: {
            ...state.readTimestamps,
            [personaId]: Date.now(),
          },
        })),

      getUnreadCount: (personaId) => {
        const state = get();
        const lastRead = state.readTimestamps[personaId] ?? 0;
        const convo = state.conversations.find(
          (c) => c.personaId === personaId,
        );
        if (!convo) return 0;
        return convo.lastTimestamp > lastRead ? 1 : 0;
      },

      getTotalUnread: () => {
        const state = get();
        return state.conversations.reduce((total, convo) => {
          const lastRead = state.readTimestamps[convo.personaId] ?? 0;
          return total + (convo.lastTimestamp > lastRead ? 1 : 0);
        }, 0);
      },
    }),
    {
      name: "mts:dms",
      partialize: (state) => ({ readTimestamps: state.readTimestamps }),
    },
  ),
);
