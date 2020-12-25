import { useRef, useMemo, useEffect } from "react";
import intervalWorker from "./interval.worker";

const TICKS_PER_BEAT_TERNARY = 12;
const SECONDS_IN_MINUTE = 60;
const SCHEDULE_AHEAD_TIME = 0.1;

export const ACTION_START = "START";
export const ACTION_STOP = "STOP";
export const ACTION_UPDATE = "UPDATE";
export const ACTION_TICK = "TICK";

export const useIntervalWorker = ({ audio, state, onTick, setState }) => {
  const nextNoteTime = useRef(0);
  const currentBeat = useRef(0);
  const worker = useMemo(() => new Worker(intervalWorker), []);
  useEffect(() => {
    worker.onmessage = (event) => {
      if (event.data === ACTION_TICK) {
        while (
          nextNoteTime.current <
          audio.context.currentTime + SCHEDULE_AHEAD_TIME
        ) {
          const isFirstBeat = currentBeat.current === 0;
          const isQuarterBeat =
            currentBeat.current %
              (TICKS_PER_BEAT_TERNARY / state.beatsPerMeasure) ===
            0;

          if (isFirstBeat || isQuarterBeat) {
            isFirstBeat
              ? audio.playBeat(nextNoteTime.current)
              : audio.playSub(nextNoteTime.current);
            onTick(isFirstBeat);
            setState((state) => ({
              ...state,
              beat:
                state.beat === state.beatsPerMeasure ? 1 : state.beat + 1 || 1,
              subBeat: state.subBeat === 1 ? 1 : state.subBeat + 1 || 1,
            }));
          }

          const secondsPerBeat = SECONDS_IN_MINUTE / state.tempo;
          nextNoteTime.current +=
            (state.beatsPerMeasure / TICKS_PER_BEAT_TERNARY) * secondsPerBeat;
          currentBeat.current++;

          if (currentBeat.current === TICKS_PER_BEAT_TERNARY) {
            currentBeat.current = 0;
          }
        }
      }
    };
  }, [
    audio,
    onTick,
    setState,
    state.beatsPerMeasure,
    state.tempo,
    worker.onmessage,
  ]);
  useEffect(
    () => () => {
      worker.postMessage({
        action: ACTION_STOP,
      });
    },
    [worker]
  );
  return { worker, nextNoteTime, currentBeat };
};
