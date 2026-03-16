import { generatePDF } from 'react-native-html-to-pdf';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';

export const createPDF = async (html, batchId) => {
  const safeFileName = String(batchId || 'report').replace(/[^\w-]/g, '_');

  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    );
    console.log('Storage permission:', granted);
  }

  console.log('Generating PDF...');
  const pdf = await generatePDF({
    html,
    fileName: safeFileName,
    base64: false,
  });

  console.log('PDF result:', JSON.stringify(pdf));

  if (!pdf?.filePath) {
    Alert.alert('Download Failed', 'PDF could not be generated.');
    return null;
  }

  const destPath = `${RNFS.DownloadDirectoryPath}/${safeFileName}.pdf`;
  await RNFS.copyFile(pdf.filePath, destPath);

  // Notify media scanner so it appears in Files app immediately
  await RNFS.scanFile(destPath);
  console.log('Media scan triggered for:', destPath);

  const destExists = await RNFS.exists(destPath);
  if (!destExists) {
    Alert.alert('Download Failed', 'File was not copied to Downloads.');
    return null;
  }

  Alert.alert(
    'Download Successful',
    `PDF saved to Downloads:\n${safeFileName}.pdf`,
  );

  return destPath;
};