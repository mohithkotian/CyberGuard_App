import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, globalStyles } from '../utils/theme';
import { chatsAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import { format } from 'date-fns';
import CyberBackground from '../components/CyberBackground';
import ScreenHeader from '../components/ScreenHeader';
import IconGlyph from '../components/IconGlyph';

export default function GlobalChatScreen({ navigation }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const { data } = await chatsAPI.getGlobal();
      if (data?.data?.messages) {
        setMessages(data.data.messages);
      }
    } catch (err) {
      console.log('Global chat sync:', err.message);
      // Fallback demo feed if not yet seeded
      if (messages.length === 0) {
        setMessages([
          {
            _id: '1',
            sender: { name: 'Cyber Officer 04', role: 'officer' },
            message: 'All units and citizens: We are monitoring a surge in fake electricity bill SMS. Do not click any unsolicited APK links.',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            _id: '2',
            sender: { name: 'System Sentinel', role: 'admin' },
            message: 'Neural threat filters updated with 2,400+ new phishing IOC vectors.',
            createdAt: new Date(Date.now() - 1800000).toISOString()
          },
          {
            _id: '3',
            sender: { name: 'Citizen Rohan', role: 'citizen' },
            message: 'Just used the Forensic Scanner on a suspicious part-time job offer, flagged instantly as High Risk! Great tool.',
            createdAt: new Date(Date.now() - 600000).toISOString()
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      sender: { name: user?.name || 'Citizen User', role: user?.role || 'citizen' },
      message: trimmed,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setText('');

    try {
      const { data } = await chatsAPI.sendGlobal({ message: trimmed });
      if (data?.data?.message) {
        setMessages(prev => prev.map(m => (m._id === tempId ? data.data.message : m)));
      }
    } catch (err) {
      console.log('Chat send fallback:', err.message);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = user?._id && item.sender?._id ? user._id === item.sender._id : item.sender?.name === user?.name;
    const role = item.sender?.role || 'citizen';
    let roleColor = colors.accent;
    if (role === 'admin') roleColor = colors.danger;
    else if (role === 'officer') roleColor = colors.neonBlue;

    return (
      <View style={[styles.msgWrapper, isMe ? styles.msgWrapperMe : styles.msgWrapperOther]}>
        <View style={[styles.msgCard, isMe ? styles.msgCardMe : styles.msgCardOther]}>
          <View style={styles.msgHeader}>
            <View style={styles.senderInfo}>
              <Text style={[styles.senderName, { color: isMe ? colors.accent : colors.text }]}>
                {item.sender?.name || 'Citizen'}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: `${roleColor}18`, borderColor: `${roleColor}40` }]}>
                <Text style={[styles.roleText, { color: roleColor }]}>{role.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.timestamp}>
              {format(new Date(item.createdAt || Date.now()), 'hh:mm a')}
            </Text>
          </View>
          <Text style={styles.msgBody}>{item.message}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <CyberBackground />
      <ScreenHeader
        title="Community Comms"
        subtitle="Citizen defense network"
        navigation={navigation}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        style={{ flex: 1 }}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.loadingText}>Connecting to Comms Channel...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.chatListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.chatInput}
            placeholder="Share intelligence or report note..."
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
            accessibilityLabel="Send message"
          >
            <IconGlyph name="send" size={18} color="#070B12" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 13,
  },
  chatListContent: {
    padding: 16,
    paddingBottom: 16,
  },
  msgWrapper: {
    marginBottom: 12,
    width: '100%',
  },
  msgWrapperMe: {
    alignItems: 'flex-end',
  },
  msgWrapperOther: {
    alignItems: 'flex-start',
  },
  msgCard: {
    maxWidth: '85%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  msgCardMe: {
    backgroundColor: 'rgba(61, 245, 192, 0.1)',
    borderColor: 'rgba(61, 245, 192, 0.3)',
    borderBottomRightRadius: 3,
  },
  msgCardOther: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderBottomLeftRadius: 3,
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timestamp: {
    color: colors.muted,
    fontSize: 11,
  },
  msgBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
