import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DMConversation, DirectMessage } from "@/lib/interfaces/types";

type DMStore = {
  conversations: DMConversation[];
  messages: Record<string, DirectMessage[]>;
  readTimestamps: Record<string, number>;
  openConversations: string[]; // persona IDs pinned in the bottom bar

  setConversations: (data: DMConversation[]) => void;
  setMessages: (personaId: string, messages: DirectMessage[]) => void;
  markRead: (personaId: string) => void;
  getUnreadCount: (personaId: string) => number;
  getTotalUnread: () => number;
  openConversation: (personaId: string) => void;
  closeConversation: (personaId: string) => void;
};

export const useDMStore = create<DMStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      readTimestamps: {},
      openConversations: [],

      setConversations: (data) => {
        const state = get();
        const prevMap = new Map(
          state.conversations.map((c) => [c.personaId, c.lastTimestamp]),
        );
        // Only auto-open conversations with genuinely NEW messages
        // (lastTimestamp increased since last poll)
        const newOpen = [...state.openConversations];
        for (const convo of data) {
          const prevTs = prevMap.get(convo.personaId) ?? 0;
          if (
            convo.lastTimestamp > prevTs &&
            prevTs > 0 && // don't open on first load
            !newOpen.includes(convo.personaId)
          ) {
            newOpen.push(convo.personaId);
          }
        }
        set({ conversations: data, openConversations: newOpen });
      },

      setMessages: (personaId, messages) =>
        set((state) => ({
          messages: { ...state.messages, [personaId]: messages },
        })),

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

      openConversation: (personaId) =>
        set((state) => ({
          openConversations: state.openConversations.includes(personaId)
            ? state.openConversations
            : [...state.openConversations, personaId],
        })),

      closeConversation: (personaId) =>
        set((state) => ({
          openConversations: state.openConversations.filter(
            (id) => id !== personaId,
          ),
        })),
    }),
    {
      name: "mts:dms",
      partialize: (state) => ({
        readTimestamps: state.readTimestamps,
        openConversations: state.openConversations,
      }),
    },
  ),
);
