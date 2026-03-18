import { generatePDF } from 'react-native-html-to-pdf';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';

function toSafeFileName(value) {
  const base = String(value ?? '')
    .trim()
    .replace(/\.[^.]+$/, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_\.\s-]+|[_\.\s-]+$/g, '');

  const normalized = base || 'report';
  const truncated = normalized.slice(0, 80);

  // Avoid Windows-reserved base names for cross-platform safety.
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(truncated)) {
    return `_${truncated}`;
  }

  return truncated;
}

export const createPDF = async (html, fileNameHint) => {
  const safeFileName = toSafeFileName(fileNameHint);

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