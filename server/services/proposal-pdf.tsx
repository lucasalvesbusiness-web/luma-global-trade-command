/**
 * Renders a buyer-safe summary PDF of a proposal.
 *
 * Guard-rails (CLAUDE.md): no public price, no firm delivery dates, no
 * partner farm exposure beyond what's already shown in the canvas.
 */

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

import type { ProposalDetail } from '@/server/repositories/types';

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#23241f',
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8a8d6f',
    marginBottom: 4,
  },
  reference: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: '#8a8d6f',
  },
  title: {
    fontSize: 22,
    marginTop: 4,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 12,
    color: '#5b5d4f',
    marginBottom: 24,
  },
  section: {
    marginTop: 18,
    marginBottom: 6,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#8a8d6f',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e3d8',
  },
  rowLabel: { color: '#5b5d4f' },
  rowValue: { color: '#23241f' },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  noteBlock: {
    backgroundColor: '#f7f5ec',
    padding: 12,
    marginTop: 8,
    borderRadius: 4,
  },
  noteAuthor: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#8a8d6f',
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: '#8a8d6f',
    textAlign: 'center',
  },
});

function ProposalSummaryPDF({ detail }: { detail: ProposalDetail }) {
  const buyerVisibleNotes = detail.notes.filter(
    (n) => n.kind === 'TO_BUYER' || n.kind === 'FROM_BUYER',
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Luma Global Trade Command — Proposal summary</Text>
        <Text style={styles.reference}>{detail.reference}</Text>
        <Text style={styles.title}>
          {detail.destinationCountry.name}
          {detail.destinationPort ? ` · ${detail.destinationPort.name}` : ''}
        </Text>
        <Text style={styles.subTitle}>
          {detail.buyerCompany.legalName}
          {detail.incoterm ? ` · Incoterm ${detail.incoterm}` : ''}
        </Text>

        <Text style={styles.section}>Status</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Current</Text>
          <Text style={styles.rowValue}>{detail.status}</Text>
        </View>
        {detail.submittedAt && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Submitted</Text>
            <Text style={styles.rowValue}>
              {new Date(detail.submittedAt).toLocaleString()}
            </Text>
          </View>
        )}

        {detail.loadPlan && (
          <>
            <Text style={styles.section}>Load</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Container</Text>
              <Text style={styles.rowValue}>{detail.loadPlan.containerCode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Items</Text>
              <Text style={styles.rowValue}>{detail.loadPlan.itemsCount}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Pallets</Text>
              <Text style={styles.rowValue}>{detail.loadPlan.totalPallets}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Total weight</Text>
              <Text style={styles.rowValue}>
                {detail.loadPlan.totalWeightKg.toLocaleString()} kg
              </Text>
            </View>
          </>
        )}

        {detail.items.length > 0 && (
          <>
            <Text style={styles.section}>Items</Text>
            {detail.items.map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <Text>
                  {it.productName}
                  {it.varietyName ? ` · ${it.varietyName}` : ''}
                </Text>
                <Text>
                  {it.qtyBoxes} bx · {it.qtyPallets} plt ·{' '}
                  {it.totalWeightKg.toLocaleString()} kg
                </Text>
              </View>
            ))}
          </>
        )}

        {buyerVisibleNotes.length > 0 && (
          <>
            <Text style={styles.section}>Messages</Text>
            {buyerVisibleNotes.map((n) => (
              <View key={n.id} style={styles.noteBlock}>
                <Text style={styles.noteAuthor}>
                  {n.kind === 'FROM_BUYER' ? 'Buyer' : 'Luma team'} ·{' '}
                  {new Date(n.createdAt).toLocaleString()}
                </Text>
                <Text>{n.body}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.footer}>
          Subject to final validation by Luma. This document is a proposal
          summary, not a commercial offer.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderProposalPdf(detail: ProposalDetail): Promise<Buffer> {
  return renderToBuffer(<ProposalSummaryPDF detail={detail} />);
}
