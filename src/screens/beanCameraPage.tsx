import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Alert, AppState } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import DropShadow from "react-native-drop-shadow";
import { saveFileToUserStorage } from '../services/useStorageService'; // not yet used
import { runModelOnImage, initModel, getDetectionSummary } from '../services/tfliteService';
// import { type Detection } from '../components/DetectionBoxOverlay';
// import ResultOverlay from '../components/ResultOverlay';
import Orientation from 'react-native-orientation-locker';
import { useIsFocused } from '@react-navigation/native'
import { pickDirectory, types } from '@react-native-documents/picker';

const beanCameraPage = () => {
    const camera = useRef<Camera>(null);
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const [result, setResult] = useState<{ photoPath: string; detections: Detection[] } | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [saveDirectory, setSaveDirectory] = useState<string | null>(null);

    useEffect(() => {
        requestPermission();

        // Initialize TFLite model
        initModel().catch(error => {
            console.error('Failed to initialize model:', error);
            Alert.alert('Error', 'Failed to load AI model');
        });

        // Lock orientation to portrait
        Orientation.lockToPortrait();

        // Handle app state changes to pause camera when app goes to background
        const subscription = AppState.addEventListener('change', nextAppState => {
            setIsActive(nextAppState === 'active');
        });
        return () => {
            subscription.remove();
            Orientation.unlockAllOrientations();
        };
    }, []);

    const onTakePhoto = async () => {
    
        try {
            if (camera.current == null) return;

            const photo = await camera.current.takePhoto({
                flash: 'off'
            });

            console.log("Photo captured:", );
            Alert.alert("Captured!", `Photo saved at: ${photo.path}`);

            try {
                const results = await runModelOnImage(photo.path);
                console.log(`Found ${results.length} detections`);
                const { total } = getDetectionSummary(results);
                console.log(`Total beans: ${total}`);
                results.forEach((d: Detection, i: number) => {
                    console.log(`Detection ${i}: ${d.label} (${d.category}) ${(d.confidence * 100).toFixed(1)}%`);
                });
                setResult({ photoPath: photo.path, detections: results });
            } catch (e) {
                console.error('Inference error:', e);
                Alert.alert('Inference error', String(e));
            }
        } catch (e) {
            console.error("Failed to take photo:", e);
        }
    };

// Updated function
// function for selecting directory   
const onSelectDirectory = async () => {
        try {
            const directory = await pickDirectory(); // or pass options if needed

            if (!directory?.uri) {
            throw new Error('No directory selected');
            }

            setSaveDirectory(directory.uri);
            
            setTimeout(() => {
            Alert.alert('Directory Set', `Will save to: ${directory.uri}`);
            }, 100);
        } catch (err: any) {
            if (err?.code === 'PICKER_CANCELLED' || err?.message?.includes('cancelled')) {
            return;
            }
            console.error('Directory pick error:', err);
            Alert.alert('Error', 'Could not select directory');
        }
    };
// use when saving report 
    const ensureDirectorySelected = async (): Promise<boolean> => {
        if (saveDirectory) return true;

        try {
            const directory = await pickDirectory();

            if (!directory?.uri) {
            Alert.alert('No directory selected', 'A save location is required to continue.');
            return false;
            }

            setSaveDirectory(directory.uri);
            Alert.alert('Directory Set', `Will save to: ${directory.uri}`);
            return true;
        } catch (err: any) {
            if (err?.code === 'PICKER_CANCELLED' || err?.message?.includes('cancel')) {
            return false;
            }
            console.error('Auto directory selection failed:', err);
            Alert.alert('Error', 'Failed to select save directory');
            return false;
        }
        };
// WIP - onsavereport
        const onSaveReport = async () => {
        if (!result) {
            Alert.alert('No scan yet', 'Take a photo first.');
            return;
        }
        if (!saveDirectory) {
            Alert.alert('No directory', 'Please select a save location first.');
            return;
        }

        try {
            const savedPath = await saveFileToUserStorage(
                saveDirectory,
                'scan_report.json',
                JSON.stringify(result)
            );
            setTimeout(() => {
                Alert.alert('Saved!', `File saved to: ${savedPath}`);
            }, 100);
        } catch (err) {
            Alert.alert('Error', 'Could not save file');
        }
    };

    if (!hasPermission) return <Text>No access to camera</Text>;
    if (device == null) return <Text>No Camera Device</Text>;

    const showingResults = result != null;

    const isFocused = useIsFocused();      

    return (
        <View style={styles.container}>
            {/* Keep Camera mounted; only pause session when showing results to avoid invalid session on remount */}
            <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isFocused && isActive}
                photo={true}
                onError={(error) => {
                    if (error.code === "system/camera-is-restricted") {
                    // Expected when app goes to background
                    console.log("Camera temporarily restricted");
                    return;
                    }

                    console.error("Camera error:", error);
                }}
            />

            {!showingResults && (
            <>
            {/* LAYER 2 :: The Overlay*/}
            <View style={styles.overlay}>

                {/* Top Section */}
                <Image
                    source={require('../../assets/logo/one_line_logo.png')}
                    style={styles.logo}
                />

                <View style={{ flex: 1 }} />

                {/* Camera Border */}
                <Image
                    source={require('../../assets/icons/cameraBorder.png')}
                    style={styles.cameraBorder}
                />

                    {/* :: New overlay for color guide  */}
                    <View style={styles.colorOverlay}>

                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 0 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginRight: 10, width: 68, height: 20,}}>
                                <Image
                                    source={require('../../assets/icons/good_bean.png')}
                                    style={styles.circles}
                                />
                                <Text style={styles.semiboldText}>GOOD</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginRight: 10, width: 68, height: 20,}}>
                                <Image
                                    source={require('../../assets/icons/cat1.png')}
                                    style={styles.circles}
                                />
                                <Text style={styles.semiboldText}>CAT I</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginRight: 10, width: 68, height: 20,}}>
                                <Image
                                    source={require('../../assets/icons/cat2.png')}
                                    style={styles.circles}
                                />
                                <Text style={styles.semiboldText}>CAT II</Text>
                            </View>
                        </View>
                    </View>
                <View style={{ flex: 1 }} />

                {/* Container for camera button (At the bottom) */}
                <View style={styles.cameraButtonContainer}>

                    <TouchableOpacity onPress={onSelectDirectory}> // select save directory
                        <DropShadow
                          style={styles.shadowStyle}
                        >
                            <Image
                                source={require('../../assets/icons/folder_icon.png')}
                                style={styles.extraIcons}
                            />
                        </DropShadow>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onTakePhoto} activeOpacity={0.7}>
                        <Image
                            source={require('../../assets/icons/camera_button.png')}
                            style={styles.cameraButton}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => console.log('View Results')}>
                        <DropShadow
                          style={styles.shadowStyle}
                        >
                            <Image
                                source={require('../../assets/icons/results_icon.png')}
                                style={styles.extraIcons}
                            />
                        </DropShadow>
                    </TouchableOpacity>

                </View>
            </View>
            </>
            )}

            {showingResults && result && (
                <ResultOverlay result={result} onBack={() => setResult(null)} />
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    colorOverlay: {
        alignItems: 'center',
        padding: 20,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5,
    },
    semiboldText: {
      fontFamily: 'Poppins-Medium',
      fontSize: 12,
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
      },
    cameraBorder: {
        width: 600,
        height: 600,
        resizeMode: 'contain',
    },
    cameraButtonContainer: {
        flex: 1,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 60,
        padding: 30,
    },
    cameraButton: {
        width: 70,
        height: 70,
        resizeMode: 'contain',
    },
    extraIcons: {
        width: 30,
        height: 30,
        resizeMode: 'contain'
    },
    logo: {
        width: 249,
        height: 37.48,
        resizeMode: 'contain',
        marginTop: 50,
        marginBottom: 10
    },
    circles: {
        resizeMode: 'contain',
        width: 18,
        height: 18
    },
    shadowStyle: {
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
    }
});

export default beanCameraPage;