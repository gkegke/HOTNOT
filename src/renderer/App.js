
import {
  HashRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';

import Home from './home/home.js';
import Folder from './folder/folder.js';

import './index.css';

export default function App() {

  return (
  <Router>
      <Routes>
      <Route exact path="/" element={<Home/>}></Route>
      <Route path="/folder" element={<Folder/>}></Route>
      </Routes>
  </Router>
  )

}
