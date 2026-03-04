
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

const beanCameraPage = () => {
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();

    useEffect(() => {
        requestPermission();
    }, []);

    if (!hasPermission) return <Text>No access to camera</Text>;
    if (device == null) return <Text>No Camera Device</Text>;

    return (
        <View style={styles.container}>
            {/* LAYER 1 :: The Camera [Background] */}
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
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
                    <Image
                        source={require('../../assets/icons/folder_icon.png')}
                        style={styles.extraIcons}
                    />
                    <Image
                        source={require('../../assets/icons/camera_button.png')}
                        style={styles.cameraButton}
                    />
                    <Image
                        source={require('../../assets/icons/results_icon.png')}
                        style={styles.extraIcons}
                    />
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
    colorOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 100,
        padding: 40,
    },
    semiboldText: {
      fontFamily: 'Poppins-Medium',
      fontSize: 12,
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: 1, height: 1 }, // Moves shadow 1px right and 1px down
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
        marginBottom: 60, // Space from the bottom of the screen
        padding: 30,
    },
    cameraButton: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    },
    extraIcons: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    // image of the one line logo
    logo: {
        width: 249,
        height: 37.48,
        resizeMode: 'contain',
        marginTop: 40,
    },
    circles: {
        resizeMode: 'contain',
        width: 18,
        height: 18
        }
});

export default beanCameraPage;