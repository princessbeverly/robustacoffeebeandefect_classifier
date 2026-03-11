import RNFS from 'react-native-fs';


//function to save file to user storage
export const saveFileToUserStorage = async (
  directory: string,
  filename: string,
  content: string
) => {
  try {
    const destPath = `${directory}/${filename}`;
    await RNFS.writeFile(destPath, content, 'utf8');
    return destPath;
  } catch (err) {
    throw err;
  }
};