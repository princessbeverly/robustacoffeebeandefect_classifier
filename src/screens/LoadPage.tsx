import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator } from 'react-native';
import { initModel } from '../services/tfliteService';

const LoadPage = ({ navigation }: any) => {
    useEffect(() => {
        const prepare = async () => {
        try {
            // Initialize the AI model while the user sees the branding
            // Promise.all ensures we wait at least 2.5s for the logo to be seen
            await Promise.all([
                initModel(),
                new Promise(resolve => setTimeout(resolve, 2500))
            ]);
        } catch (e) {
            console.error("Initialization error:", e);
        } finally {
            navigation.replace('BeanCamera');
        }
        };

        prepare();
        }, [navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.centerContent}>
                <Image
                    source={require('../../assets/logo/robusta_bean_logo.png')}
                    style={styles.logo}
            />
            <Text style={styles.semiboldText}>ROBUSTA</Text>
            <Text style={styles.extralightText}>DEFECT CLASSIFIER</Text>
        </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContent: {
        alignItems: 'center',
    },
    semiboldText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 25,
        color: '#2E1D0B',
        marginBottom: -10
    },
    extralightText: {
        fontFamily: 'Poppins-ExtraLight',
        fontSize: 17,
        color: '#775242',
        letterSpacing: 4
    },
    logo: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        marginBottom: 10
    }
});

export default LoadPage;
