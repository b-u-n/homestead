import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import FontSettingsStore from '../../stores/FontSettingsStore';
import MinkyPanel from '../MinkyPanel';
import ScrollBarView from '../ScrollBarView';

const COLOR_SWATCHES = [
  { name: 'Base', value: '#E8D4C8' },
  { name: 'Pink Overlay', value: '#DE86DF' },
  { name: 'Purple Overlay', value: '#7044C7' },
  { name: 'Blue Scrollbar', value: '#87B4D2' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Coral', value: '#FF6F61' },
  { name: 'Text Primary', value: '#2D2C2B' },
  { name: 'Text Secondary', value: '#454342' },
  { name: 'Border', value: '#5C5A58' },
];

const BazaarStyleGuide = observer(({
  input,
  context,
  onComplete,
  onBack,
  canGoBack
}) => {
  return (
    <View style={styles.container}>
      <ScrollBarView style={styles.scrollContainer}>
        <View style={styles.contentList}>
        {/* Philosophy */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <Text style={[styles.sectionTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(16),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            Aesthetic Philosophy
          </Text>
          <Text style={[styles.bodyText, {
            fontSize: FontSettingsStore.getScaledFontSize(13),
            lineHeight: FontSettingsStore.getScaledSpacing(20),
            color: FontSettingsStore.getFontColor('#454342')
          }]}>
            Homestead is a little handmade world. Everything here should feel like it was stitched, knitted, or sewn with love — soft textures, warm colors, cozy vibes. If it looks like it belongs in a craft basket or a cottagecore daydream, you're on the right track.
          </Text>
        </MinkyPanel>

        {/* Colors */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.sectionTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(16),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            Color Palette
          </Text>
          <View style={styles.swatchGrid}>
            {COLOR_SWATCHES.map(swatch => (
              <View key={swatch.name} style={styles.swatchItem}>
                <View style={[styles.swatchColor, { backgroundColor: swatch.value }]} />
                <Text style={[styles.swatchName, {
                  fontSize: FontSettingsStore.getScaledFontSize(10),
                  color: FontSettingsStore.getFontColor('#2D2C2B')
                }]}>
                  {swatch.name}
                </Text>
                <Text style={[styles.swatchValue, {
                  fontSize: FontSettingsStore.getScaledFontSize(9),
                  color: FontSettingsStore.getFontColor('#454342')
                }]}>
                  {swatch.value}
                </Text>
              </View>
            ))}
          </View>
        </MinkyPanel>

        {/* Fonts */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <Text style={[styles.sectionTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(16),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            Fonts
          </Text>
          <View style={styles.fontList}>
            <View style={styles.fontItem}>
              <Text style={[styles.fontSample, {
                fontFamily: 'SuperStitch',
                fontSize: FontSettingsStore.getScaledFontSize(16),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>
                SuperStitch
              </Text>
              <Text style={[styles.fontDesc, {
                fontSize: FontSettingsStore.getScaledFontSize(11),
                color: FontSettingsStore.getFontColor('#454342')
              }]}>
                Headers and buttons
              </Text>
            </View>
            <View style={styles.fontItem}>
              <Text style={[styles.fontSample, {
                fontFamily: 'Comfortaa',
                fontSize: FontSettingsStore.getScaledFontSize(16),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>
                Comfortaa
              </Text>
              <Text style={[styles.fontDesc, {
                fontSize: FontSettingsStore.getScaledFontSize(11),
                color: FontSettingsStore.getFontColor('#454342')
              }]}>
                Body text
              </Text>
            </View>
            <View style={styles.fontItem}>
              <Text style={[styles.fontSample, {
                fontFamily: 'NeedleworkGood',
                fontSize: FontSettingsStore.getScaledFontSize(16),
                color: FontSettingsStore.getFontColor('#2D2C2B')
              }]}>
                Needlework
              </Text>
              <Text style={[styles.fontDesc, {
                fontSize: FontSettingsStore.getScaledFontSize(11),
                color: FontSettingsStore.getFontColor('#454342')
              }]}>
                Specialty / buttons
              </Text>
            </View>
          </View>
        </MinkyPanel>

        {/* Visual Elements */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <Text style={[styles.sectionTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(16),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            Visual Elements
          </Text>
          <View style={styles.ruleList}>
            <Text style={[styles.ruleText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(19),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              Textures: Wool (button-bg.png), Minky (slot-bg-2.jpeg)
            </Text>
            <Text style={[styles.ruleText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(19),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              Borders: Dashed, not solid — rgba(92, 90, 88, 0.55)
            </Text>
            <Text style={[styles.ruleText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(19),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              Emboss: White text shadows + drop shadows for depth
            </Text>
            <Text style={[styles.ruleText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(19),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              Text color at 0.8 opacity — never full black
            </Text>
          </View>
        </MinkyPanel>

        {/* On Brand Checklist */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16} overlayColor="rgba(112, 68, 199, 0.2)">
          <Text style={[styles.sectionTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(16),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            On Brand Checklist
          </Text>
          <View style={styles.ruleList}>
            <Text style={[styles.checkItem, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#2E7D32')
            }]}>
              Warm, soft, handmade feel
            </Text>
            <Text style={[styles.checkItem, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#2E7D32')
            }]}>
              Pastel or muted color palette
            </Text>
            <Text style={[styles.checkItem, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#2E7D32')
            }]}>
              Textile / craft textures
            </Text>
            <Text style={[styles.checkItem, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#2E7D32')
            }]}>
              Gentle, calming, supportive tone
            </Text>
            <Text style={[styles.checkItem, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#2E7D32')
            }]}>
              Fits cottagecore aesthetic
            </Text>
          </View>

          <Text style={[styles.subTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(14),
            color: FontSettingsStore.getFontColor('#2D2C2B'),
            marginTop: 12,
          }]}>
            Not On Brand
          </Text>
          <View style={styles.ruleList}>
            <Text style={[styles.checkItem, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#C62828')
            }]}>
              Harsh neon colors
            </Text>
            <Text style={[styles.checkItem, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#C62828')
            }]}>
              Sharp geometric shapes
            </Text>
            <Text style={[styles.checkItem, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#C62828')
            }]}>
              Clinical / sterile / corporate
            </Text>
            <Text style={[styles.checkItem, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              color: FontSettingsStore.getFontColor('#C62828')
            }]}>
              Dark, gritty, or unsettling imagery
            </Text>
          </View>
        </MinkyPanel>

        {/* Asset Specs */}
        <MinkyPanel borderRadius={8} padding={16} paddingTop={16}>
          <Text style={[styles.sectionTitle, {
            fontSize: FontSettingsStore.getScaledFontSize(16),
            color: FontSettingsStore.getFontColor('#2D2C2B')
          }]}>
            Asset Specifications
          </Text>
          <View style={styles.ruleList}>
            <Text style={[styles.ruleText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(19),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              Format: PNG only
            </Text>
            <Text style={[styles.ruleText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(19),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              Max file size: 5MB
            </Text>
            <Text style={[styles.ruleText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(19),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              Map sprites: 200x200 to 800x800px recommended
            </Text>
            <Text style={[styles.ruleText, {
              fontSize: FontSettingsStore.getScaledFontSize(13),
              lineHeight: FontSettingsStore.getScaledSpacing(19),
              color: FontSettingsStore.getFontColor('#454342')
            }]}>
              Map sprites must have transparent backgrounds
            </Text>
          </View>
        </MinkyPanel>
        </View>
      </ScrollBarView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 12,
  },
  contentList: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '700',
    marginBottom: 10,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  subTitle: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    marginBottom: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  bodyText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchItem: {
    alignItems: 'center',
    width: 80,
    gap: 3,
  },
  swatchColor: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(92, 90, 88, 0.2)',
  },
  swatchName: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  swatchValue: {
    fontFamily: 'Comfortaa',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  fontList: {
    gap: 12,
  },
  fontItem: {
    gap: 2,
  },
  fontSample: {},
  fontDesc: {
    fontFamily: 'Comfortaa',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  ruleList: {
    gap: 6,
  },
  ruleText: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  checkItem: {
    fontFamily: 'Comfortaa',
    fontWeight: '600',
    paddingLeft: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default BazaarStyleGuide;
