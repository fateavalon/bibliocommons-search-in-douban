import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { DEFAULT_FILTERS, type FilterState } from "../types";

type Action =
  | { type: "SET"; payload: Partial<FilterState> }
  | { type: "CLEAR" };

function reducer(state: FilterState, action: Action): FilterState {
  switch (action.type) {
    case "SET":
      return { ...state, ...action.payload };
    case "CLEAR":
      return { ...DEFAULT_FILTERS };
    default:
      return state;
  }
}

const Ctx = createContext<FilterState>(DEFAULT_FILTERS);
const DispatchCtx = createContext<Dispatch<Action>>(() => {});

export function FilterProvider({
  children,
  initialOverrides,
}: {
  children: ReactNode;
  initialOverrides?: Partial<FilterState>;
}) {
  const [state, dispatch] = useReducer(reducer, {
    ...DEFAULT_FILTERS,
    ...initialOverrides,
  });
  return (
    <Ctx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </Ctx.Provider>
  );
}

export function useFilters() {
  return useContext(Ctx);
}

export function useFilterDispatch() {
  return useContext(DispatchCtx);
}
