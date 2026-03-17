import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Alert, AppState, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import DropShadow from "react-native-drop-shadow";
import { runModelOnImage, initModel, getDetectionSummary } from '../services/tfliteService';
import { type Detection } from '../components/DetectionBoxOverlay';
import ResultOverlay from '../screens/reportPage';
import Orientation from 'react-native-orientation-locker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';

const beanCameraPage = ({navigation}: {navigation: any})  => {
    const camera = useRef<Camera>(null);
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const [result, setResult] = useState<{ photoPath: string; detections: Detection[] } | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

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
                flash: 'off',
                enableShutterSound: true
            });

            setIsCapturing(true);

            setTimeout(() => {
                setIsCapturing(false);
            }, 2000)

            setIsProcessing(true);

            try {
                const results = await runModelOnImage(photo.path);
                // 1. Create the result object
                const scanResult = { photoPath: photo.path, detections: results };
                // 2. Update state (optional, if you want to keep a history)
                setResult(scanResult);

                setIsProcessing(false);
                setIsCapturing(false);
                // 3. IMMEDIATELY navigate to the report page
                navigation.navigate('reportPage', { result: scanResult, setIsProcessing });



            } catch (e) {
                setIsProcessing(false);
                console.error('Inference error:', e);
                Alert.alert('Inference error', String(e));
            }
        } catch (e) {
            setIsProcessing(false);
            console.error("Failed to take photo:", e);
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


            <>
            {/* LAYER 2 :: The Overlay*/}
            <View style={styles.overlay}>

                {/* Top Section */}
                <Image
                    source={require('../../assets/logo/one_line_logo.png')}
                    style={styles.logo}
                />

                {isCapturing && (
                    <View style={{
                        position: 'absolute',
                        alignSelf: 'center',
                        top: 80,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: 10,
                        borderRadius: 10,
                        zIndex: 10 // this ensures it stays on top
                    }}>
                        <Text style={{ color: 'white', fontFamily: 'Poppins-Regular' }}>
                            Photo captured successfully!
                        </Text>
                    </View>
                )}

                {/* 2. AI Processing Loading Spinner */}
                {isProcessing && (
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                        <Text style={[styles.semiboldText, { marginTop: 10 }]}>
                            Analyzing Beans...
                        </Text>
                    </View>
                )}

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

                    <TouchableOpacity onPress={() => navigation.navigate('savedBatchReportPage')}>
                        <DropShadow style={styles.shadowStyle}>
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

                    <TouchableOpacity
                        onPress={() => {
                            if (result) {
                                navigation.navigate('reportPage', { result });
                            } else {
                                Alert.alert("No Data", "Take a photo first");
                            }
                        }}>

                        <DropShadow style={styles.shadowStyle}>
                            <Image
                                source={require('../../assets/icons/results_icon.png')}
                                style={styles.extraIcons}
                            />
                        </DropShadow>
                    </TouchableOpacity>

                    {/*
                        {showingResults && result && (
                            <ResultOverlay result={result} onBack={() => setResult(null)} />
                        )}
                    */}

                </View>
            </View>
            </>
            }



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
        padding: 10,
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
        width: 550,
        height: 550,
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
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)', // Dims the camera background
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20, // Ensures it sits above everything else
    }
});

export default beanCameraPage;