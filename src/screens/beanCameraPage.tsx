import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet, Text, View, Image,
    TouchableOpacity, Alert, AppState, ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import DropShadow from 'react-native-drop-shadow';
import { runModelOnImage, initModel } from '../services/tfliteService';
import { type Detection } from '../components/DetectionBoxOverlay';
import Orientation from 'react-native-orientation-locker';
import { useIsFocused } from '@react-navigation/native';
import CameraFocusOverlay from '../components/CameraFocusOverlay';

interface FocusPoint { x: number; y: number; }

const beanCameraPage = ({ navigation }: { navigation: any }) => {
    const camera = useRef<Camera>(null);
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const isFocused = useIsFocused();

    const [result, setResult] = useState<{ photoPath: string; detections: Detection[] } | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [focusState, setFocusState] = useState<'searching' | 'locked'>('searching');

    // Tap-to-focus state
    const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        requestPermission();

        initModel().catch(error => {
            console.error('Failed to initialize model:', error);
            Alert.alert('Error', 'Failed to load AI model');
        });

        Orientation.lockToPortrait();

        const subscription = AppState.addEventListener('change', nextAppState => {
            setIsActive(nextAppState === 'active');
        });

        return () => {
            subscription.remove();
            Orientation.unlockAllOrientations();
            if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
        };
    }, []);

    // ─── Tap-to-focus ─────────────────────────────────────────────────────────
    const handleTapToFocus = async (x: number, y: number) => {
        if (!device?.supportsFocus) return;

        try {
            // Show the small focus ring at the tapped point
            setFocusPoint({ x, y });
            setFocusState('locked');

            await camera.current?.focus({ x, y });

            // After 1.5s, hide the tap ring and return to idle scanning
            if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
            focusTimeoutRef.current = setTimeout(() => {
                setFocusPoint(null);
                setFocusState('searching');
            }, 1500);
        } catch (e) {
            // Device doesn't support tap-to-focus — fail silently
            setFocusPoint(null);
            setFocusState('searching');
        }
    };

    const tapGesture = Gesture.Tap()
        .runOnJS(true)
        .onEnd((e) => {
            handleTapToFocus(e.x, e.y);
        });

    // ─── Capture ──────────────────────────────────────────────────────────────
    const onTakePhoto = async () => {
        try {
            if (camera.current == null) return;

            const photo = await camera.current.takePhoto({
                flash: 'off',
                enableShutterSound: true,
            });

            setIsCapturing(true);
            setTimeout(() => setIsCapturing(false), 2000);

            setFocusState('locked');
            setIsProcessing(true);

            try {
                const results = await runModelOnImage(photo.path);
                const scanResult = { photoPath: photo.path, detections: results };
                setResult(scanResult);
                setIsProcessing(false);
                setIsCapturing(false);
                setFocusPoint(null);
                setFocusState('searching');

                navigation.navigate('reportPage', { result: scanResult, setIsProcessing });
            } catch (e) {
                setIsProcessing(false);
                setFocusPoint(null);
                setFocusState('searching');
                console.error('Inference error:', e);
                Alert.alert('Inference error', String(e));
            }
        } catch (e) {
            setIsProcessing(false);
            setFocusPoint(null);
            setFocusState('searching');
            console.error('Failed to take photo:', e);
        }
    };

    if (!hasPermission) return <Text>No access to camera</Text>;
    if (device == null) return <Text>No Camera Device</Text>;

    return (
        <View style={styles.container}>

            {/* Camera feed wrapped in tap gesture */}
            <GestureDetector gesture={tapGesture}>
                <Camera
                    ref={camera}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isFocused && isActive}
                    photo={true}
                    onError={(error) => {
                        if (error.code === 'system/camera-is-restricted') {
                            console.log('Camera temporarily restricted');
                            return;
                        }
                        console.error('Camera error:', error);
                    }}
                />
            </GestureDetector>

            {/* Overlay layer — pointerEvents box-none so taps pass through to camera */}
            <View style={styles.overlay} pointerEvents="box-none">

                {/* Logo */}
                <Image
                    source={require('../../assets/logo/one_line_logo.png')}
                    style={styles.logo}
                />

                {/* Capture banner */}
                {isCapturing && (
                    <View style={styles.captureBanner}>
                        <Text style={{ color: 'white', fontFamily: 'Poppins-Regular' }}>
                            Photo captured successfully!
                        </Text>
                    </View>
                )}

                {/* AI processing overlay */}
                {isProcessing && (
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                        <Text style={[styles.semiboldText, { marginTop: 10 }]}>
                            Analyzing Beans...
                        </Text>
                    </View>
                )}

                <View style={{ flex: 1 }} />

                {/* Focus overlay:
                    - No tap: large centered scanning box
                    - After tap: small yellow ring snaps to tap point */}
                {focusPoint ? (
                    <View
                        pointerEvents="none"
                        style={[
                            styles.tapFocusContainer,
                            { left: focusPoint.x - 40, top: focusPoint.y - 40 },
                        ]}>
                        <CameraFocusOverlay
                            state={focusState}
                            size={80}
                            cornerLength={14}
                            cornerThickness={2}
                            searchingColor="#facc15"
                            lockedColor="#facc15"
                        />
                    </View>
                ) : (
                    <CameraFocusOverlay
                        state={focusState}
                        size={280}
                        cornerLength={32}
                        cornerThickness={3}
                        searchingColor="#4ade80"
                        lockedColor="#facc15"
                    />
                )}

                <View style={{ flex: 1 }} />

                {/* Bottom controls */}
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
                                Alert.alert('No Data', 'Take a photo first');
                            }
                        }}>
                        <DropShadow style={styles.shadowStyle}>
                            <Image
                                source={require('../../assets/icons/results_icon.png')}
                                style={styles.extraIcons}
                            />
                        </DropShadow>
                    </TouchableOpacity>

                </View>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
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
    captureBanner: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        zIndex: 10,
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
        resizeMode: 'contain',
    },
    logo: {
        width: 249,
        height: 37.48,
        resizeMode: 'contain',
        marginTop: 50,
        marginBottom: 10,
    },
    shadowStyle: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    tapFocusContainer: {
        position: 'absolute',
        width: 80,
        height: 80,
    },
});

export default beanCameraPage;