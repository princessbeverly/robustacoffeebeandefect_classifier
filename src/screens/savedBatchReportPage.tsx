
import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, Alert, Modal, TextInput, Pressable} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadReports, deleteReport, renameReport, SavedReport } from '../utils/reportStorage';
import { useIsFocused } from '@react-navigation/native';
import { generateReportHTML } from '../utils/reportHtml';
import { createPDF } from '../services/reportService';

const reportSavedBatchPage = ({ navigation }: any) => {
    const [reports, setReports] = useState<SavedReport[]>([]);
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
    const [newTitle, setNewTitle] = useState('');

  // Reload list every time this screen comes into focus
    useFocusEffect(
        useCallback(() => {
        loadReports().then(setReports);
        }, []),
    );

    // PDF export handler (placeholder metadata for now, will need to store real values in report storage later)
    const handleExportPdf = async (report: SavedReport) => {
    try {
        const html = await generateReportHTML(report, {
        analyzerName: report.meta?.analyzerName ?? '—',
        origin: report.meta?.origin ?? '—',
        producer: report.meta?.producer ?? '—',
        weightG: report.meta?.weightG ?? 0,
        });

        const path = await createPDF(html, report.id);
        console.log('PDF saved:', path);
    } catch (e) {
        console.error('Export failed:', e);
    }
    };
    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Report',
            'Are you sure you want to delete this report? This cannot be undone.',
        [
        { text: 'Cancel', style: 'cancel' },
        {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
                await deleteReport(id);
                setReports(prev => prev.filter(r => r.id !== id));
            },
        },
        ],
    );
    };

    const handleOpenRename = (report: SavedReport) => {
        setSelectedReport(report);
        setNewTitle(report.title);
        setRenameModalVisible(true);
    };

    const handleRenameConfirm = async () => {
        if (!selectedReport) return;
        const trimmed = newTitle.trim();
        if (!trimmed) return;
        await renameReport(selectedReport.id, trimmed);
        setReports(prev =>
        prev.map(r => (r.id === selectedReport.id ? { ...r, title: trimmed } : r)),
    );
    setRenameModalVisible(false);
    };

    const handleOpen = (report: SavedReport) => {
        // We pass 'isSavedReport: true' so reportPage knows to use the stored numbers
            navigation.navigate('reportPage', {
            result: report.result,
            isSavedReport: true
        });
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

  const renderItem = ({ item }: { item: SavedReport }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleOpen(item)} activeOpacity={0.85}>
        <View style={styles.cardText}>
            <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
            </Text>
            <Text style={styles.cardMeta}>Total Number of Beans: {item.result.beansDetected}</Text>
            <Text style={styles.cardMeta}>Time Taken: {formatDate(item.savedAt)}</Text>
        </View>

        <View style={styles.cardActions}>
            {/* Rename / folder icon */}
            <TouchableOpacity onPress={() => handleOpenRename(item)} hitSlop={8}>
                <Image
                    source={require('../../assets/icons/folder_icon.png')}
                    style={[styles.actionIcon, { tintColor: '#775242' }]}
                />
            </TouchableOpacity>

        {/* Save / export icon */}
            <TouchableOpacity onPress={() => handleExportPdf(item)}  hitSlop={8}>
                <Image
                    source={require('../../assets/icons/download icon.png')}
                    style={[styles.actionIcon, { tintColor: '#14AE5C' }]}
                />
            </TouchableOpacity>

        {/* Delete icon */}
            <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={8}>
                <Image
                    source={require('../../assets/icons/delete_icon.png')}
                    style={[styles.actionIcon, { tintColor: '#A71E22' }]}
                />
            </TouchableOpacity>
        </View>
    </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.head}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Image
                        source={require('../../assets/icons/arrow_back_icon.png')}
                        style={styles.icon}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>FILES</Text>
            {/* Spacer to balance layout */}
                <View style={styles.icon} />
            </View>

            {/* Empty state */}
            {reports.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No saved reports yet.</Text>
                    <Text style={styles.emptySubtitle}>
                        Save a result from the scan page and it will appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={reports}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Rename Modal */}
            <Modal
                visible={renameModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setRenameModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setRenameModalVisible(false)}>
                    <Pressable style={styles.modalBox} onPress={() => {}}>
                        <Text style={styles.modalTitle}>Rename Report</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={newTitle}
                            onChangeText={setNewTitle}
                            placeholder="Enter report name"
                            placeholderTextColor="#A7A7A2"
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setRenameModalVisible(false)}>
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnConfirm]}
                                onPress={handleRenameConfirm}>
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
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    cardText: {
        flex: 1,
        marginRight: 12,
    },
    cardTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: '#333333',
        marginBottom: 2,
    },
    cardMeta: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        color: '#A7A7A2',
        lineHeight: 16,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    actionIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: '#333333',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#A7A7A2',
        textAlign: 'center',
        lineHeight: 20,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        width: 300,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: '#333333',
        marginBottom: 16,
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
        gap: 10,
    },
    modalBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    modalBtnCancel: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    modalBtnCancelText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: '#A7A7A2',
    },
    modalBtnConfirm: {
        backgroundColor: '#775242',
    },
    modalBtnConfirmText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: '#FFFFFF',
    },
});

export default reportSavedBatchPage;
