import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';

const LoadPage = () => {
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
    alignItems: 'center'
  },
  semiboldText: {
      fontFamily: 'Poppins-SemiBold',
      fontSize: 25,
      marginBottom: -10
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
      resizeMode: 'contain'
      }


});


export default LoadPage;