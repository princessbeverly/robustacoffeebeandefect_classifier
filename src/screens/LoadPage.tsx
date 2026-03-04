import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';

const LoadPage = ({ navigation }: any) => {
    useEffect(() => {
        const prepare = async () => {
          try {
            // simulate loading for now:
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (e) {
            console.warn(e);
          } finally {
            navigation.replace('BeanCamera'); // replace so user can't go back to load screen
          }
        };

        prepare();
      }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo/robusta_bean_logo.png')}
        style={styles.logo}
      />
      <Text style={styles.semiboldText}>ROBUSTA</Text>
      <Text style={styles.extralightText}>DEFECT CLASSIFIER</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  semiboldText: {
      fontFamily: 'Poppins-SemiBold',
      fontSize: 25,
      textDecorationStyle: 'solid',
      marginBottom: -15
  },
  regularText: {
      fontFamily: 'Poppins-Regular'
      },
  extralightText: {
      fontFamily: 'Poppins-ExtraLight',
      fontSize: 17,
      letterSpacing: 4
      },
  mediumText: {
      fontFamily: 'Poppins-Medium'
      },
  boldText: {
      fontFamily: 'Poppins-Bold'
      },
  interRegular: {
      fontFamily: 'Inter_18pt-Regular'
      },
  semiBoldCascadia: {
      fontFamily: 'CascadiaCode-SemiBold'
      },
  logo: {
      width: 118.09,
      height: 121.51,
      resizeMode: 'contain',
      marginBottom: -15
      }
});

export default LoadPage;