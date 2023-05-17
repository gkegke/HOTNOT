
import { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';

import { Button } from 'antd';
import ReactPlayer from "react-player";

import './css/recent.css';

export default function Recent(props) {

  //console.log("recent props", props)

  function recentPathImages(ipaths) {
    return ipaths.map((fname, index) => {
      // get the file extension from the fname
      let ext = fname.split(".").pop().toLowerCase();
      // check if the file extension is a video format
      let isVideo = ["mp4", "webm", "ogg"].includes(ext);
      // return an img or a ReactPlayer component depending on the file type
      if (isVideo) {
        return (
          <ReactPlayer
            key={index}
            className="rvid"
            url={`atom://${fname}`}
            playing={true}
            muted={true}
            width={100}
            height={100}
          />
        );
      } else {
        return <img key={index} className="rimg" src={`atom://${  fname}`} />
      }
    });
  }

  function openDirectory(e) {

    props.runProgressBar(50, "#fff");

    const fpath = e.target.parentElement.dataset.fpath;

    console.log(`opening directory...
     fpath: ${fpath}
    `);

    electron.eAPI.openDirectory(fpath)
        .then(() => {

          console.log("should have opened dir")

        }).catch((err) => {

          const emsg = `
          Error : API : openDirectory

          Failed to open the directory ${fpath}

          ${err}
          `

        })


  }

  const rows = props.recentPaths.map((recent, index) => {

      //console.log("recent", recent);

      if (recent.fpath !== "" || recent !== null || recent !== undefined) {

          const recent_images = recentPathImages(recent.some_files);

          return (
            <div className="recentw" key={index}>

                <Link
                    className="rlink"
                    to="/folder"
                    state={{...recent}}
                >

                  <div className="recent">

                    <label className="recent_title">{recent.basename} <span className="nof">{ recent.num_of_files } files</span></label>
                    <span>{recent.fpath}</span>

                    <div className="rimages">
                      { recent_images }
                    </div>

                  </div>

                </Link>
                <div className="recentOptions">
                    <Button size="small" className="rop" data-fpath={recent.fpath} onClick={openDirectory}>open folder</Button>
                    <Button size="small" className="rop" data-fpath={recent.fpath} onClick={props.removeRecentPaths}>remove from recent</Button>
                    <Button size="small" className="rop disabled"><s>view stats</s></Button>
                </div>
            </div>
          )

      }

  });

  return (<>

    {
      props.recentPaths.length > 0
      ? <div id="recentw">{rows}</div>
      : <div></div>
    }

  </>)

}
