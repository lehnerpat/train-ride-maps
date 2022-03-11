import { SetState, UseState } from "./UseState";

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
