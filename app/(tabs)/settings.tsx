import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getFontSizeValue } from '@/utils/fontSizes';

const themeColors = {
  light: {
    background: '#fff',
    text: '#222',
    subtext: '#888',
    option: '#eee',
    selected: '#4a90e2',
    signOut: '#d00',
  },
};

const fontSizeOptions = [
  { label: 'Small', value: 'small' },
  { label: 'Normal', value: 'medium' },
  { label: 'Large', value: 'large' },
];

import { useLanguage } from '@/contexts/LanguageContext';
const SettingsScreen = () => {
  const [theme] = React.useState<'light'>('light');
  const [fontSize, setFontSize] = React.useState<'small' | 'medium' | 'large'>('medium');
  const { lang, setLang } = useLanguage();
  const colors = themeColors['light'];
  const fontSizeValue = getFontSizeValue(fontSize);

  const labels = {
    header: lang === 'zh' ? '设置' : 'Settings',
    appearance: lang === 'zh' ? '外观' : 'Appearance',
    light: lang === 'zh' ? '浅色' : 'Light',
    language: lang === 'zh' ? '语言' : 'Language',
    textSize: lang === 'zh' ? '文字大小' : 'Text Size',
    small: lang === 'zh' ? '小' : 'Small',
    medium: lang === 'zh' ? '中' : 'Normal',
    large: lang === 'zh' ? '大' : 'Large',
    appearanceNote: lang === 'zh' ? '仅支持浅色模式。' : 'Only light mode is supported.',
    contact: lang === 'zh' ? '联系团队' : 'Contact Team',
    signOut: lang === 'zh' ? '退出登录' : 'Sign Out',
  };

  return (
    <View style={[styles.container, { backgroundColor: "#ffffffff" }]}> 
      <Text style={[styles.header, { color: colors.text, fontSize: fontSizeValue + 12 }]}>{labels.header}</Text>

      {/* Appearance (only light mode) */}
      <Text style={[styles.sectionTitle, { color: colors.subtext, fontSize: fontSizeValue }]}>{labels.appearance}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: colors.selected }]}
          activeOpacity={1}
        >
          <Text style={[styles.optionText, { color: colors.text, fontSize: fontSizeValue }]}> 
            {labels.light}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Language Picker */}
      <Text style={[styles.sectionTitle, { color: colors.subtext, fontSize: fontSizeValue }]}>{labels.language}</Text>
      <View style={styles.pickerRow}>
        <Picker
          selectedValue={lang}
          style={{ flex: 1, color: colors.text, backgroundColor: colors.option }}
          onValueChange={(itemValue) => setLang(itemValue)}
          mode="dropdown"
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="中文" value="zh" />
        </Picker>
      </View>

      {/* Text Size */}
      <Text style={[styles.sectionTitle, { color: colors.subtext, fontSize: fontSizeValue }]}>{labels.textSize}</Text>
      <View style={styles.row}>
        {fontSizeOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionButton,
              { backgroundColor: fontSize === opt.value ? colors.selected : colors.option },
            ]}
            onPress={() => setFontSize(opt.value as 'small' | 'medium' | 'large')}
          >
            <Text style={[styles.optionText, { color: colors.text, fontSize: fontSizeValue }]}>{
              opt.value === 'small' ? labels.small :
              opt.value === 'medium' ? labels.medium :
              opt.value === 'large' ? labels.large : ''
            }</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.subtext, { color: colors.subtext, fontSize: fontSizeValue }]}>{labels.appearanceNote}</Text>

      {/* Footer */}
      <TouchableOpacity>
        <Text style={[styles.link, { color: colors.selected, fontSize: fontSizeValue }]}>{labels.contact}</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={[styles.signOut, { color: colors.signOut, fontSize: fontSizeValue }]}>{labels.signOut}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginRight: 8,
  },
  optionText: {
    fontWeight: 'bold',
  },
  subtext: {
    marginBottom: 32,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  link: {
    marginBottom: 24,
    textAlign: 'center',
  },
  signOut: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SettingsScreen;