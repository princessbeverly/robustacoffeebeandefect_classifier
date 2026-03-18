
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

const REPORTS_KEY = 'saved_reports';
export type ReportMeta = {
  captureName?: string;
  origin?: string;
  producer?: string;
  weightG?: number;
};

export interface SavedReport {
    id: string;
    title: string;
    savedAt: string;          // ISO string
    batchCount: number;       // number of batches (detections length)
    meta?: ReportMeta;
  // All computed values — so the saved page never needs to recompute
    result: {
        photoPath: string;
        detections: any[];

        // computed scores
        batchIntegrity: number;
        totalDefectScore: number;
        beansDetected: number;
        officialBeans: number;
        categoryOne: number;
        categoryTwo: number;

        // status
        statusTitle: string;
        statusDescription: string;
        statusColor: string;

        // Cat I
        fullBlack: number;
        fullSour: number;
        driedCherryPod: number;
        fungusDamage: number;
        severeInsectDamage: number;
        foreignMatter: number;

        // Cat II
        partialBlack: number;
        partialSour: number;
        parchmentPergamino: number;
        slightInsectDamage: number;
        floater: number;
        immatureUnripe: number;
        withered: number;
        shell: number;
        brokenChippedCut: number;
        hullHusk: number;
    };
}

/** Load all saved reports (newest first) */
export async function loadReports(): Promise<SavedReport[]> {
    try {
        const raw = await AsyncStorage.getItem(REPORTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/** Save a new report — returns the saved report */
export async function saveReport(
    reportData: Omit<SavedReport, 'id' | 'savedAt'>,
): Promise<SavedReport> {
    const existing = await loadReports();

    const newReport: SavedReport = {
        ...reportData,
        id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        savedAt: new Date().toISOString(),
    };

    const updated = [newReport, ...existing];
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
    return newReport;
}

/** Rename a saved report */
export async function renameReport(id: string, newTitle: string): Promise<void> {
    const existing = await loadReports();
    const updated = existing.map(r => (r.id === id ? { ...r, title: newTitle } : r));
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
}

/** Delete a report by id */
export async function deleteReport(id: string): Promise<void> {
    const existing = await loadReports();
    const reportToDelete = existing.find(r => r.id === id);
    const filtered = existing.filter(r => r.id !== id);

    const photoPath = reportToDelete?.result?.photoPath;
    if (photoPath) {
        try {
            const normalizedPath = String(photoPath).replace(/^file:\/\//, '');
            if (normalizedPath.includes('/saved_reports/images/')) {
                const exists = await RNFS.exists(normalizedPath);
                if (exists) {
                    await RNFS.unlink(normalizedPath);
                }
            }
        } catch {
            // Keep deleting the report record even if image cleanup fails.
        }
    }

    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
}

/** Update (merge) report meta by id */
export async function updateReportMeta(id: string, meta: ReportMeta): Promise<void> {
    const existing = await loadReports();
    const updated = existing.map(r =>
        r.id === id
            ? {
                  ...r,
                  meta: {
                      ...(r.meta ?? {}),
                      ...(meta ?? {}),
                  },
              }
            : r,
    );
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
}
