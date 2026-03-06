import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DraftState, StepId } from '@/types/pipeline';

function sanitizeDraftForStorage(draft: DraftState): DraftState {
  if (!draft.imagesResult) {
    return draft;
  }

  return {
    ...draft,
    imagesResult: {
      ...draft.imagesResult,
      images: draft.imagesResult.images.map((image) => {
        if (image.url.startsWith('data:')) {
          return {
            ...image,
            url: '',
          };
        }

        return image;
      }),
    },
  };
}

interface DraftStore {
  drafts: DraftState[];
  currentDraftId: string | null;

  createDraft: (keyword: string) => DraftState;
  getDraft: (id: string) => DraftState | undefined;
  updateDraft: (id: string, updates: Partial<DraftState>) => void;
  deleteDraft: (id: string) => void;
  setCurrentDraft: (id: string | null) => void;
  updateStepOutput: <K extends Extract<keyof DraftState, StepId>>(
    draftId: string,
    step: K,
    output: DraftState[K]
  ) => void;
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      drafts: [],
      currentDraftId: null,

      createDraft: (keyword: string) => {
        const draft: DraftState = {
          id: crypto.randomUUID(),
          keyword,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'draft',
          currentStep: null,
        };

        set((state) => ({
          drafts: [...state.drafts, draft],
          currentDraftId: draft.id,
        }));

        return draft;
      },

      getDraft: (id: string) => {
        return get().drafts.find((d) => d.id === id);
      },

      updateDraft: (id: string, updates: Partial<DraftState>) => {
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
          ),
        }));
      },

      deleteDraft: (id: string) => {
        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== id),
          currentDraftId: state.currentDraftId === id ? null : state.currentDraftId,
        }));
      },

      setCurrentDraft: (id: string | null) => {
        set({ currentDraftId: id });
      },

      updateStepOutput: (draftId, step, output) => {
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === draftId ? { ...d, [step]: output, updatedAt: new Date() } : d
          ),
        }));
      },
    }),
    {
      name: 'blog-autopilot-drafts',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        drafts: state.drafts.map((draft) => sanitizeDraftForStorage(draft)),
        currentDraftId: state.currentDraftId,
      }),
    }
  )
);
