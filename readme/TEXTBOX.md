# Auto-Expanding Textbox

Standard pattern for auto-expanding textareas used in forms.

## Usage

```jsx
import { useRef, useEffect } from 'react';
import { Platform } from 'react-native';

const textareaRef = useRef(null);

// Auto-resize on hydration (when content loads from FormStore)
useEffect(() => {
  if (Platform.OS === 'web') {
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = (textareaRef.current.scrollHeight + 8) + 'px';
      }
    });
  }
}, [content]);

// In render:
{Platform.OS === 'web' ? (
  <textarea
    ref={textareaRef}
    value={content}
    onChange={(e) => setContent(e.target.value)}
    placeholder="Your placeholder..."
    maxLength={5000}
    style={{
      fontFamily: 'Comfortaa',
      fontSize: 14,
      padding: 10,
      borderRadius: 8,
      border: '1px solid rgba(92, 90, 88, 0.3)',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      outline: 'none',
      resize: 'none',
      width: '100%',
      minHeight: 120,
      boxSizing: 'border-box',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.15), inset -1px 0 0 rgba(0, 0, 0, 0.15)',
      overflow: 'hidden',
    }}
    onInput={(e) => {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
  />
) : (
  <TextInput
    value={content}
    onChangeText={setContent}
    placeholder="Your placeholder..."
    multiline
    maxLength={5000}
    style={styles.textInput}
  />
)}
<Text style={styles.charCount}>{content.length}/5000</Text>
```

## StyleSheet Styles

```js
inputContainer: {
  flex: 1,
  gap: 4,
  marginBottom: 12,
},
textInput: {
  flex: 1,
  padding: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(92, 90, 88, 0.3)',
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  fontSize: 14,
  fontFamily: 'Comfortaa',
  color: '#403F3E',
  textAlignVertical: 'top',
  minHeight: 120,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 3,
},
charCount: {
  fontSize: 10,
  fontFamily: 'Comfortaa',
  color: '#5C5A58',
  textAlign: 'right',
},
```

## Key Points

1. **Hydration resize**: Use `requestAnimationFrame` in useEffect with `+8` pixels to ensure content from FormStore displays fully on load
2. **Edit resize**: No extra pixels needed in `onInput` handler
3. **Web vs Native**: Web uses `<textarea>` with inline styles, Native uses `<TextInput>` with StyleSheet
4. **boxSizing**: Must be `'border-box'` for proper width calculation
5. **overflow**: Set to `'hidden'` to prevent scrollbars (auto-expand handles overflow)

## Used In

- `CreateWeepingWillowPost.js` - Ask for help form
- `CreatePost.js` - Wishing well post form
- `RespondToPost.js` - Response form (mobile and desktop)
