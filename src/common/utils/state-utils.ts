import { Dispatch, SetStateAction, useMemo, useState } from "react";

export type SetState<S> = Dispatch<SetStateAction<S>>;
export type UseState<S> = [S, SetState<S>];

export function pickState<S, P extends keyof S>(state: UseState<S>, p: P): UseState<S[P]> {
  const [currentState, setState] = state;
  const picked = currentState[p];
  const setPicked: SetState<S[P]> = (newPicked) =>
    setState((prevState) => {
      const newP = typeof newPicked === "function" ? (newPicked as (prevState: S[P]) => S[P])(prevState[p]) : newPicked;
      return {
        ...prevState,
        [p]: newP,
      };
    });
  return [picked, setPicked];
}

export function useMemoState<S>(initialState: S | (() => S)): UseState<S> {
  const s = useState(initialState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => s, s);
}

export function usePickedState<S, P extends keyof S>(state: UseState<S>, p: P): UseState<S[P]> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => pickState(state, p), [...state, p]);
}
