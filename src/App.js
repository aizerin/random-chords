import React, { useState, useLayoutEffect, useRef } from "react";
import { useMetronome } from "./metronome/metronome";
import IconButton from "@material-ui/core/IconButton";
import Slider from "@material-ui/core/Slider";
import PlayCircleFilledIcon from "@material-ui/icons/PlayCircleFilled";
import PauseCircleFilledIcon from "@material-ui/icons/PauseCircleFilled";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
import EditIcon from "@material-ui/icons/Edit";
import CheckIcon from "@material-ui/icons/Check";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Typography from "@material-ui/core/Typography";
import { ChordBox } from "vexchords";
import chords from "./chords";

const ChordCanvas = ({ chord }) => {
  useLayoutEffect(() => {
    const selectedChord = chord
      ? chords[chord]
      : { chord: [], position: 0, barres: [] };
    if (!selectedChord) {
      throw new Error("cannot find chord");
    }
    const chordbox = new ChordBox("#chord-canvas", {
      width: 400,
      height: 400,
    });
    chordbox.draw(selectedChord);
  }, [chord]);
  return <div id="chord-canvas" key={chord} />;
};

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    marginTop: theme.spacing(5),
    maxHeight: 800,
    minHeight: 800,
  },
  icon: {
    "& svg": {
      fontSize: 100,
    },
  },
  center: {
    textAlign: "center",
  },
  slider: {
    paddingTop: theme.spacing(6),
  },
  variations: {
    maxHeight: 300,
    minHeight: 300,
    overflow: "auto",
  },
  display: {
    textAlign: "center",
    marginTop: theme.spacing(5),
    maxHeight: 800,
    minHeight: 800,
  },
}));

const parsePreset = (preset) => {
  const [label, tempo, beat, chords] = preset.split(";");
  return {
    label,
    tempo: Number(tempo),
    beat: Number(beat),
    chords: chords.split(","),
  };
};

const App = () => {
  const classes = useStyles();
  const [presets, setPresets] = useState(["test1;150;4;Cmaj,Dmaj,A7,D7"]);
  const [addTextField, setAddTextField] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [edit, setEdit] = useState(null);
  const [chordsToPlay, setChordsToPlay] = useState(null);
  const firstBeatTimes = useRef(0);
  const { state, stop, start, changeTempo, changeBeat } = useMetronome({
    tempo: 120,
    onTick: (firstBeat) => {
      if (firstBeat) {
        firstBeatTimes.current = firstBeatTimes.current + 1;
      }
      if (firstBeat && firstBeatTimes.current > 2) {
        const [head, ...tail] = chordsToPlay;
        setChordsToPlay([...tail, head]);
      }
    },
  });

  return (
    <div>
      <Grid container spacing={3}>
        <Grid item xs={3}>
          <Paper className={classes.paper}>
            <Grid container>
              <Grid item xs={12}>
                <TextField
                  label="Add - label:tempo;beat;C,D,G"
                  fullWidth
                  value={addTextField}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => {
                            if (edit !== null) {
                              setEdit(null);
                              setPresets(
                                presets.map((el, index) => {
                                  if (index === edit) {
                                    return addTextField;
                                  }
                                  return el;
                                })
                              );
                            } else {
                              setPresets([...presets, addTextField]);
                            }
                            setAddTextField("");
                          }}
                        >
                          {edit !== null ? <CheckIcon /> : <AddIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  onChange={(event) => setAddTextField(event.target.value)}
                />
              </Grid>
              <Grid item xs={12} className={classes.variations}>
                <List>
                  {presets.map((item, index) => (
                    <ListItem
                      button
                      selected={selectedPreset === index}
                      onClick={() => {
                        const parsedPreset = parsePreset(item);
                        if (state.playing) {
                          stop();
                        }
                        changeBeat(parsedPreset.beat);
                        changeTempo(parsedPreset.tempo);
                        setSelectedPreset(index);
                      }}
                      key={item}
                    >
                      <ListItemText primary={item} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            setAddTextField(item);
                            setEdit(index);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            setPresets([
                              ...presets.slice(0, index),
                              ...presets.slice(index + 1),
                            ]);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12}>
                <Slider
                  className={classes.slider}
                  value={state.tempo}
                  valueLabelDisplay="on"
                  min={40}
                  max={240}
                  onChange={(event, value) => changeTempo(value)}
                />
              </Grid>
              <Grid item xs={12} className={classes.center}>
                <Select
                  value={state.beatsPerMeasure}
                  onChange={(event) => changeBeat(event.target.value)}
                >
                  <MenuItem value={3}>3/3</MenuItem>
                  <MenuItem value={4}>4/4</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} className={classes.center}>
                <IconButton
                  onClick={() => {
                    if (state.playing) {
                      stop();
                    } else {
                      const parsedPreset = parsePreset(presets[selectedPreset]);
                      firstBeatTimes.current = 0;
                      start();
                      setChordsToPlay(parsedPreset.chords);
                    }
                  }}
                  className={classes.icon}
                >
                  {state.playing ? (
                    <PauseCircleFilledIcon />
                  ) : (
                    <PlayCircleFilledIcon />
                  )}
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper>
            <Grid
              className={classes.display}
              container
              direction="column"
              justify="center"
              alignItems="center"
            >
              <Grid item>
                <Typography variant="h5" gutterBottom>
                  {state.beat}/{state.beatsPerMeasure}
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="h1" gutterBottom>
                  {firstBeatTimes.current <= 1 ? "-" : chordsToPlay?.[0] || "-"}
                </Typography>
              </Grid>
              <Grid item>
                <ChordCanvas
                  chord={firstBeatTimes.current > 1 && chordsToPlay?.[0]}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default App;
