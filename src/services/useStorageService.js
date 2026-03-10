import RNFS from 'react-native-fs';

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