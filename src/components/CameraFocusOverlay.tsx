// components/CameraFocusOverlay.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

type FocusState = 'searching' | 'locked';

interface Props {
    state?: FocusState;
    size?: number;
    cornerLength?: number;
    cornerThickness?: number;
    searchingColor?: string;
    lockedColor?: string;
}

const CameraFocusOverlay = ({
    state = 'searching',
    size = 220,
    cornerLength = 30,
    cornerThickness = 3,
    searchingColor = '#4ade80',
    lockedColor = '#facc15',
}: Props) => {
    const scanAnim   = useRef(new Animated.Value(0)).current;
    const pulseAnim  = useRef(new Animated.Value(1)).current;
    const contractAnim = useRef(new Animated.Value(1)).current;
    const scanOpacity  = useRef(new Animated.Value(0)).current;

    const color = state === 'locked' ? lockedColor : searchingColor;

    useEffect(() => {
        if (state === 'searching') {
        // Reset pulse, start contract + scan
        pulseAnim.setValue(1);

        Animated.loop(
            Animated.sequence([
                Animated.timing(contractAnim, { toValue: 0.9, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                Animated.timing(contractAnim, { toValue: 1,   duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim,    { toValue: 0, duration: 0,    useNativeDriver: true }),
                Animated.timing(scanOpacity, { toValue: 1, duration: 200,  useNativeDriver: true }),
                Animated.timing(scanAnim,    { toValue: 1, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                Animated.timing(scanOpacity, { toValue: 0, duration: 200,  useNativeDriver: true }),
                Animated.delay(400),
            ])
        ).start();
    } else {
        // Stop contract/scan, do a quick pulse on lock
        contractAnim.stopAnimation();
        scanAnim.stopAnimation();
        scanOpacity.stopAnimation();

        Animated.sequence([
            Animated.timing(contractAnim, { toValue: 0.92, duration: 120, useNativeDriver: true }),
            Animated.timing(contractAnim, { toValue: 1,    duration: 200, useNativeDriver: true }),
            Animated.timing(pulseAnim,    { toValue: 0.4,  duration: 300, useNativeDriver: true }),
            Animated.timing(pulseAnim,    { toValue: 1,    duration: 300, useNativeDriver: true }),
            Animated.timing(pulseAnim,    { toValue: 0.4,  duration: 300, useNativeDriver: true }),
            Animated.timing(pulseAnim,    { toValue: 1,    duration: 300, useNativeDriver: true }),
        ]).start();

        Animated.timing(scanOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }

    return () => {
        contractAnim.stopAnimation();
        scanAnim.stopAnimation();
        scanOpacity.stopAnimation();
        pulseAnim.stopAnimation();
        };
    }, [state]);

    const scanTranslateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, size - 6],
    });

    const cornerStyle = {
        borderColor: color,
        borderWidth: cornerThickness,
    };

    return (
        <Animated.View style={[
            styles.container,
            { width: size, height: size },
            { transform: [{ scale: contractAnim }] },
        ]}>
        {/* Corners */}
        <Animated.View style={[styles.corner, styles.tl, cornerStyle, { width: cornerLength, height: cornerLength }, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.corner, styles.tr, cornerStyle, { width: cornerLength, height: cornerLength }, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.corner, styles.bl, cornerStyle, { width: cornerLength, height: cornerLength }, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.corner, styles.br, cornerStyle, { width: cornerLength, height: cornerLength }, { opacity: pulseAnim }]} />

        {/* Scan line — only visible when searching */}
        <Animated.View style={[
            styles.scanLine,
            {
                opacity: scanOpacity,
                backgroundColor: color,
                transform: [{ translateY: scanTranslateY }],
            },
        ]} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
container: {
    position: 'relative',
},
corner: {
    position: 'absolute',
    borderColor: 'transparent',
},
tl: {
    top: 0, left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 4,
},
tr: {
    top: 0, right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 4,
},
bl: {
    bottom: 0, left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 4,
},
br: {
    bottom: 0, right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 4,
},
scanLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 1.5,
    top: 0,
},
});

export default CameraFocusOverlay;