/**
 * Overlays bounding boxes on an image for detections from runModelOnImage.
 *
 * Usage:
 *   import DetectionBoxOverlay from '../components/DetectionBoxOverlay';
 *   const detections = await runModelOnImage(photo.path);
 *   <DetectionBoxOverlay
 *     imageSource={{ uri: 'file://' + photo.path }}
 *     detections={detections}
 *     showLabels
 *     colorByCategory
 *   />
 */
import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Text, ImageSourcePropType } from 'react-native';

export interface Detection {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    confidence: number;
    classId: number;
    label: string;
    category: string;
}

interface DetectionBoxOverlayProps {
    /** Image source: { uri: string } for file path or require() for bundled asset */
    imageSource: ImageSourcePropType;
    /** Detections from runModelOnImage (normalized 0–1 coordinates) */
    detections: Detection[];
    /** Optional: show label + confidence on each box */
    showLabels?: boolean;
    /** Optional: color by category. If false, uses defaultBorderColor */
    colorByCategory?: boolean;
    /** Border color when colorByCategory is false */
    defaultBorderColor?: string;
    /** Container style (e.g. aspect ratio, flex) */
    style?: object;
}

const CATEGORY_COLORS: Record<string, string> = {
    good: '#14AE5C',
    cat1: '#A81616',
    cat2: '#8D8905',
};

export default function DetectionBoxOverlay({
    imageSource,
    detections = [],
    showLabels = true,
    colorByCategory = true,
    defaultBorderColor = '#3b82f6',
    style,
}: DetectionBoxOverlayProps) {
    const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
    const [imageRect, setImageRect] = useState<{
    renderedW: number;
    renderedH: number;
    offsetX: number;
    offsetY: number;
} | null>(null);

    const onLayout = (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setLayout({ width, height });
    };

  // Compute actual rendered image rect (contain) so boxes align with the image, not the letterboxed container
useEffect(() => {
    if (!layout) {
        setImageRect(null);
        return;
    }
    const uri =
        typeof imageSource === 'object' && imageSource !== null && 'uri' in imageSource
        ? (imageSource as { uri: string }).uri
        : typeof imageSource === 'number'
            ? (Image.resolveAssetSource(imageSource) as { uri?: string } | undefined)?.uri ?? null
            : null;
    if (!uri) {
        setImageRect({
            renderedW: layout.width,
            renderedH: layout.height,
            offsetX: 0,
            offsetY: 0,
        });
    return;
    }
    Image.getSize(
        uri,
        (imgW, imgH) => {
            const scale = Math.min(layout.width / imgW, layout.height / imgH);
            const renderedW = imgW * scale;
            const renderedH = imgH * scale;
            const offsetX = (layout.width - renderedW) / 2;
            const offsetY = (layout.height - renderedH) / 2;
            setImageRect({ renderedW, renderedH, offsetX, offsetY });
        },
        () => {
            setImageRect({
            renderedW: layout.width,
            renderedH: layout.height,
            offsetX: 0,
            offsetY: 0,
            });
        }
    );
}, [layout, imageSource]);

    const borderColor = (d: Detection) => {
        if (!colorByCategory) return defaultBorderColor;
        return CATEGORY_COLORS[d.category] ?? defaultBorderColor;
    };

    if (!layout) {
    return (
        <View style={[styles.container, style]} onLayout={onLayout}>
            <Image source={imageSource} style={styles.image} resizeMode="contain" />
        </View>
    );
    }

    const { width, height } = layout;
    const rect = imageRect ?? {
        renderedW: width,
        renderedH: height,
        offsetX: 0,
        offsetY: 0,
    };
    const { renderedW, renderedH, offsetX, offsetY } = rect;

    return (
    <View style={[styles.container, style]} onLayout={onLayout}>
    <Image source={imageSource} style={styles.image} resizeMode="contain" />
    <View style={styles.overlay} pointerEvents="none">
        {detections.map((d, i) => {
            const left = offsetX + d.x1 * renderedW;
            const top = offsetY + d.y1 * renderedH;
            const boxWidth = (d.x2 - d.x1) * renderedW;
            const boxHeight = (d.y2 - d.y1) * renderedH;
            const color = borderColor(d);
            return (
                <View
                    key={i}
                    style={[
                        styles.box,
                    {
                        left,
                        top,
                        width: boxWidth,
                        height: boxHeight,
                        borderColor: color,
                        },
                    ]}
                >
                {showLabels && (
                <View style={[styles.labelRow, { backgroundColor: color }]}>
                    <Text style={styles.labelText} numberOfLines={1}>
                        {d.label} {Math.round(d.confidence * 100)}%
                    </Text>
                </View>
                )}
            </View>
            );
        })}
        </View>
    </View>
    );
    }

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#111',
    },
    image: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    box: {
        position: 'absolute',
        borderWidth: 2,
    },
    labelRow: {
        position: 'absolute',
        left: 0,
        top: -20,
        paddingHorizontal: 6,
        paddingVertical: 2,
        maxWidth: '100%',
    },
    labelText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600',
    },
});
