import './image.css';
import ReactPlayer from 'react-player';

export function Video(props) {
  const toggleOptions = () => {
    props.runProgressBar(50, '#00ff00');

    props.setSelectedImage(props.filePath);
    props.stopTimeout();
  };

  const conditional = {}

  if (props.selected) {
    conditional.width = window.innerWidth
  } else {

    if (props.direction === 'horizontal') {
      conditional.width = window.innerWidth / props.numberOfItems;
    }

    if (props.direction === 'vertical') {
      conditional.width = window.innerWidth - 10;
      conditional.height = window.innerHeight / props.numberOfItems;
    }

  }

  const base = (
    <ReactPlayer
    {...conditional}
    className={props.className}
    url={props.filePath}
    playing={true}
    muted={true}
    onClick={toggleOptions}
    controls
    />
  );

  return <div className="vidw">{base}</div>;


}

export function Image(props) {
  const toggleOptions = () => {
    props.runProgressBar(50, '#00ff00');

    props.setSelectedImage(props.filePath);
    props.stopTimeout();
  };

  const base = (
    <img
      className={props.className}
      onClick={toggleOptions}
      src={props.filePath}
      style={{
        ...(props.direction === 'horizontal' && {
          minWidth: `${100 / props.numberOfItems}%`,
        }),
        ...(props.direction === 'vertical' && {
          height: `calc(100vh/${props.numberOfItems} - 30px)`,
        }),
      }}
    />
  );

  return <div className="imgw">{base}</div>;
}
