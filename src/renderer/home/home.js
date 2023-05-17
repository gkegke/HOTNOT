

import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

import { Menu, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { SnackbarProvider, enqueueSnackbar } from 'notistack';
import ReactPlayer from "react-player";

import E from '../common/errors.js';
import ProgressBar from '../common/progressBar.js';
import Recent from './components/recent.js';


import exampleImg from '../static/image.png';
import exampleVid from '../static/vid.webm';

import './home.css';

export default function Home() {

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [progressBackground, setProgressBackground] = useState("#ffff00");
  const [recentPaths, setRecentPaths] = useState([]);

  const navigate = useNavigate();

  const runProgressBar = (n, bgc) => {

    console.log(`running progress bar with n: ${n}, bgc: ${bgc}`)

    setIsLoading(true);
    setLoadingProgress(0);
    setProgressBackground(bgc);

    const interval = setInterval(() => {
      setLoadingProgress(progress => progress + n/2);
    }, 30);

    // 10000/n
    // when n = 50 => 10000/50 = 200, so 300 in total
    setTimeout(() => {
      clearInterval(interval);
      setIsLoading(false);
    }, (10000/n) + 300);

  };

  /* useEffect related funcs */

  useEffect(() => {
    if (isLoading && loadingProgress > 100) {
      // Perform loading logic here, e.g. fetch data from an API

      // Once loading is complete, hide the progress bar
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {

    getRecent();

  }, []);

  function getRecent() {

    electron.eAPI.getRecentPaths()
        .then((result) => {

          console.log("result of getRecentPaths", result)

          setRecentPaths(result);

        }).catch((err) => {

          const emsg = `
          Error: API : getRecentPaths

          Failed to get recent paths,

          ${err}

          `
          console.log(E(emsg));

        });

  }

  /* generic funcs */

  function updateRecentPaths(pathData) {

    console.log("updating recent paths");

    setRecentPaths(oldArray => {

      let new_recent = [];

      if (oldArray === [] || oldArray.filter(e => e.fpath === pathData.fpath) === 0) {

        new_recent = [pathData, ...oldArray].slice(0,4);

        console.log("newArray1", new_recent);
        //console.log("fps", path);
        //console.log("oldArray", oldArray);
        //console.log("newArray", new_recent);


      } else {

        console.log("already in recent paths");
        //console.log("fps", path);
        //console.log("oldArray", oldArray);

        oldArray = oldArray.filter((item) => item.fpath !== pathData.fpath);

        new_recent = [pathData, ...oldArray].slice(0,4);

        console.log("newArray2", new_recent);

      }

      //console.log("setting", new_recent);
      electron.eAPI.setStoreValue("recent_paths", new_recent);

      console.log("set recent paths", oldArray, new_recent)

      return new_recent;

    });

  }

  function removeRecentPaths(e) {

    runProgressBar(50, "#ff0000");

    const fpath = e.target.parentElement.dataset.fpath;
    console.log("deleting data from recent paths")

    setRecentPaths(oldArray => {

      const new_recent = oldArray.filter((item) => item.fpath !== fpath);

      electron.eAPI.setStoreValue("recent_paths", new_recent);

      console.log("set recent paths", oldArray, new_recent)

      return new_recent;

    });

    enqueueSnackbar(`Removed ${fpath} from recently filtered folders list.`, {
      variant: 'success',
    });

  }

  function selectDirectory() {

    electron.eAPI.openFileBrowser()
        .then((result) => {

          if (result === undefined) {

            console.log("canceled opening file directory via filebrowser")

          } else {

            console.log("directory input", result);

            updateRecentPaths(result)

            console.log("navigating", result);

            navigate("/folder", { state : result });

          }

        }).catch((err) => {

          const emsg = `
          Error: API : openFileBrowser

          Failed to choose a directory in the file browser.

          ${err}

          `
          console.log(E(emsg));

        });

  }

  const recentProps = {
    recentPaths : recentPaths,
    removeRecentPaths : removeRecentPaths,
    runProgressBar : runProgressBar,
  }

  return (<>

    <SnackbarProvider autoHideDuration={2000} />

    { isLoading && <ProgressBar progress={loadingProgress} background={progressBackground} />}

    <div id="main">

    <Menu id="menu" mode="horizontal">
      <Menu.Item key="home" icon={<HomeOutlined />}>
        <Link to="/">HOTNOT</Link>
      </Menu.Item>
      <Menu.Item key="github">
        github
      </Menu.Item>
      <Menu.Item key="how">
        how to use
      </Menu.Item>
    </Menu>

      <div id="aboutw">

        <div id="about">

            <p>
              <h3>HOTNOT</h3>
              Filter out what you LOVE, find MEH, HATE and more in your folders
              at the speed of light ☄️.
            <br/>
            <br/>
            End up with collections you <u>know</u> you love.
            </p>

            <div id="examples">
              <div className="example">
                <label>Images</label>
                <img alt="example" src={exampleImg} />
              </div>
              <div className="example">
                <label>Videos</label>
              <ReactPlayer
                url={exampleVid}
                width="100%"
                height="100%"
                controls
                playing={true}
              />
              </div>
            </div>

        </div>

      </div>

        <center>
          <Button
            id="selectDirectory"
            size="large"
            type="primary"
            onClick={selectDirectory}
          >
            SELECT FOLDER
          </Button>
        </center>

        <h2>
            Recently filtered folders,
        </h2>

        <Recent {...recentProps} />

    </div>

  </>);
}

