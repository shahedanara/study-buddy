import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { initialsForName, useStudyData, type ChatMessage } from '@/context/StudyData';
import { LoadingState, PageHeading, PersonAvatar, Pill } from '@/components/study-ui';

function formatMessageTime(isoDate: string) {
  return new Date(isoDate).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, ready, sendMessage } = useStudyData();
  const [selectedChannel, setSelectedChannel] = useState(
    data.profile.courses[0] ?? 'Physics 101',
  );
  const [draft, setDraft] = useState('');

  const channels = data.profile.courses;
  const activeChannel = channels.includes(selectedChannel)
    ? selectedChannel
    : channels[0] ?? '';
  const messages = useMemo(
    () =>
      data.messages
        .filter((message) => message.channel === activeChannel)
        .slice()
        .reverse(),
    [data.messages, activeChannel],
  );

  if (!ready) return <LoadingState />;

  const submitMessage = () => {
    if (!draft.trim()) return;
    sendMessage(activeChannel, draft);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12 },
        ]}
      >
        <PageHeading
          eyebrow="Study groups"
          title="Talk it through."
          subtitle="Course rooms make planning easier."
        />
      </View>

      <View style={styles.channels}>
        {channels.length ? (
          <FlatList
            horizontal
            data={channels}
            keyExtractor={(course) => course}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.channelList}
            renderItem={({ item }) => (
              <Pill
                label={item}
                active={selectedChannel === item}
                onPress={() => setSelectedChannel(item)}
              />
            )}
          />
        ) : (
          <Text style={[styles.noChannels, { color: colors.mutedForeground }]}>
            Add a course in your profile to start a chat.
          </Text>
        )}
      </View>

      {channels.length ? (
        <>
          <View style={styles.roomIntro}>
            <View style={[styles.roomIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="users" size={15} color={colors.primary} />
            </View>
            <View style={styles.roomCopy}>
              <Text style={[styles.roomTitle, { color: colors.foreground }]}>
                {selectedChannel} study group
              </Text>
              <Text style={[styles.roomSubtitle, { color: colors.mutedForeground }]}>
                Messages stay on this device
              </Text>
            </View>
            <View style={[styles.onlineDot, { backgroundColor: colors.primary }]} />
          </View>

          <FlatList<ChatMessage>
            inverted
            data={messages}
            keyExtractor={(message) => message.id}
            style={styles.messageList}
            contentContainerStyle={styles.messageContent}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <View style={[styles.emptyChatIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="message-circle" size={22} color={colors.primary} />
                </View>
                <Text style={[styles.emptyChatTitle, { color: colors.foreground }]}>
                  Start the conversation
                </Text>
                <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>
                  Share a question or plan your next study session.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <MessageRow message={item} ownName={data.profile.name} />
            )}
          />

          <View
            style={[
              styles.composerArea,
              {
                paddingBottom:
                  Platform.OS === 'web' ? 46 : Math.max(insets.bottom, 10) + 10,
                borderTopColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          >
            <View style={[styles.composer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                accessibilityLabel="Write a message"
                value={draft}
                onChangeText={setDraft}
                placeholder={`Message ${activeChannel}`}
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={submitMessage}
                style={[styles.input, { color: colors.foreground }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send message"
                testID="send-message"
                disabled={!draft.trim()}
                onPress={submitMessage}
                style={({ pressed }) => [
                  styles.sendButton,
                  {
                    backgroundColor: draft.trim() ? colors.primary : colors.muted,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Feather
                  name="arrow-up"
                  size={18}
                  color={draft.trim() ? colors.primaryForeground : colors.mutedForeground}
                />
              </Pressable>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyChannels}>
          <PersonAvatar initials={initialsForName(data.profile.name)} size={54} />
          <Text style={[styles.emptyChatTitle, { color: colors.foreground }]}>
            Your course rooms are waiting
          </Text>
          <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>
            Add your current courses to your profile to see matching group chats.
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function MessageRow({
  message,
  ownName,
}: {
  message: ChatMessage;
  ownName: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.messageRow,
        message.isMine ? styles.myMessageRow : styles.theirMessageRow,
      ]}
    >
      {!message.isMine ? (
        <PersonAvatar initials={initialsForName(message.author)} size={30} />
      ) : null}
      <View style={[styles.messageColumn, message.isMine && styles.myMessageColumn]}>
        {!message.isMine ? (
          <Text style={[styles.author, { color: colors.mutedForeground }]}>
            {message.author}
          </Text>
        ) : null}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: message.isMine ? colors.primary : colors.card,
              borderColor: message.isMine ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: message.isMine ? colors.primaryForeground : colors.foreground },
            ]}
          >
            {message.text}
          </Text>
        </View>
        <Text
          style={[
            styles.messageTime,
            { color: colors.mutedForeground, textAlign: message.isMine ? 'right' : 'left' },
          ]}
        >
          {message.isMine ? ownName : ''}{message.isMine ? ' · ' : ''}
          {formatMessageTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  channels: {
    minHeight: 47,
  },
  channelList: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  noChannels: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  roomIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 13,
    gap: 10,
  },
  roomIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomCopy: {
    flex: 1,
    gap: 3,
  },
  roomTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  roomSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 13,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 13,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  messageColumn: {
    maxWidth: '82%',
    gap: 4,
  },
  myMessageColumn: {
    alignItems: 'flex-end',
  },
  author: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    paddingHorizontal: 4,
  },
  bubble: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  messageText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  messageTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    paddingHorizontal: 4,
  },
  composerArea: {
    borderTopWidth: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  composer: {
    minHeight: 48,
    maxHeight: 112,
    borderWidth: 1,
    borderRadius: 18,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 34,
    maxHeight: 94,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    paddingVertical: 6,
    outlineStyle: 'none',
  } as never,
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChat: {
    flex: 1,
    minHeight: 260,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    transform: [{ scaleY: -1 }],
  },
  emptyChatIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  emptyChatTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    textAlign: 'center',
  },
  emptyChatText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 250,
  },
  emptyChannels: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
});
