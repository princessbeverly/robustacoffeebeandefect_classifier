
import React, {useRef} from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { getDetectionSummary } from '../services/tfliteService';
import DetectionBoxOverlay, { type Detection } from '../components/DetectionBoxOverlay';

const reportPage = ({ navigation, route }: any) => {
    const result = route?.params?.result;
    const viewShotRef = useRef(null);

    if (!result) {
        return (
            <View style={styles.container}>
                <Text style={{marginTop: 50, textAlign: 'center'}}>No detection data found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{textAlign: 'center', color: 'blue'}}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const {total, byClass, byCategory} = getDetectionSummary(result.detections);

    // Category 1
    const fullBlack = byClass['full-black'] || 0;
    const fullSour = byClass['full-sour'] || 0;
    const driedCherryPod = byClass['dried-cherry-pod'] || 0;
    const fungusDamage = byClass['fungus-damage'] || 0;
    const severeInsectDamage = byClass['severe-insect-damage'] || 0;
    const foreignMatter = byClass['foreign-matter'] || 0;
    // Category 2
    const partialBlack = byClass['partial-black'] || 0;
    const partialSour = byClass['partial-sour'] || 0;
    const parchmentPergamino = byClass['parchment'] || 0;
    const slightInsectDamage = byClass['slight-insect-damage'] || 0;
    const floater = byClass['floater'] || 0;
    const immatureUnripe = byClass['immature'] || 0;
    const withered = byClass['withered'] || 0;
    const shell = byClass['shell'] || 0;
    const brokenChippedCut = byClass['broken-chipped-cut'] || 0;
    const hullHusk = byClass['hull'] || 0;
    // total counts
    const beansDetected = total || 0;
    const officialBeans = total-foreignMatter || 0;
    const categoryOne = byCategory.cat1 || 0;
    const categoryTwo = byCategory.cat2 || 0;

    const totalDefectScore = (Math.floor(partialBlack/3)) + (Math.floor(partialSour/3)) + (Math.floor(parchmentPergamino/5)) + (Math.floor(slightInsectDamage/10)) + (Math.floor(floater/5)) + (Math.floor(immatureUnripe/5)) + (Math.floor(withered/5)) + (Math.floor(shell/5)) + (Math.floor(brokenChippedCut/5)) + (Math.floor(hullHusk/5)) + (Math.floor(severeInsectDamage/5)) + fullBlack + fullSour + driedCherryPod + fungusDamage + foreignMatter;
    const batchIntegrity = beansDetected > 0
        ? Math.max(0, Math.round(100 - ((totalDefectScore / beansDetected) * 100)))
        : 0; // Default to 0 if no beans are found

    let statusIcon;
    let statusColor;
    let statusTitle;
    let statusDescription;
    const imageUri = result.photoPath.startsWith('file://') ? result.photoPath : `file://${result.photoPath}`;

    if(batchIntegrity >= 95 && batchIntegrity <= 100 && beansDetected > 0){
        statusIcon = require('../../assets/icons/good_result.png');
        statusColor = '#14AE5C';
        statusTitle = 'RELEASE READY';
        statusDescription = 'The sample shows minimal defects. Batch is in good condition and can move forward without intervention.';
    }else if(batchIntegrity >= 88 && batchIntegrity <= 94 && beansDetected > 0){
        statusIcon = require('../../assets/icons/good_result.png');
        statusColor = '#14AE5C';
        statusTitle = 'ACCEPTABLE';
        statusDescription = 'The sample has a small number of defects within tolerable range. Sample can proceed but should be monitored through processing.';
    }else if(batchIntegrity >= 75 && batchIntegrity <= 87 && beansDetected > 0){
        statusIcon = require('../../assets/icons/yellow_warning_label.png');
        statusColor = '#8D8905';
        statusTitle = 'BORDERLINE';
        statusDescription = 'The defect level is noticeable. Batch should go back to the sorting table before it moves to the next stage.';
    }else if(batchIntegrity >= 50 && batchIntegrity <= 74 && beansDetected > 0){
        statusIcon = require('../../assets/icons/rejected_icon.png');
        statusColor = '#A71E22';
        statusTitle = 'POOR';
        statusDescription = 'The sample has a significant defect load. Do not move forward. Pull it out of the queue and schedule a full-resort.';
    }else if(batchIntegrity >= 0 && batchIntegrity <= 49 && beansDetected > 0){
        statusIcon = require('../../assets/icons/rejected_icon.png');
        statusColor = '#A71E22';
        statusTitle = 'DISQUALIFIED';
        statusDescription = 'Defect score is too high to recover through sorting alone. The sample should be separated and reviewed for disposal or downgrading.';
    }else{
        statusIcon = require('../../assets/icons/question_icon.png')
        statusColor = '#000';
        statusTitle = 'NO DATA';
        statusDescription = "We couldn't find any beans in the image, or the device failed to detect them.";
    }

    // data for breakdown summary
    const catOneData = [
        {id: 1, name: 'Full Black', num: fullBlack},
        {id: 2, name: 'Full Sour', num: fullSour},
        {id: 3, name: 'Dried Cherry/Pod', num: driedCherryPod},
        {id: 4, name: 'Fungus Damage', num: fungusDamage},
        {id: 5, name: 'Severe Insect Damage', num: severeInsectDamage},
        {id: 6, name: 'Foreign Matter', num: foreignMatter}
    ];

    const catTwoData = [
        {id: 1, name: 'Partial Black', num: partialBlack},
        {id: 2, name: 'Partial Sour', num: partialSour},
        {id: 3, name: 'Parchment/Pergamino', num: parchmentPergamino},
        {id: 4, name: 'Slight Insect Damage', num: slightInsectDamage},
        {id: 5, name: 'Floater', num: floater},
        {id: 6, name: 'Immature/Unripe', num: immatureUnripe},
        {id: 7, name: 'Withered', num: withered},
        {id: 8, name: 'Shell', num: shell},
        {id: 9, name: 'Broken/Chipped/Cut', num: brokenChippedCut},
        {id: 10, name: 'Hull/Husk', num: hullHusk}
    ];

return (
    <View style={styles.container}>

        {/* :: 1 */}
        <View style={styles.head}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Image
                    source={require('../../assets/icons/arrow_back_icon.png')}
                    style={styles.icon}
                />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>RESULTS</Text>

            {/* Empty Placeholder to balance the 'space-between' layout */}
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Image
                    source={require('../../assets/icons/download icon.png')}
                    style={{height: 22, width: 22}}
                />
            </TouchableOpacity>
        </View> {/* :: head */}


        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>

            <View style={styles.content}>
                {/* :: For Image */}
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, width: 68, height: 20,}}>
                        <Image
                            source={require('../../assets/icons/good_bean.png')}
                            style={{width: 14, height: 14, resizeMode: 'contain'}}
                        />
                        <Text style={styles.semiboldText}> GOOD</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, width: 68, height: 20,}}>
                        <Image
                            source={require('../../assets/icons/cat1.png')}
                            style={{width: 14, height: 14, resizeMode: 'contain'}}
                        />
                        <Text style={styles.semiboldText}> CAT I</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, width: 68, height: 20,}}>
                        <Image
                            source={require('../../assets/icons/cat2.png')}
                            style={{width: 14, height: 14, resizeMode: 'contain'}}
                        />
                        <Text style={styles.semiboldText}> CAT II</Text>
                    </View>
                </View>
                <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} onLayout={e => console.log(e.nativeEvent.layout)}>
                <DetectionBoxOverlay
                    imageSource={{ uri: imageUri }}
                    detections={result.detections}
                    showLabels
                    colorByCategory
                    style={{width: 306, height: 400, resizeMode: 'contain', backgroundColor: '#FFFFFF', marginTop: 20, marginBottom: 20}}
                />
                </ViewShot>
                <View style={{borderColor: '#A7A7A2', borderBottomWidth: 1, borderStyle: 'solid', width: 306, color: '#A7A7A2'}}></View>

                {/* :: Outer Container for Summary */}
                <View style={styles.summaryContainer}>

                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <Image source={statusIcon} style={styles.largeIcon}/>
                    </View>

                    <View style={styles.box}>
                        <Text style={{fontFamily: 'CascadiaMono-Regular', fontSize: 17, color: statusColor}}>{statusTitle}</Text>
                        <Text style={{fontFamily: 'CascadiaMono-Regular', fontSize: 12, color:'#A7A7A2', width: 209}}>{statusDescription}</Text>
                    </View>
                </View>  {/* :: summaryContainer */}

                <View style={styles.secondSummaryContainer}>
                    <View style={styles.genBox}>
                        {/*  1 :: Batch Integrity*/}
                        <Text style={{fontFamily: 'Poppins-SemiBold', fontSize: 40, color: statusColor, marginBottom: -50}}>{batchIntegrity}%</Text>
                        <Text style={{fontFamily: 'CascadiaMono-Regular', fontSize: 10, color: '#A7A7A1'}}>SAMPLE INTEGRITY</Text>
                    </View>

                    <View style={{borderColor: '#A7A7A2', borderLeftWidth: 1, borderStyle: 'solid', height: 68, color: '#A7A7A2'}}></View>

                    <View style={styles.genBox}>
                        {/*  2 :: Defect Score*/}
                        <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                            <Text style={{fontFamily: 'Poppins-Regular', fontSize: 40, color: '#2E1D0B', marginRight: 10}}>{totalDefectScore}</Text>
                            <Text style={{fontFamily: 'CascadiaMono-SemiBold', fontSize: 15, color: '#2E1D0B'}}>TOTAL{"\n"}DEFECT{"\n"}SCORE</Text>
                        </View>
                        <View>
                            <Text style={{fontFamily: 'CascadiaMono-Regular', fontSize: 10, color: '#A7A7A1'}}>
                            <Text style={{fontFamily: 'Poppins-SemiBold', color: '#2E1D0B'}}>{officialBeans} </Text>
                            TOTAL BEANS DETECTED</Text>
                        </View>
                    </View> {/* :: genBox */}
                </View> {/* :: secondSummaryContainer */}

            {beansDetected > 0 ? (
                <>
                <View style={styles.thirdSummaryContainer}>
                    <View style={styles.catBox}>
                        <Text style={{fontFamily: 'CascadiaMono-Regular', fontSize: 25, textAlign: 'center',color: '#A81717'}}>{categoryOne}</Text>
                        <Text style={{fontFamily: 'CascadiaMono-Regular', textAlign: 'center', fontSize: 14, color: '#775242'}}>CAT I DEFECTS</Text>
                    </View>
                    <View style={styles.catBox}>
                        <Text style={{fontFamily: 'CascadiaMono-Regular', fontSize: 25, textAlign: 'center',color: '#8D8905'}}>{categoryTwo}</Text>
                        <Text style={{fontFamily: 'CascadiaMono-Regular', textAlign: 'center', fontSize: 14, color: '#775242'}}>CAT II DEFECTS</Text>
                    </View>
                </View>
                <View style={styles.breakDownSummary}>

                    <Text style={{alignSelf: 'flex-start', fontFamily: 'Poppins-Bold', fontSize: 11, marginBottom: 9, color: '#A81717', marginLeft: 10}}>
                        Category I Defects
                    </Text>
                    <View style={styles.catOneTable}>
                        {catOneData.map((item, index) => (
                            <View
                                key={item.id}
                                style={[
                                    styles.row,
                                    index === catOneData.length - 1 && {borderBottomWidth: 0}
                                ]}
                            >
                                <Text style={styles.cellOne}>{item.name}</Text>
                                <Text style={styles.cellTwo}>{item.num}</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={{alignSelf: 'flex-start', fontFamily: 'Poppins-Bold', fontSize: 11, marginBottom: 9, color: '#8D8905', marginLeft: 10}}>
                        Category II Defects
                    </Text>
                    <View style={styles.catTwoTable}>
                        {catTwoData.map((item, index) => (
                            <View
                                key={item.id}
                                style={[
                                    styles.row,
                                    index === catTwoData.length - 1 && {borderBottomWidth: 0}
                                ]}
                            >
                                <Text style={styles.cellOne}>{item.name}</Text>
                                <Text style={styles.cellTwo}>{item.num}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                </>
                ) : (

                /* Fallback UI if no beans detected */
                <View style={[styles.secondSummaryContainer, {justifyContent: 'center', marginBottom: '10%'}]}>
                    <Text style={{fontFamily: 'CascadiaMono-Regular', color: '#A7A7A2'}}>
                    No numerical data available
                    </Text>
                </View>
                )}
                {/* Save Report Button */}

                <TouchableOpacity
                    onPress={() => {

                        console.log("Saving data...");
                        // saveReport(); // sample to call on function to save the report
                    }}
                    style={{ marginTop: 20, marginBottom: 40 }}
                >
                    <View style={{
                        flexDirection: 'row',
                        gap: 10,
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 180,
                        height: 48,
                        borderWidth: 1,
                        borderColor: '#775242',
                        borderRadius: 15,
                        backgroundColor: '#FFFFFF'
                    }}>
                        <Image
                            source={require('../../assets/icons/download icon.png')}
                            style={{ width: 18, height: 18, resizeMode: 'contain', tintColor: '#775242' }}
                        />
                        <Text style={{
                            fontFamily: 'Poppins-Medium',
                            fontSize: 14,
                            color: '#775242'
                        }}>
                            Save Report
                        </Text>
                    </View>
                </TouchableOpacity>

            </View>
        </ScrollView>
    </View>
);};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    head: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: '#333333',
    },
    icon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    largeIcon: { // results icon
        width: 43,
        height: 43,
        resizeMode: 'contain'
    },
    placeholder: {
        width: 30, // Matches icon width
        height: 30,
    },
    content: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
    },
    placeholderText: {
        fontFamily: 'Poppins-Regular',
        color: '#999999',
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: 310,
        margin: 10
    },
    box: {
        flex: 2,
        marginLeft: 10,
    },
    secondSummaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: 290,
        height: 82,
        borderColor: '#A7A7A2',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderStyle: 'solid',
        marginBottom: 20
    },
    genBox: {
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 10,
        height: '100%'
    },
    thirdSummaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: 301,
        height: 82
    },
    catBox: {
        flexDirection: 'column',
        height: '100%',
        borderColor: '#775242',
        borderWidth: 1,
        width: 144,
        borderRadius: 14,
        padding: 10
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingBottom: 20,
    },
    breakDownSummary: {
        width: 310,
        height: 560,
        borderColor: '#775242',
        borderWidth: 1,
        borderRadius: 14,
        padding: 10,
        marginTop: 20,
        alignItems: 'center',
        marginBottom: 20},
    catOneTable: {
        justifyContent: 'center',
        width: 273,
        height: 165,
        borderColor: '#CFCFCF',
        borderWidth: 1,
        borderRadius: 15,
        marginBottom: 19
    },
    catTwoTable: {
        justifyContent: 'center',
        width: 273,
        height: 280,
        borderColor: '#CFCFCF',
        borderWidth: 1,
        borderRadius: 15,
        marginBottom: '20%'
    },
    row: {
        flexDirection: 'row',
        borderColor: '#CFCFCF',
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 27
    },
    cellOne: {
        textAlign: 'left',
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        marginLeft: 15,
        alignItems: 'space-between'
    },
    cellTwo: {
        textAlign: 'right',
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        alignItems: 'space-between',
        marginRight: 20
    }

});

export default reportPage;