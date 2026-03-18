// components/ZoomableDetectionView.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    clamp,
} from 'react-native-reanimated';
import {
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';
import DetectionBoxOverlay, { type Detection } from './DetectionBoxOverlay';

interface Props {
    imageUri: string;
    detections: Detection[];
    width?: number;
    height?: number;
    maxScale?: number;
    showBoxes?: boolean;        // ← controls bounding box visibility
}

export default function ZoomableDetectionView({
    imageUri,
    detections = [],
    width = 306,
    height = 400,
    maxScale = 4,
    showBoxes = true,           // ← default: show boxes
}: Props) {
    const scale       = useSharedValue(1);
    const savedScale  = useSharedValue(1);
    const translateX  = useSharedValue(0);
    const translateY  = useSharedValue(0);
    const savedTransX = useSharedValue(0);
    const savedTransY = useSharedValue(0);

    // ─── Pinch to zoom ────────────────────────────────────────────────────────
    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = clamp(savedScale.value * e.scale, 1, maxScale);
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            if (scale.value <= 1) {
                scale.value       = withTiming(1);
                savedScale.value  = 1;
                translateX.value  = withTiming(0);
                translateY.value  = withTiming(0);
                savedTransX.value = 0;
                savedTransY.value = 0;
            }
        });

    // ─── Pan ──────────────────────────────────────────────────────────────────
    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (scale.value <= 1) return;
            const maxX = (width  * (scale.value - 1)) / 2;
            const maxY = (height * (scale.value - 1)) / 2;
            translateX.value = clamp(savedTransX.value + e.translationX, -maxX, maxX);
            translateY.value = clamp(savedTransY.value + e.translationY, -maxY, maxY);
        })
        .onEnd(() => {
            savedTransX.value = translateX.value;
            savedTransY.value = translateY.value;
        });

    // ─── Double tap to reset ──────────────────────────────────────────────────
    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            scale.value       = withTiming(1);
            savedScale.value  = 1;
            translateX.value  = withTiming(0);
            translateY.value  = withTiming(0);
            savedTransX.value = 0;
            savedTransY.value = 0;
        });

    const composed = Gesture.Simultaneous(
        Gesture.Exclusive(doubleTap),
        pinchGesture,
        panGesture,
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <View style={[styles.outerContainer, { width, height }]}>
            <GestureDetector gesture={composed}>
                <Animated.View style={[styles.animatedContainer, { width, height }, animatedStyle]}>
                    <DetectionBoxOverlay
                        imageSource={{ uri: imageUri }}
                        detections={showBoxes ? detections : []}  // ← ternary here
                        showLabels={showBoxes}                     // ← and here
                        colorByCategory
                        style={{
                            width,
                            height,
                            resizeMode: 'contain',
                            backgroundColor: '#FFFFFF',
                        }}
                    />
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        overflow: 'hidden',
        zIndex: 10,
        elevation: 10,
        backgroundColor: '#FFFFFF',
    },
    animatedContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});