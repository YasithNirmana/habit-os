import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildHtml } from './buildHtml';
import type { Report } from '../hooks/useRangeReport';

/**
 * Renders the report to a PDF on the device and hands it to the OS share
 * sheet, which is how you get it into Drive, Files, WhatsApp or email.
 */
export async function exportPdf(report: Report): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: buildHtml(report) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Habit OS · ${report.from} to ${report.to}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    // No share sheet (rare on Android); fall back to the print dialog.
    await Print.printAsync({ uri });
  }
}
