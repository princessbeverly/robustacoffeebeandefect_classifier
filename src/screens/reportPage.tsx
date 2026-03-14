
import React, {useRef, useState} from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView,
        Alert, Modal, TextInput, Pressable} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { getDetectionSummary } from '../services/tfliteService';
import { saveReport } from '../utils/reportStorage';
import DetectionBoxOverlay, { type Detection } from '../components/DetectionBoxOverlay';

const reportPage = ({ navigation, route }: any) => {
    const result = route?.params?.result;
    const viewShotRef = useRef(null);

    const isSavedReport = route?.params?.isSavedReport ?? false;
    const [isSaving, setIsSaving] = useState(false);
    const [titleModalVisible, setTitleModalVisible] = useState(false);
    const [reportTitle, setReportTitle] = useState('Untitled Document');

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

    let fullBlack: number,
        fullSour: number,
        driedCherryPod: number,
        fungusDamage: number,
        severeInsectDamage: number,
        foreignMatter: number,
        partialBlack: number,
        partialSour: number,
        parchmentPergamino: number,
        slightInsectDamage: number,
        floater: number,
        immatureUnripe: number,
        withered: number,
        shell: number,
        brokenChippedCut: number,
        hullHusk: number,
        beansDetected: number,
        officialBeans: number,
        categoryOne: number,
        categoryTwo: number,
        totalDefectScore: number,
        batchIntegrity: number,
        statusColor: string,
        statusTitle: string,
        statusDescription: string,
        statusIcon: any;

    const iconMap: Record<string, any> = {
        'RELEASE READY':    require('../../assets/icons/good_result.png'),
        'ACCEPTABLE':       require('../../assets/icons/good_result.png'),
        'BORDERLINE':       require('../../assets/icons/yellow_warning_label.png'),
        'POOR':             require('../../assets/icons/rejected_icon.png'),
        'DISQUALIFIED':     require('../../assets/icons/rejected_icon.png'),
        'NO DATA':          require('../../assets/icons/question_icon.png'),
    };

    if (isSavedReport) {
        // Load pre-computed values from the saved report
        fullBlack = result.fullBlack;
        fullSour = result.fullSour;
        driedCherryPod = result.driedCherryPod;
        fungusDamage = result.fungusDamage;
        severeInsectDamage = result.severeInsectDamage;
        foreignMatter = result.foreignMatter;
        partialBlack = result.partialBlack;
        partialSour = result.partialSour;
        parchmentPergamino = result.parchmentPergamino;
        slightInsectDamage = result.slightInsectDamage;
        floater = result.floater;
        immatureUnripe = result.immatureUnripe;
        withered = result.withered;
        shell = result.shell;
        brokenChippedCut = result.brokenChippedCut;
        hullHusk = result.hullHusk;
        beansDetected = result.beansDetected;
        officialBeans = result.officialBeans;
        categoryOne = result.categoryOne;
        categoryTwo = result.categoryTwo;
        totalDefectScore = result.totalDefectScore;
        batchIntegrity = result.batchIntegrity;
        statusTitle = result.statusTitle;
        statusDescription = result.statusDescription;
        statusColor = result.statusColor;
        // The icon reference might be a number (require'd) or something else.
        // We usually store the title and look up the icon to be safe across app restarts.
        statusIcon = iconMap[statusTitle] ?? iconMap['NO DATA'];
    } else {
        // Calculate values for a fresh scan
        fullBlack = byClass['full-black'] || 0;
        fullSour = byClass['full-sour'] || 0;
        driedCherryPod = byClass['dried-cherry-pod'] || 0;
        fungusDamage = byClass['fungus-damage'] || 0;
        severeInsectDamage = byClass['severe-insect-damage'] || 0;
        foreignMatter = byClass['foreign-matter'] || 0;

        partialBlack = byClass['partial-black'] || 0;
        partialSour = byClass['partial-sour'] || 0;
        parchmentPergamino = byClass['parchment'] || 0;
        slightInsectDamage = byClass['slight-insect-damage'] || 0;
        floater = byClass['floater'] || 0;
        immatureUnripe = byClass['immature'] || 0;
        withered = byClass['withered'] || 0;
        shell = byClass['shell'] || 0;
        brokenChippedCut = byClass['broken-chipped-cut'] || 0;
        hullHusk = byClass['hull'] || 0;

        beansDetected = total || 0;
        officialBeans = (total - foreignMatter) || 0;
        categoryOne = byCategory.cat1 || 0;
        categoryTwo = byCategory.cat2 || 0;

        totalDefectScore =
            Math.floor(partialBlack / 3) +
            Math.floor(partialSour / 3) +
            Math.floor(parchmentPergamino / 5) +
            Math.floor(slightInsectDamage / 10) +
            Math.floor(floater / 5) +
            Math.floor(immatureUnripe / 5) +
            Math.floor(withered / 5) +
            Math.floor(shell / 5) +
            Math.floor(brokenChippedCut / 5) +
            Math.floor(hullHusk / 5) +
            Math.floor(severeInsectDamage / 5) +
            fullBlack + fullSour + driedCherryPod + fungusDamage + foreignMatter;

        batchIntegrity = beansDetected > 0
            ? Math.max(0, Math.round(100 - ((totalDefectScore / beansDetected) * 100)))
            : 0;

        if (batchIntegrity >= 95 && batchIntegrity <= 100 && beansDetected > 0) {
            statusColor = '#14AE5C';
            statusTitle = 'RELEASE READY';
            statusDescription = 'The sample shows minimal defects. Batch is in good condition and can move forward without intervention.';
        } else if (batchIntegrity >= 88 && batchIntegrity <= 94 && beansDetected > 0) {
            statusColor = '#14AE5C';
            statusTitle = 'ACCEPTABLE';
            statusDescription = 'The sample has a small number of defects within tolerable range. Sample can proceed but should be monitored through processing.';
        } else if (batchIntegrity >= 75 && batchIntegrity <= 87 && beansDetected > 0) {
            statusColor = '#8D8905';
            statusTitle = 'BORDERLINE';
            statusDescription = 'The defect level is noticeable. Batch should go back to the sorting table before it moves to the next stage.';
        } else if (batchIntegrity >= 50 && batchIntegrity <= 74 && beansDetected > 0) {
            statusColor = '#A71E22';
            statusTitle = 'POOR';
            statusDescription = 'The sample has a significant defect load. Do not move forward. Pull it out of the queue and schedule a full-resort.';
        } else if (batchIntegrity >= 0 && batchIntegrity <= 49 && beansDetected > 0) {
            statusColor = '#A71E22';
            statusTitle = 'DISQUALIFIED';
            statusDescription = 'Defect score is too high to recover through sorting alone. The sample should be separated and reviewed for disposal or downgrading.';
        } else {
            statusColor = '#000';
            statusTitle = 'NO DATA';
            statusDescription = "We couldn't find any beans in the image, or the device failed to detect them.";
        }
        statusIcon = iconMap[statusTitle] ?? iconMap['NO DATA'];
    }

    const imageUri = result.photoPath.startsWith('file://') ? result.photoPath : `file://${result.photoPath}`;

    // data for breakdown summary
    const catOneData = [
        {id: 1, name: 'Full Black',             num: fullBlack},
        {id: 2, name: 'Full Sour',              num: fullSour},
        {id: 3, name: 'Dried Cherry/Pod',       num: driedCherryPod},
        {id: 4, name: 'Fungus Damage',          num: fungusDamage},
        {id: 5, name: 'Severe Insect Damage',   num: severeInsectDamage},
        {id: 6, name: 'Foreign Matter',         num: foreignMatter}
    ];

    const catTwoData = [
        {id: 1, name: 'Partial Black',          num: partialBlack},
        {id: 2, name: 'Partial Sour',           num: partialSour},
        {id: 3, name: 'Parchment/Pergamino',    num: parchmentPergamino},
        {id: 4, name: 'Slight Insect Damage',   num: slightInsectDamage},
        {id: 5, name: 'Floater',                num: floater},
        {id: 6, name: 'Immature/Unripe',        num: immatureUnripe},
        {id: 7, name: 'Withered',               num: withered},
        {id: 8, name: 'Shell',                  num: shell},
        {id: 9, name: 'Broken/Chipped/Cut',     num: brokenChippedCut},
        {id: 10, name: 'Hull/Husk',             num: hullHusk}
    ];

    const handleSaveConfirm = async () => {
        setTitleModalVisible(false);
        setIsSaving(true);
        try {
            await saveReport({
                title: reportTitle.trim() || 'Untitled Document',
                batchCount: result.detections?.length ?? 0,
                result: {
                    photoPath: result.photoPath,
                    detections: result.detections,
                    batchIntegrity,
                    totalDefectScore,
                    beansDetected,
                    officialBeans,
                    categoryOne,
                    categoryTwo,
                    statusTitle,
                    statusDescription,
                    statusColor,
                    fullBlack, fullSour, driedCherryPod, fungusDamage, severeInsectDamage, foreignMatter,
                    partialBlack, partialSour, parchmentPergamino, slightInsectDamage, floater,
                    immatureUnripe, withered, shell, brokenChippedCut, hullHusk,
                },
            });
            Alert.alert('Report Saved', 'Your report has been successfully saved.');
        } catch (error) {
            console.error('Error saving report:', error);
            Alert.alert('Error', 'An error occurred while saving your report.');
        } finally {
            setIsSaving(false);
        }
    };

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

                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>

                <View style={styles.content}>
                    {/* :: Legend */}
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

                    <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
                        <DetectionBoxOverlay
                            imageSource={{ uri: imageUri }}
                            detections={result.detections}
                            showLabels
                            colorByCategory
                            style={{width: 306, height: 400, resizeMode: 'contain', backgroundColor: '#FFFFFF', marginTop: 20, marginBottom: 20}}
                        />
                    </ViewShot>

                    <View style={{borderColor: '#A7A7A2', borderBottomWidth: 1, borderStyle: 'solid', width: 306}}></View>

                    {/* :: Summary Section */}
                    <View style={styles.summaryContainer}>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Image source={statusIcon} style={styles.largeIcon}/>
                        </View>

                        <View style={styles.box}>
                            <Text style={{fontFamily: 'CascadiaMono-Regular', fontSize: 17, color: statusColor}}>{statusTitle}</Text>
                            <Text style={{fontFamily: 'CascadiaMono-Regular', fontSize: 12, color:'#A7A7A2', width: 209}}>{statusDescription}</Text>
                        </View>
                    </View>

                    <View style={styles.secondSummaryContainer}>
                        <View style={styles.genBox}>
                            <Text style={{fontFamily: 'Poppins-SemiBold', fontSize: 40, color: statusColor, marginBottom: -50}}>{batchIntegrity}%</Text>
                            <Text style={{fontFamily: 'CascadiaMono-Regular', fontSize: 10, color: '#A7A7A1'}}>SAMPLE INTEGRITY</Text>
                        </View>

                        <View style={{borderColor: '#A7A7A2', borderLeftWidth: 1, borderStyle: 'solid', height: 68}}></View>

                        <View style={styles.genBox}>
                            <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                                <Text style={{fontFamily: 'Poppins-Regular', fontSize: 40, color: '#2E1D0B', marginRight: 10}}>{totalDefectScore}</Text>
                                <Text style={{fontFamily: 'CascadiaMono-SemiBold', fontSize: 15, color: '#2E1D0B'}}>TOTAL{"\n"}DEFECT{"\n"}SCORE</Text>
                            </View>
                            <View>
                                <Text style={{fontFamily: 'CascadiaMono-Regular', fontSize: 10, color: '#A7A7A1'}}>
                                    <Text style={{fontFamily: 'Poppins-SemiBold', color: '#2E1D0B'}}>{officialBeans} </Text>
                                    TOTAL BEANS DETECTED
                                </Text>
                            </View>
                        </View>
                    </View>

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
                        <View style={[styles.secondSummaryContainer, {justifyContent: 'center', marginBottom: '10%'}]}>
                            <Text style={{fontFamily: 'CascadiaMono-Regular', color: '#A7A7A2'}}>
                                No numerical data available
                            </Text>
                        </View>
                    )}

                    {!isSavedReport && (
                        <TouchableOpacity
                            onPress={() => setTitleModalVisible(true)}
                            disabled={isSaving}
                            style={{ marginTop: 20, marginBottom: 40 }}>
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
                                backgroundColor: '#FFFFFF',
                                opacity: isSaving ? 0.5 : 1,
                            }}>
                                <Image
                                    source={require('../../assets/icons/download icon.png')}
                                    style={{ width: 18, height: 18, resizeMode: 'contain', tintColor: '#775242' }}
                                />
                                <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#775242' }}>
                                    {isSaving ? 'Saving...' : 'Save Report'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            <Modal
                visible={titleModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setTitleModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setTitleModalVisible(false)}>
                    <Pressable style={styles.modalBox} onPress={() => {}}>
                        <Text style={styles.modalTitle}>Name your report</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={reportTitle}
                            onChangeText={setReportTitle}
                            placeholder="Untitled Document"
                            placeholderTextColor="#A7A7A2"
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setTitleModalVisible(false)}>
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnConfirm]}
                                onPress={handleSaveConfirm}>
                                <Text style={styles.modalBtnConfirmText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

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
    largeIcon: {
        width: 43,
        height: 43,
        resizeMode: 'contain'
    },
    placeholder: {
        width: 30,
        height: 30,
    },
    content: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
    },
    semiboldText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 11,
        color: '#333333',
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
        marginBottom: 20
    },
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
    },
    cellTwo: {
        textAlign: 'right',
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        marginRight: 20
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalBox: {
        width: 300,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: '#333333',
        marginBottom: 16
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#333333',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10
    },
    modalBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10
    },
    modalBtnCancel: {
        borderWidth: 1,
        borderColor: '#E0E0E0'
    },
    modalBtnCancelText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: '#A7A7A2'
    },
    modalBtnConfirm: {
        backgroundColor: '#775242'
    },
    modalBtnConfirmText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: '#FFFFFF'
    }
});

export default reportPage;
