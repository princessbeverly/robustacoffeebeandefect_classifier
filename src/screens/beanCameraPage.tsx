
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import DropShadow from "react-native-drop-shadow";

const beanCameraPage = () => {
    const camera = useRef<Camera>(null);
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();

    useEffect(() => {
        requestPermission();
    }, []);

    const onTakePhoto = async () => {
        try {
            if (camera.current == null) return;

            const photo = await camera.current.takePhoto({
                flash: 'off'
            });

            console.log("Photo captured:", photo.path);
            Alert.alert("Captured!", `Photo saved at: ${photo.path}`);
            // You can now navigate to your results page with the photo.path
        } catch (e) {
            console.error("Failed to take photo:", e);
        }
    };

    if (!hasPermission) return <Text>No access to camera</Text>;
    if (device == null) return <Text>No Camera Device</Text>;

    return (
        <View style={styles.container}>
            {/* LAYER 1 :: The Camera [Background] */}
            <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                photo={true} // Required to capture images
            />

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

                    <TouchableOpacity onPress={() => console.log('Open Gallery')}>
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