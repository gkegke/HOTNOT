const { ipcMain, shell, dialog } = require('electron');

const fs = require('fs');
const path = require('path');
const Store = require('electron-store');

function InitLS() {
  /*

      Simple kv store intilization, comparable to what would be localStorage
      typically on the browser.

    */

  const LS = new Store();

  const defaults = {
    recent_paths: [],
    interesting_data: {
      viewed: 0,
      filtered: 0,
      loved: 0,
      meh: 0,
      hated: 0,
    },
  };

  // set keys to default if store is new and empty
  for (let key in defaults) {
    if (!LS.has(key)) {
      LS.set(key, defaults[key]);
    }
  }

  return LS;
}

// LS => localStorage alternative since localStorage isn't supported well (i forget)
// by electron
const LS = InitLS();

/*

  IPC handlers: allow interaction between main and renderer

*/

ipcMain.handle('openFileBrowser', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  console.log(canceled, filePaths);

  if (canceled) {
    return;
  }

  const pathFiles = await fs.promises.readdir(filePaths[0]);

  return {
    fpath: filePaths[0],
    basename: path.basename(filePaths[0]),
    num_of_files: pathFiles.length,
    some_files: pathFiles
      .slice(0, 5)
      .map((fname) => path.join(filePaths[0], fname)),
  };
});

ipcMain.handle('getStoreValue', (event, key) => {
  return LS.get(key);
});

ipcMain.handle('setStoreValue', (event, key, value) => {
  return LS.set(key, value);
});

ipcMain.handle('getDirFilepaths', async (event, dpath) => {
  console.log('getDirFilepaths', dpath);

  // Define an array of valid file extensions
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.avi', '.webm'];

  const sub_paths = await fs.promises.readdir(dpath, { withFileTypes: true });

  // Filter the sub_paths by checking if they are files and have a valid extension
  const dpaths = sub_paths.filter((dirent) => {
    return (
      dirent.isFile() && validExtensions.includes(path.extname(dirent.name))
    );
  });

  console.log('dpath result', dpaths);

  // dirent = { name: str, [type]: 1 }
  return dpaths.map((dirent) => path.join(dpath, dirent.name));
});

// get details of folder
// i.e. number of images, number of videos etc etc
ipcMain.handle('getRecentPaths', async (event) => {
  const rpaths = LS.get('recent_paths');

  console.log('get recent paths', rpaths);

  const result = await Promise.all(
    rpaths.map(async (rpath) => {
      // note rpath: { fpath: ..., basename: ... }

      console.log('rp', rpath);

      const sub_paths = await fs.promises.readdir(rpath.fpath, {
        withFileTypes: true,
      });

      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.avi', '.webm'];

      const rpath_files = sub_paths.filter((dirent) => {
        return (
          dirent.isFile() && validExtensions.includes(path.extname(dirent.name))
        );
      });

      console.log('rp length', rpath_files.length);
      console.log(rpath_files[0]);

      return {
        fpath: rpath.fpath,
        basename: rpath.basename,
        num_of_files: rpath_files.length,
        some_files: rpath_files
          .slice(0, 5)
          .map((dirent) => path.join(rpath.fpath, dirent.name)),
      };
    })
  );

  console.log(result);

  return result;
});

ipcMain.handle('openDirectory', async (event, dpath) => {
  console.log(`opening directory on path: ${dpath}`);

  shell.openExternal(`file://${dpath}`);

  console.log('should have opened..');
});

ipcMain.handle(
  'moveFileToDir',
  async (event, sourcePath, destinationDir, actionType) => {
    const dirname = path.dirname(sourcePath);
    const basename = path.basename(sourcePath);
    const targetDir = path.join(dirname, destinationDir);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }

    const destinationPath = path.join(targetDir, basename);

    console.log(
      `trying to ${actionType} file ${sourcePath} to ${destinationPath}`
    );

    try {
      if (actionType === 'move') {
        await fs.promises.rename(sourcePath, destinationPath);
        console.log('File moved successfully');
      } else if (actionType === 'copy') {
        await fs.promises.copyFile(sourcePath, destinationPath);
        console.log('File copied successfully');
      }
    } catch (error) {
      console.error(`
      Failed to move file [${sourcePath}] to [${destinationPath}]

      ${error.message}
      `);
    }
  }
);
