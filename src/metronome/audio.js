import { useMemo } from "react";

const NOTE_LENGTH = 0.05;
const SUB_FREQUENCY = 440;
const SUB_VOLUME = 0.5;
const BEAT_FREQUENCY = 880;
const BEAT_VOLUME = 1;

const play = (frequency, volume, scale, audioContext) => (nextNoteTime) => {
  const osc = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  osc.connect(gainNode);
  gainNode.connect(audioContext.destination);
  osc.frequency.setTargetAtTime(frequency, audioContext.currentTime, scale);
  gainNode.gain.setTargetAtTime(volume, audioContext.currentTime, 0.001);
  osc.start(nextNoteTime);
  osc.stop(nextNoteTime + NOTE_LENGTH);
};

export const useAudio = () => {
  const audioContext = useMemo(
    () => new (window.AudioContext || window.webkitAudioContext)(),
    []
  );

  const playSub = useMemo(
    () => play(SUB_FREQUENCY, SUB_VOLUME, 0.001, audioContext),
    [audioContext]
  );

  const playBeat = useMemo(
    () => play(BEAT_FREQUENCY, BEAT_VOLUME, 0.0001, audioContext),
    [audioContext]
  );

  return {
    context: audioContext,
    playSub,
    playBeat,
  };
};
