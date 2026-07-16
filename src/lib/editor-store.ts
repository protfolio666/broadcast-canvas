import { create } from "zustand";

export type LayerType = "text" | "image" | "rect";

export type Binding =
  | { source: "static" }
  | { source: "sheet"; connectionId: string; column: string; row: number };

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  hidden: boolean;
  // text
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  align?: "left" | "center" | "right";
  stroke?: string;
  strokeWidth?: number;
  textShadow?: string;
  // image
  src?: string;
  fit?: "cover" | "contain" | "fill";
  // rect
  fill?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  // binding
  binding?: Binding;
}

interface EditorState {
  pageId: string | null;
  background: string | null;
  layers: Layer[];
  selectedId: string | null;
  history: Layer[][];
  future: Layer[][];
  dirty: boolean;

  init: (pageId: string, background: string | null, layers: Layer[]) => void;
  addLayer: (l: Layer) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  select: (id: string | null) => void;
  reorder: (id: string, delta: number) => void;
  setBackground: (url: string | null) => void;
  markSaved: () => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

export const useEditor = create<EditorState>((set, get) => ({
  pageId: null,
  background: null,
  layers: [],
  selectedId: null,
  history: [],
  future: [],
  dirty: false,

  init: (pageId, background, layers) =>
    set({ pageId, background, layers, selectedId: null, history: [], future: [], dirty: false }),

  pushHistory: () =>
    set((s) => ({ history: [...s.history.slice(-49), clone(s.layers)], future: [] })),

  addLayer: (l) => {
    get().pushHistory();
    set((s) => ({ layers: [...s.layers, l], selectedId: l.id, dirty: true }));
  },

  updateLayer: (id, patch) => {
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      dirty: true,
    }));
  },

  deleteLayer: (id) => {
    get().pushHistory();
    set((s) => ({
      layers: s.layers.filter((l) => l.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      dirty: true,
    }));
  },

  duplicateLayer: (id) => {
    const src = get().layers.find((l) => l.id === id);
    if (!src) return;
    get().pushHistory();
    const nl: Layer = { ...clone(src), id: crypto.randomUUID(), x: src.x + 20, y: src.y + 20, name: src.name + " copy" };
    set((s) => ({ layers: [...s.layers, nl], selectedId: nl.id, dirty: true }));
  },

  select: (id) => set({ selectedId: id }),

  reorder: (id, delta) => {
    get().pushHistory();
    set((s) => {
      const idx = s.layers.findIndex((l) => l.id === id);
      if (idx < 0) return s;
      const target = Math.max(0, Math.min(s.layers.length - 1, idx + delta));
      if (target === idx) return s;
      const arr = [...s.layers];
      const [item] = arr.splice(idx, 1);
      arr.splice(target, 0, item);
      return { layers: arr, dirty: true };
    });
  },

  setBackground: (url) => {
    set({ background: url, dirty: true });
  },

  markSaved: () => set({ dirty: false }),

  undo: () => {
    const { history, layers } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set((s) => ({
      history: history.slice(0, -1),
      future: [...s.future, clone(layers)],
      layers: prev,
      dirty: true,
    }));
  },

  redo: () => {
    const { future, layers } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    set((s) => ({
      future: future.slice(0, -1),
      history: [...s.history, clone(layers)],
      layers: next,
      dirty: true,
    }));
  },
}));

export function newLayer(type: LayerType): Layer {
  const base = {
    id: crypto.randomUUID(),
    x: 200,
    y: 200,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
  };
  if (type === "text")
    return {
      ...base,
      type,
      name: "Text",
      w: 400,
      h: 80,
      text: "TEAM NAME",
      fontSize: 48,
      fontWeight: 700,
      fontFamily: "Chakra Petch",
      color: "#ffffff",
      align: "left",
      binding: { source: "static" },
    };
  if (type === "image")
    return {
      ...base,
      type,
      name: "Image",
      w: 200,
      h: 200,
      src: "",
      fit: "contain",
      binding: { source: "static" },
    };
  return {
    ...base,
    type: "rect",
    name: "Rectangle",
    w: 300,
    h: 200,
    fill: "rgba(0,240,255,0.15)",
    borderColor: "#00f0ff",
    borderWidth: 2,
    borderRadius: 8,
  };
}
