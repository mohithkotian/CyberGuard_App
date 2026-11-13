import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, globalStyles, typography } from '../utils/theme';
import CyberBackground from '../components/CyberBackground';
import ScreenHeader from '../components/ScreenHeader';
import IconGlyph from '../components/IconGlyph';

const ATTACK_PRESETS = [
  {
    title: 'Electricity Bill Notice',
    text: 'Dear Consumer, Your Electricity power will be disconnected tonight at 9.30 PM from electricity office because your previous month bill was not updated. Please immediately contact our power officer 9800000001 or pay via upi: fast.power@paytm'
  },
  {
    title: 'Urgent KYC Suspension',
    text: 'URGENT: SBI customer, your YONO account is suspended today due to missing Aadhaar KYC. Update immediately at http://sbi-kyc-secure-auth.com or your account will be permanently blocked within 24 hours.'
  },
  {
    title: 'Digital Arrest Threat',
    text: 'CBI & Cyber Crime Cell Notice: A parcel containing illicit narcotics and fake passports under your Aadhaar has been seized at Mumbai Airport. Join immediate Skype investigation or arrest warrant will be issued. Contact DCP Officer at +91 9800000009.'
  },
  {
    title: 'Part-Time Job Scam',
    text: 'Earn Rs 5000 to Rs 15000 daily by liking YouTube videos and rating Google maps. No experience needed! Free registration. Join telegram channel @crypto_wealth_signals_vip to claim your Rs 500 joining bonus.'
  }
];

export default function ForensicScannerScreen({ navigation }) {
  const [text, setText] = useState('');
  const [report, setReport] = useState(null);

  const analyzeContent = () => {
    const raw = text.trim();
    if (!raw || raw.length < 10) {
      Alert.alert('Insufficient Text', 'Please paste at least 10 characters of the suspicious message.');
      return;
    }

    // 1. Regex IOC Extractors
    const phoneRegex = /(?:\+?91[\-\s]?)?[6-9]\d{9}|\b\d{10,12}\b/g;
    const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
    const urlRegex = /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*/gi;
    const ifscRegex = /[A-Z]{4}0[A-Z0-9]{6}/gi;

    const phones = Array.from(new Set(raw.match(phoneRegex) || []));
    const upis = Array.from(new Set(raw.match(upiRegex) || []));
    const urls = Array.from(new Set(raw.match(urlRegex) || []));
    const ifscs = Array.from(new Set(raw.match(ifscRegex) || []));

    // 2. Keyword & Threat Patterns
    const lower = raw.toLowerCase();
    let score = 0;
    const indicators = [];
    let detectedType = 'General Suspicious Communication';

    if (lower.includes('electric') || lower.includes('power') || lower.includes('disconnected') || lower.includes('bill')) {
      score += 35;
      indicators.push('Utility disconnection urgency');
      detectedType = 'Utility Disconnection Phishing';
    }
    if (lower.includes('kyc') || lower.includes('pan card') || lower.includes('aadhaar') || lower.includes('suspended') || lower.includes('yono')) {
      score += 40;
      indicators.push('Banking KYC suspension threat');
      detectedType = 'Banking KYC Phishing';
    }
    if (lower.includes('cbi') || lower.includes('police') || lower.includes('arrest') || lower.includes('customs') || lower.includes('narcotics') || lower.includes('parcel')) {
      score += 50;
      indicators.push('Digital arrest & law enforcement impersonation');
      detectedType = 'Digital Arrest Extortion';
    }
    if (lower.includes('telegram') || lower.includes('earn') || lower.includes('bonus') || lower.includes('like youtube') || lower.includes('daily')) {
      score += 35;
      indicators.push('Part-time task / investment bait');
      detectedType = 'Investment / Task Scam';
    }
    if (lower.includes('otp') || lower.includes('password') || lower.includes('pin') || lower.includes('cvv')) {
      score += 45;
      indicators.push('Credential / OTP harvesting prompt');
    }
    if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('within 24 hours') || lower.includes('tonight')) {
      score += 20;
      indicators.push('Urgency pressure & artificial deadline');
    }

    if (urls.length > 0) {
      score += 30;
      indicators.push(`Extracted suspicious web link (${urls.length})`);
    }
    if (upis.length > 0) {
      score += 25;
      indicators.push(`Extracted UPI payment handle (${upis.length})`);
    }
    if (phones.length > 0) {
      score += 20;
      indicators.push(`Extracted contact vector (${phones.length})`);
    }

    const finalScore = Math.min(100, Math.max(score, (phones.length + upis.length + urls.length > 0 ? 45 : 20)));
    let riskLevel = 'LOW';
    if (finalScore >= 75) riskLevel = 'CRITICAL';
    else if (finalScore >= 50) riskLevel = 'HIGH';
    else if (finalScore >= 30) riskLevel = 'MEDIUM';

    setReport({
      score: finalScore,
      riskLevel,
      type: detectedType,
      confidence: Math.min(99.4, 75 + (finalScore * 0.24)).toFixed(1),
      indicators,
      iocs: {
        phones,
        upis,
        urls,
        ifscs
      }
    });
  };

  const handleExportToComplaint = () => {
    if (!report) return;
    const suspectInfo = [
      ...report.iocs.phones,
      ...report.iocs.upis,
      ...report.iocs.urls
    ].join(', ');

    navigation.navigate('Submit', {
      prefillTitle: `Suspicious ${report.type}`,
      prefillDescription: `Forensic text analysis detected potential ${report.type} (Threat Score: ${report.score}/100).\n\nOriginal Text:\n${text}\n\nIndicators:\n- ${report.indicators.join('\n- ')}`,
      prefillSuspect: suspectInfo
    });
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <CyberBackground />
      <ScreenHeader
        title="Forensic Scanner"
        subtitle="Automated IOC extraction"
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Input Console */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.label}>Suspicious Message Content</Text>
          <Text style={styles.cardSub}>
            Paste suspicious SMS, WhatsApp message, email, or notice for automated indicator extraction.
          </Text>

          <TextInput
            style={[globalStyles.input, styles.textArea]}
            placeholder="Paste suspicious text here..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={5}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[globalStyles.btnPrimary, { marginTop: 12 }]}
            onPress={analyzeContent}
            activeOpacity={0.8}
          >
            <IconGlyph name="scan" size={18} color="#070B12" strokeWidth={2.4} />
            <Text style={globalStyles.btnPrimaryText}>Analyze Message</Text>
          </TouchableOpacity>

          {/* Preset Attack Scenarios */}
          <View style={styles.presetSection}>
            <Text style={styles.presetHeading}>Quick Test Samples</Text>
            <View style={styles.presetRow}>
              {ATTACK_PRESETS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetChip}
                  onPress={() => {
                    setText(preset.text);
                    setReport(null);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.presetText}>{preset.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Forensic Report Dossier */}
        {report && (
          <View style={{ marginTop: 8 }}>
            <Text style={globalStyles.sectionTitle}>Analysis Report</Text>

            <View style={[
              globalStyles.card,
              { borderColor: report.riskLevel === 'CRITICAL' ? colors.danger : colors.accent }
            ]}>
              <View style={globalStyles.spaceBetween}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.vectorLabel}>Detected Threat Vector</Text>
                  <Text style={styles.vectorTitle}>{report.type}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.scoreNumber, { color: report.score > 70 ? colors.danger : report.score > 40 ? colors.warn : colors.success }]}>
                    {report.score}<Text style={styles.scoreDenominator}>/100</Text>
                  </Text>
                  <Text style={styles.confidenceText}>{report.confidence}% confidence</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View style={[
                  styles.progressBarFill,
                  {
                    width: `${report.score}%`,
                    backgroundColor: report.score > 70 ? colors.danger : report.score > 40 ? colors.warn : colors.success
                  }
                ]} />
              </View>

              {/* Indicators */}
              <View style={styles.indicatorsSection}>
                <Text style={globalStyles.label}>Detected Indicators</Text>
                {report.indicators.map((ind, i) => (
                  <View key={i} style={styles.indicatorRow}>
                    <IconGlyph name="warning" size={14} color={colors.warn} />
                    <Text style={styles.indicatorText}>{ind}</Text>
                  </View>
                ))}
              </View>

              {/* IOCs Extracted */}
              {(report.iocs.phones.length > 0 || report.iocs.upis.length > 0 || report.iocs.urls.length > 0 || report.iocs.ifscs.length > 0) && (
                <View style={styles.iocSection}>
                  <Text style={globalStyles.label}>Extracted Indicators of Compromise (IOCs)</Text>

                  {report.iocs.phones.length > 0 && (
                    <View style={styles.iocRow}>
                      <Text style={styles.iocLabel}>Phones:</Text>
                      <Text style={styles.iocValue}>{report.iocs.phones.join(', ')}</Text>
                    </View>
                  )}

                  {report.iocs.upis.length > 0 && (
                    <View style={styles.iocRow}>
                      <Text style={styles.iocLabel}>UPI IDs:</Text>
                      <Text style={styles.iocValue}>{report.iocs.upis.join(', ')}</Text>
                    </View>
                  )}

                  {report.iocs.urls.length > 0 && (
                    <View style={styles.iocRow}>
                      <Text style={styles.iocLabel}>Links:</Text>
                      <Text style={styles.iocValue}>{report.iocs.urls.join(', ')}</Text>
                    </View>
                  )}

                  {report.iocs.ifscs.length > 0 && (
                    <View style={styles.iocRow}>
                      <Text style={styles.iocLabel}>IFSC:</Text>
                      <Text style={styles.iocValue}>{report.iocs.ifscs.join(', ')}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Export to Complaint */}
              <TouchableOpacity
                style={[globalStyles.btnPrimary, { marginTop: 18 }]}
                onPress={handleExportToComplaint}
                activeOpacity={0.8}
              >
                <IconGlyph name="report" size={18} color="#070B12" strokeWidth={2.4} />
                <Text style={globalStyles.btnPrimaryText}>File Complaint with This Evidence</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  cardSub: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  presetSection: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  presetHeading: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  vectorLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  vectorTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  scoreDenominator: {
    fontSize: 14,
    color: colors.muted,
  },
  confidenceText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 3,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  indicatorsSection: {
    marginTop: 16,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  indicatorText: {
    color: colors.text,
    fontSize: 13,
    flex: 1,
  },
  iocSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  iocRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    gap: 8,
  },
  iocLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    width: 65,
  },
  iocValue: {
    color: colors.accent,
    fontSize: 13,
    flex: 1,
    fontFamily: typography.mono,
  },
});
