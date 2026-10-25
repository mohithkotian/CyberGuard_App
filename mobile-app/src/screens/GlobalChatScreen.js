import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, globalStyles } from '../utils/theme';
import { chatsAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import { format } from 'date-fns';
import CyberBackground from '../components/CyberBackground';

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
    let roleColor = colors.cyber;
    if (role === 'admin') roleColor = colors.danger;
    else if (role === 'officer') roleColor = colors.accent;

    return (
      <View style={[styles.msgWrapper, isMe ? styles.msgWrapperMe : styles.msgWrapperOther]}>
        <View style={[styles.msgCard, isMe ? styles.msgCardMe : styles.msgCardOther]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.senderName, { color: isMe ? colors.accent : '#FFFFFF' }]}>
                {item.sender?.name || 'Citizen'}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: `${roleColor}25`, borderColor: roleColor }]}>
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
    <SafeAreaView style={globalStyles.screen}>
      <CyberBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '900' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>CYBER DEFENSE COMMS</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={styles.liveDot} />
            <Text style={styles.headerSub}>PUBLIC INTELLIGENCE & CITIZEN NETWORK</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={{ color: colors.muted, marginTop: 12, fontSize: 12 }}>Establishing Secure Uplink...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.chatInput}
            placeholder="Broadcast message to cyber defense room..."
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]} 
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Text style={{ color: '#030A14', fontSize: 16, fontWeight: '900' }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    letterSpacing: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
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
    backgroundColor: 'rgba(0, 180, 255, 0.15)',
    borderColor: 'rgba(0, 180, 255, 0.4)',
    borderBottomRightRadius: 2,
  },
  msgCardOther: {
    backgroundColor: 'rgba(12, 22, 45, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '800',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timestamp: {
    color: colors.muted,
    fontSize: 9,
  },
  msgBody: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 18, 36, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 180, 255, 0.2)',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(15, 25, 50, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
