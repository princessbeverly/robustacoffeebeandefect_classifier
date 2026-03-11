import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoadPage from './src/screens/LoadPage';
import BeanCameraPage from './src/screens/beanCameraPage';
import savedBatchReportPage from './src/screens/savedBatchReportPage';
import reportPage from './src/screens/reportPage';


const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Load" component={LoadPage} />
                <Stack.Screen name="BeanCamera" component={BeanCameraPage} />
                <Stack.Screen name="savedBatchReportPage" component={savedBatchReportPage}/>
                <Stack.Screen name="reportPage" component={reportPage}/>
            </Stack.Navigator>
        </NavigationContainer>
        );
    }