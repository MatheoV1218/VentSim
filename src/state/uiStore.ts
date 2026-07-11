import { create } from "zustand";

interface UiStore {
  selectedVentilatorId: string | null;
  selectVentilator: (id: string | null) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  selectedVentilatorId: null,
  selectVentilator: (id) => set({ selectedVentilatorId: id }),
}));
