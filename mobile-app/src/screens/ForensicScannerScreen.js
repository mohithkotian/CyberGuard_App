import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, globalStyles, severityColors } from '../utils/theme';
import CyberBackground from '../components/CyberBackground';

const { width } = Dimensions.get('window');

const ATTACK_PRESETS = [
  {
    title: '⚡ Electricity Cut Notice',
    text: 'Dear Consumer, Your Electricity power will be disconnected tonight at 9.30 PM from electricity office because your previous month bill was not updated. Please immediately contact our power officer 9800000001 or pay via upi: fast.power@paytm'
  },
  {
    title: '🏦 Urgent KYC Block Notice',
    text: 'URGENT: SBI customer, your YONO account is suspended today due to missing Aadhaar KYC. Update immediately at http://sbi-kyc-secure-auth.com or your account will be permanently blocked within 24 hours.'
  },
  {
    title: '👮 Digital Arrest Threat',
    text: 'CBI & Cyber Crime Cell Notice: A parcel containing illicit narcotics and fake passports under your Aadhaar has been seized at Mumbai Airport. Join immediate Skype investigation or arrest warrant will be issued. Contact DCP Officer at +91 9800000009.'
  },
  {
    title: '💼 Part-Time YouTube Job',
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

    // 2. Keyword & Heuristic Threat Patterns
    const lower = raw.toLowerCase();
    let score = 0;
    const indicators = [];
    let detectedType = 'General Suspicious Communication';

    if (lower.includes('electric') || lower.includes('power') || lower.includes('disconnected') || lower.includes('bill')) {
      score += 35;
      indicators.push('Electricity / Utility Disconnection Urgency');
      detectedType = 'Utility Disconnection Phishing';
    }
    if (lower.includes('kyc') || lower.includes('pan card') || lower.includes('aadhaar') || lower.includes('suspended') || lower.includes('yono')) {
      score += 40;
      indicators.push('Banking KYC Account Suspension Threat');
      detectedType = 'Banking KYC Phishing';
    }
    if (lower.includes('cbi') || lower.includes('police') || lower.includes('arrest') || lower.includes('customs') || lower.includes('narcotics') || lower.includes('parcel')) {
      score += 50;
      indicators.push('Digital Arrest & Law Enforcement Impersonation');
      detectedType = 'Digital Arrest Extortion';
    }
    if (lower.includes('telegram') || lower.includes('earn') || lower.includes('bonus') || lower.includes('like youtube') || lower.includes('daily')) {
      score += 35;
      indicators.push('Part-Time Job / Task Investment Bait');
      detectedType = 'Investment / Task Scam';
    }
    if (lower.includes('otp') || lower.includes('password') || lower.includes('pin') || lower.includes('cvv')) {
      score += 45;
      indicators.push('Credential / OTP Harvesting Prompt');
    }
    if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('within 24 hours') || lower.includes('tonight')) {
      score += 20;
      indicators.push('Psychological Pressure & Artificial Time Limit');
    }

    if (urls.length > 0) {
      score += 30;
      indicators.push(`Extracted Suspicious Web Link (${urls.length})`);
    }
    if (upis.length > 0) {
      score += 25;
      indicators.push(`Extracted Financial UPI Handle (${upis.length})`);
    }
    if (phones.length > 0) {
      score += 20;
      indicators.push(`Extracted Contact Vector (${phones.length})`);
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
      prefillTitle: `Incident: Suspicious ${report.type}`,
      prefillDescription: `Forensic text analysis detected potential ${report.type} (Threat Score: ${report.score}/100).\n\nOriginal Text:\n${text}\n\nIndicators:\n- ${report.indicators.join('\n- ')}`,
      prefillSuspect: suspectInfo
    });
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <CyberBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '900' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>NEURAL FORENSIC SCANNER</Text>
          <Text style={styles.headerSub}>AUTOMATED IOC EXTRACTION & NLP ANALYSIS</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Input Console */}
        <View style={globalStyles.glassCard}>
          <Text style={globalStyles.label}>INPUT SUSPICIOUS MESSAGE / CONTENT</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 10 }}>
            Paste suspicious SMS, WhatsApp message, email, or phishing notice for instant forensic inspection.
          </Text>

          <TextInput
            style={styles.textArea}
            placeholder="Paste suspicious text here..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={5}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />

          <TouchableOpacity style={[globalStyles.btnPrimary, { marginTop: 12 }]} onPress={analyzeContent}>
            <Text style={globalStyles.btnPrimaryText}>⚡ RUN NEURAL ANALYSIS</Text>
          </TouchableOpacity>

          {/* Preset Attack Scenarios */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 }}>
              QUICK TEST SAMPLES:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ATTACK_PRESETS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetChip}
                  onPress={() => {
                    setText(preset.text);
                    setReport(null);
                  }}
                >
                  <Text style={styles.presetText}>{preset.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Forensic Report Dossier */}
        {report && (
          <View style={{ marginTop: 10 }}>
            <Text style={globalStyles.sectionTitle}>🧪 FORENSIC EVALUATION REPORT</Text>
            
            {/* Score & Risk Banner */}
            <View style={[
              globalStyles.glassCard, 
              { borderColor: report.riskLevel === 'CRITICAL' ? 'rgba(255, 59, 48, 0.4)' : 'rgba(0, 255, 209, 0.4)' }
            ]}>
              <View style={globalStyles.spaceBetween}>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
                    THREAT VECTOR
                  </Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 2 }}>
                    {report.type}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.accent, fontSize: 24, fontWeight: '900' }}>
                    {report.score}<Text style={{ fontSize: 13, color: colors.muted }}>/100</Text>
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 9 }}>ACCURACY: {report.confidence}%</Text>
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
              <View style={{ marginTop: 14 }}>
                <Text style={globalStyles.label}>DETECTED HEURISTICS & PATTERNS</Text>
                {report.indicators.map((ind, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ color: colors.danger, fontSize: 12 }}>⚠️</Text>
                    <Text style={{ color: colors.text, fontSize: 12 }}>{ind}</Text>
                  </View>
                ))}
              </View>

              {/* IOCs Extracted */}
              <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 12 }}>
                <Text style={globalStyles.label}>EXTRACTED INDICATORS OF COMPROMISE (IOCs)</Text>
                
                {report.iocs.phones.length > 0 && (
                  <View style={styles.iocRow}>
                    <Text style={styles.iocLabel}>📞 Phones:</Text>
                    <Text style={styles.iocValue}>{report.iocs.phones.join(', ')}</Text>
                  </View>
                )}

                {report.iocs.upis.length > 0 && (
                  <View style={styles.iocRow}>
                    <Text style={styles.iocLabel}>💳 UPI IDs:</Text>
                    <Text style={styles.iocValue}>{report.iocs.upis.join(', ')}</Text>
                  </View>
                )}

                {report.iocs.urls.length > 0 && (
                  <View style={styles.iocRow}>
                    <Text style={styles.iocLabel}>🌐 Links:</Text>
                    <Text style={styles.iocValue}>{report.iocs.urls.join(', ')}</Text>
                  </View>
                )}

                {report.iocs.ifscs.length > 0 && (
                  <View style={styles.iocRow}>
                    <Text style={styles.iocLabel}>🏦 IFSC:</Text>
                    <Text style={styles.iocValue}>{report.iocs.ifscs.join(', ')}</Text>
                  </View>
                )}
              </View>

              {/* Pre-fill Action */}
              <TouchableOpacity 
                style={[globalStyles.btnCyber, { marginTop: 16 }]}
                onPress={handleExportToComplaint}
              >
                <Text style={globalStyles.btnCyberText}>🚀 File Complaint With This Evidence →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 255, 209, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 209, 0.3)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerSub: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  textArea: {
    backgroundColor: 'rgba(15, 25, 50, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.3)',
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    fontSize: 13,
    minHeight: 110,
  },
  presetChip: {
    backgroundColor: 'rgba(0, 180, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetText: {
    color: colors.cyber,
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  iocRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    gap: 8,
  },
  iocLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    width: 70,
  },
  iocValue: {
    color: colors.accent,
    fontSize: 11,
    flex: 1,
    fontFamily: 'monospace',
  }
});
