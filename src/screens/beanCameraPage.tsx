
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

                <View style={{ flex: 1 }} />

                {/* Container for camera button (At the bottom) */}
                <View style={styles.cameraButtonContainer}>

                    <Image
                        source={require('../../assets/icons/camera_button.png')}
                        style={styles.cameraButton}
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
    cameraBorder: {
        width: 600,
        height: 600,
        resizeMode: 'contain',
    },
    cameraButtonContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 60, // Space from the bottom of the screen
    },
    cameraButton: {
        width: 59.37,
        height: 59.37,
    },
    // image of the one line logo
    logo: {
        width: 249,
        height: 37.48,
        resizeMode: 'contain',
        marginTop: 40,
    }
});

export default beanCameraPage;