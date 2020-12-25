import { useState, useCallback } from "react";
import {
  useIntervalWorker,
  ACTION_START,
  ACTION_STOP,
  ACTION_UPDATE,
} from "./interval";
import { useAudio } from "./audio";

const noop = () => {};

const useChangeTempo = ({ setState, interval }) =>
  useCallback(
    (tempo) => {
      interval.worker.postMessage({
        action: ACTION_UPDATE,
      });

      setState((state) => ({
        ...state,
        tempo,
      }));
    },
    [interval.worker, setState]
  );

const useStart = ({ audio, setState, interval }) =>
  useCallback(() => {
    interval.currentBeat.current = 0;
    interval.nextNoteTime.current = audio.context.currentTime;

    interval.worker.postMessage({
      action: ACTION_START,
    });

    setState((state) => ({
      ...state,
      beat: 0,
      playing: true,
    }));
  }, [
    audio.context.currentTime,
    interval.currentBeat,
    interval.nextNoteTime,
    interval.worker,
    setState,
  ]);

const useStop = ({ setState, interval }) =>
  useCallback(() => {
    interval.worker.postMessage({
      action: ACTION_STOP,
    });

    setState((state) => ({
      ...state,
      playing: false,
    }));
  }, [interval.worker, setState]);

export const useMetronome = ({
  tempo = 120,
  beatsPerMeasure = 4,
  render,
  onTick = noop,
}) => {
  const [state, setState] = useState({
    beat: 0,
    subBeat: 0,
    playing: false,
    tempo,
    beatsPerMeasure,
  });
  const audio = useAudio();
  const interval = useIntervalWorker({
    audio,
    state,
    setState,
    onTick,
  });

  return {
    state,
    changeTempo: useChangeTempo({ setState, interval }),
    changeBeat: (beatsPerMeasure) =>
      setState((state) => ({ ...state, beatsPerMeasure })),
    start: useStart({ interval, setState, audio }),
    stop: useStop({ interval, setState }),
  };
};
