import { useState, useEffect, useRef } from 'react';

import { Link, useLocation } from 'react-router-dom';

import { Button, Space, Switch, Select } from 'antd';
import { SnackbarProvider, enqueueSnackbar } from 'notistack';

import E from '../common/errors.js';
import ProgressBar from '../common/progressBar.js';
import { Image, Video } from './components/image.js';

import { randomChoice, nextN } from '../common/utils.js';

import './folder.css';

export default function Folder() {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [progressBarIsLoading, setProgressBarIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [progressBackground, setProgressBackground] = useState('#0080ff');
  const [recentPaths, setRecentPaths] = useState([]);
  const [currentFiles, setCurrentFiles] = useState([]);
  const [timeouts, setTimeouts] = useState([]);
  const [chosenFiles, setChosenFiles] = useState([]);
  const [direction, setDirection] = useState('horizontal');
  const [speed, setSpeed] = useState(3);
  const [numberOfItems, setNumberOfItems] = useState(3);
  const [selectionMethod, setSelectionMethod] = useState('Randomized');

  const funcToUse = {
    Randomized: randomChoice,
    Ordered: nextN,
  };

  let { state } = useLocation();

  const runProgressBar = (n, bgc) => {
    console.log(`running progress bar with ${n}`);

    setProgressBarIsLoading(true);
    setLoadingProgress(0);
    setProgressBackground(bgc);

    const interval = setInterval(() => {
      setLoadingProgress((progress) => progress + n / 2);
    }, 30);

    // 10000/n
    // when n = 50 => 10000/50 = 200, so 300 in total
    setTimeout(() => {
      clearInterval(interval);
      setProgressBarIsLoading(false);
    }, 10000 / n + 300);
  };

  const startTimeout = (
    speed,
    numberOfItems,
    selectionMethod,
    index,
    lag = false
  ) => {
    // clear any existing timeout
    stopTimeout();

    let sFunc;
    let items;

    if (selectionMethod in funcToUse) {
      sFunc = funcToUse[selectionMethod];
    } else {
      sFunc = funcToUse.Randomized;
    }

    if (lag) {
      items = [...chosenFiles];
      // eslint-disable-next-line no-param-reassign
      index = currentFiles.indexOf(items[0]) - 1;
    } else {
      items = sFunc(currentFiles, numberOfItems, index);
    }

    setChosenFiles([...items]);

    // create a new timeout that calls itself recursively
    const id = setTimeout(() => {
      const items = sFunc(
        currentFiles,
        numberOfItems,
        (index + 1 + numberOfItems) % currentFiles.length
      );

      console.log(`
      timeouts : ${timeouts}
      currentFiles.length : ${currentFiles.length}
      speed : ${speed}
      n of items : ${numberOfItems}
      selectionMethod: ${selectionMethod}
      items : ${items}
      `);

      setChosenFiles([...items]);

      // call startTimeout again with the same speed
      startTimeout(
        speed,
        numberOfItems,
        selectionMethod,
        index + numberOfItems
      );
    }, speed * 1000);

    setTimeouts((prev) => [id, ...prev]);
  };

  const stopTimeout = () => {
    // clear the timeout and reset the timeout ID
    timeouts.forEach(clearTimeout);
    setTimeouts(() => []);

    console.log(`

    stopping timeout

      stopping timeouts ${timeouts}
      selectedImage: ${selectedImage}
    `);
  };

  const getLast = (cfiles, files) => {
    if (files.length === 0) {
      return 0;
    }

    return cfiles.indexOf(files.slice(-1)[0]);
  };

  const toggleDirection = () => {

    const newD = direction === 'horizontal' ? 'vertical' : 'horizontal';

    enqueueSnackbar(`Items will now be be displayed ${newD}.`, {
      variant: 'success',
    });

    setDirection((prev) => (newD));

  };

  const handleSpeedChange = (value) => {
    console.log(`
    hadling speed change: new speed is ${value}
    `);

    stopTimeout();
    setSpeed(() => value);
    startTimeout(
      value,
      numberOfItems,
      selectionMethod,
      getLast(currentFiles, chosenFiles)
    );

    enqueueSnackbar(`Transition speed changed to ${value} seconds.`, {
      variant: 'success',
    });

  };

  const handleNumberChange = (value) => {
    console.log(`
    hadling number change: new number of items is ${value}
    `);
    stopTimeout();
    setNumberOfItems(() => value);
    startTimeout(
      speed,
      value,
      selectionMethod,
      getLast(currentFiles, chosenFiles)
    );

    enqueueSnackbar(`Number of items to be displayed changed to ${value}.`, {
      variant: 'success',
    });

  };

  const handleSelectionMethodChange = (value) => {
    console.log(`
    handling selection Method change: new selection method is ${value}
    `);
    stopTimeout();
    setSelectionMethod(() => value);
    startTimeout(
      speed,
      numberOfItems,
      value,
      getLast(currentFiles, chosenFiles)
    );

    enqueueSnackbar(`Selection method changed to ${value}.`, {
      variant: 'success',
    });

  };

  /* useEffect related funcs */

  useEffect(() => {
    updateRecentPaths(state);
    getFilePathsFromDirectory(state.fpath);
  }, [state]);

  useEffect(() => {
    if (timeouts !== []) {
      stopTimeout()
    }

    startTimeout(speed, numberOfItems, selectionMethod, chosenFiles);
    return stopTimeout;
  }, [currentFiles]);

  function updateRecentPaths(pathData) {
    /*

       Gets recent_paths then sets/updates it.

    */

    runProgressBar(50, '#0080ff');

    console.log('updating recent paths');

    electron.eAPI
      .getRecentPaths()
      .then((result) => {
        console.log('result of getRecentPaths', result);

        setRecentPaths(result);
      })
      .then(() => {
        setRecentPaths((oldArray) => {
          let new_recent;

          if (oldArray.filter((e) => e.fpath === pathData.fpath) === 0) {
            new_recent = [pathData, ...oldArray].slice(0, 4);

            console.log('newArray1', new_recent);
          } else {
            console.log('already in recent paths');

            oldArray = oldArray.filter((item) => item.fpath !== pathData.fpath);

            new_recent = [pathData, ...oldArray].slice(0, 4);

            console.log('newArray2', new_recent);
          }

          //console.log("setting", new_recent);
          electron.eAPI.setStoreValue('recent_paths', new_recent);

          console.log('set recent paths', oldArray, new_recent);

          return new_recent;
        });
      })
      .catch((err) => {
        const emsg = `
            Error: API : updating recent paths

            Failed to update recent paths when viewing a folder.

            ${err}

            `;

        console.log(E(emsg));
      });
  }

  function getFilePathsFromDirectory(path) {
    console.log('getting files', path);

    electron.eAPI
      .getDirFilepaths(path)
      .then((result) => {
        setCurrentFiles(result);

        const items = funcToUse[selectionMethod ?? 'Randomized'](
          result,
          3,
          chosenFiles
        );

        console.log('getDirFilePaths', currentFiles.length, items);

        setChosenFiles(items);

        console.log('result of getDirFilepaths', result);
      })
      .catch((err) => {
        const emsg = `
          Error : API : getFilePathsFromDirectory

          Failed to read files in the directory path ${path}.

          ${err}

          `;

        console.log(E(emsg));
      });
  }

  function openDirectory() {
    runProgressBar(50, '#fff');

    console.log('opening directory...');

    electron.eAPI
      .openDirectory(state.fpath)
      .then(() => {
        console.log('should have opened dir');
      })
      .catch((err) => {
        const emsg = `
          Error : API : openDirectory

          Failed to open the directory ${state.fpath}

          ${err}
          `;
      });
  }

  function moveFileToDir(e) {
    runProgressBar(50, '#0080ff');

    console.log(`
      fpath : ${JSON.stringify(e.target.parentElement.dataset.fpath)}
    `);

    const { dir } = e.target.parentElement.dataset;
    const fpath = e.target.parentElement.dataset.fpath.substring(7);
    const actionType = e.target.parentElement.dataset.action;

    console.log('moveFileToDir:', {
      dir,
      fpath,
      actionType,
    });

    if (actionType === 'move') {
      console.log(
        `moved file so removing it from current images being filtered..`
      );

      setCurrentFiles(currentFiles.filter((fp) => fp !== fpath));
    }

    electron.eAPI
      .moveFileToDir(fpath, dir, actionType)
      .catch((error) => {
        console.log(`
        ERROR:

        ${error}
        `)
      });

    enqueueSnackbar(`${actionType} ${fpath} to the ${dir} folder in the same directory.`, {
      variant: 'success',
    });

  }

  const clearSelectedImage = () => {
    console.log('hiding image options');

    setSelectedImage(() => null);

    startTimeout(
      speed,
      numberOfItems,
      selectionMethod,
      currentFiles.indexOf(chosenFiles[0]) - 1,
      true
    );
  };

  const imageProps = {
    runProgressBar,
    direction,
    numberOfItems,
    stopTimeout,
    setSelectedImage,
  };

  function genImages(ipaths, selected=false) {
    //console.log(`
    // timeouts: ${timeouts}
    // ipaths: ${ipaths}
    //`);

    return ipaths.map((fname, index) => {
      // get the file extension from the fname
      let ext = fname.split('.').pop().toLowerCase();
      // check if the file extension is a video format
      let isVideo = ['mp4', 'webm', 'ogg'].includes(ext);
      // return an img or a ReactPlayer component depending on the file type

      let conditional= {
        selected,
        filePath : selected ? `${fname}`: `atom://${fname}`
      }

      if (isVideo) {

        if (!selected) {
          conditional.className = "vid"
        } else {
          conditional.className = "svid"
        }

        return (
          <Video
            {...imageProps}
            {...conditional}
            key={index}
          />
        );
      }

      if (!selected) {
        conditional.className = "img"
      } else {
        conditional.className = "simg"
      }

      return (
        <Image
          {...imageProps}
          {...conditional}
          key={index}
        />
      );
    });
  }

  const items = genImages(chosenFiles);

  return (
    <>
      <SnackbarProvider autoHideDuration={2000} />
      {progressBarIsLoading && (
        <ProgressBar
          progress={loadingProgress}
          background={progressBackground}
        />
      )}
      <div id="folder">
        <Space id="top">
          <Link id="home" to="/" onClick={stopTimeout}>
            BACK
          </Link>
          <Button
            id="optionsToggle"
            type="text"
            onClick={() => {
              runProgressBar(50, '#fff');
              setShowOptions(!showOptions);
            }}
          >
            {showOptions ? 'SETTINGS' : 'HIDE SETTINGS'}
          </Button>
        </Space>

         {!showOptions && (
          <div className="foptionsw">
            <div
              className="folder_button"
              variant="text"
              onClick={openDirectory}
            >
              <div className="basename">
                {state.fpath}
                <span className="nof"> {state.num_of_files} files</span>
              </div>
            </div>

            <div id="direction">
              <label>
                <Button
                  id="playpause"
                  onClick={() => {
                    if (timeouts.length > 0) {
                      stopTimeout();
                      console.log(`
                      PAUSED
                      timeouts: ${timeouts}
                      ${timeouts === []}
                      `)

                      enqueueSnackbar(`PAUSING`, {
                        variant: 'success',
                      });

                    } else {
                      startTimeout(
                        speed,
                        numberOfItems,
                        selectionMethod,
                        getLast(currentFiles, chosenFiles)
                      );
                      console.log(`
                      PLAY
                      timeouts: ${timeouts}
                      `)

                      enqueueSnackbar(`PLAYING`, {
                        variant: 'success',
                      });

                    }
                  }}
                >
                  {timeouts.length > 0 ? 'PAUSE' : 'PLAY'}
                </Button>
              </label>
              <label>
                <Button
                  id="next"
                  onClick={() => {
                    startTimeout(
                      speed,
                      numberOfItems,
                      selectionMethod,
                      getLast(currentFiles, chosenFiles)
                    );
                    }
                  }
                >
                  NEXT
                </Button>
              </label>
              <label>
                Horizontal
                <Switch
                  id="direction_switch"
                  checked={direction === 'vertical'}
                  onChange={toggleDirection}
                ></Switch>
                Vertical
              </label>
              <label>
                Selection Method &nbsp;
                <Select
                  defaultValue={'Randomized'}
                  style={{ width: 120 }}
                  onChange={handleSelectionMethodChange}
                  options={[
                    { value: 'Randomized', label: 'Randomized' },
                    { value: 'Ordered', label: 'Ordered' },
                  ]}
                />
              </label>
              <label>
                Number of items &nbsp;
                <Select
                  defaultValue={3}
                  style={{ width: 120 }}
                  onChange={handleNumberChange}
                  options={[
                    { value: 1, label: '1' },
                    { value: 2, label: '2' },
                    { value: 3, label: '3' },
                    { value: 4, label: '4' },
                  ]}
                />
              </label>
              <label>
                Speed &nbsp;
                <Select
                  defaultValue={3}
                  style={{ width: 120 }}
                  onChange={handleSpeedChange}
                  options={[
                    { value: 3, label: '3 seconds' },
                    { value: 5, label: '5 seconds' },
                    { value: 10, label: '10 seconds' },
                    { value: 60, label: '1 minute' },
                  ]}
                />
              </label>
            </div>
          </div>
        )}

        {!selectedImage && (
          <div
            id="images"
            className={
              direction === 'horizontal'
                ? 'horizontal-images'
                : 'vertical-images'
            }
          >
            {items}
          </div>
        )}
      </div>

      {selectedImage && (
        <div id="selected-container">
          <Button onClick={clearSelectedImage}>Back</Button>

          <label className="image_path">{selectedImage.substring(7)}</label>

          <Space
            direction="row"
            className="img_options"
            data-fpath={selectedImage}
          >
            <Button
              className="lop"
              data-fpath={selectedImage}
              data-dir="loved"
              data-action="copy"
              onClick={moveFileToDir}
            >
              copy to loved ❤️
            </Button>
            <Button
              className="lop"
              data-fpath={selectedImage}
              data-dir="loved"
              data-action="move"
              onClick={moveFileToDir}
            >
              move to loved ❤️
            </Button>
            <Button
              className="iop meh"
              data-fpath={selectedImage}
              data-dir="meh"
              data-action="move"
              onClick={moveFileToDir}
            >
              move to meh 😑
            </Button>
            <Button
              className="iop hated"
              data-fpath={selectedImage}
              data-dir="hated"
              data-action="move"
              onClick={moveFileToDir}
            >
              move to hated 🤮
            </Button>
          </Space>

          <br />

          {genImages([selectedImage], true)}
        </div>
      )}
    </>
  );
}
