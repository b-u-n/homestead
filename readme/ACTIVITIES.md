# Activities

Activities are therapeutic exercises within the workbook system. Each activity has metadata, tags for bookshelf placement, and a series of steps that users complete.

## Required Readmes

Before building activities, read these first:

- [FLOWS.md](./FLOWS.md) -- flow architecture, drop props, navigation rules
- [DROPS.md](./DROPS.md) -- depth system, size presets, onComplete/onBack
- [WEBSOCKETS.md](./WEBSOCKETS.md) -- event naming (`workbook:*`), WebSocketService.emit
- [MINKYPANEL.md](./MINKYPANEL.md) -- panel structure, overlayColor
- [BUTTONS.md](./BUTTONS.md) + [WOOLBUTTONS.md](./WOOLBUTTONS.md) -- WoolButton variants, auto-styled Text
- [EMBOSS.md](./EMBOSS.md) -- text shadows (`rgba(255,255,255,0.62)`)
- [ARCHITECTURE.md](./ARCHITECTURE.md) -- user object pattern

## Supplemental Readmes

- [USERSETTINGS.md](./USERSETTINGS.md) -- FontSettingsStore, theme colors
- [SCROLLBAR.md](./SCROLLBAR.md) -- ScrollBarView for long content
- [TEXTBOX.md](./TEXTBOX.md) -- auto-expanding textarea (+8px hydration)
- [COLORS.md](./COLORS.md) -- overlay colors, text colors
- [BADGES.md](./BADGES.md) -- progress badges, positioning

---

## Activity JSON Schema

Each activity is a document in MongoDB with this shape:

```javascript
{
  id: String,           // unique kebab-case identifier
  name: String,         // display name
  emoji: String,        // emoji for grid display
  type: String,         // psychoeducation, relaxation, grounding, etc.
  category: String,     // sub-category
  description: {
    what: String,           // what the activity does
    expected_outcome: String,
    target_audience: String,
    contraindications: [String],
    ux_flow: [String]       // step-by-step user flow
  },
  tags: {
    conditions: [String],    // e.g. ['generalized-anxiety', 'panic-disorder']
    themes: [String],        // e.g. ['immediate-relief', 'body-based-coping']
    experience_level: String, // 'beginner' | 'intermediate' | 'advanced'
    difficulty: String       // 'low' | 'moderate' | 'high'
  },
  workflows: Object,
  data_model: Object,
  reflection: Object,
  warnings: Object,
  related_activities: [{ id: String, relationship: String }]
}
```

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique kebab-case identifier (e.g. `what-is-anxiety-cci`) |
| `name` | String | Display name shown in the bookshelf grid |
| `emoji` | String | Emoji rendered on the activity tile |
| `type` | String | Activity category: `psychoeducation`, `relaxation`, `grounding`, etc. |
| `tags.conditions` | String[] | Condition tags that determine bookshelf placement |
| `tags.themes` | String[] | Theme tags for secondary filtering |
| `tags.experience_level` | String | `'beginner'`, `'intermediate'`, or `'advanced'` |
| `tags.difficulty` | String | `'low'`, `'moderate'`, or `'high'` |

---

## Step Type Reference

Activities contain an ordered array of steps. Each step has a `stepId`, a `type`, and type-specific properties. Steps fall into two categories: inline types handled directly by `WorkbookActivity.js`, and component types rendered by dedicated files in `frontend/components/workbook/`.

### Existing Types (inline in WorkbookActivity.js)

#### `text`

Multiline TextInput for free-form responses.

```javascript
{ stepId: 'step-1', type: 'text', prompt: 'How are you feeling?' }
```

Response: `string`

#### `checkbox`

Toggle list for multiple selection.

```javascript
{ stepId: 'step-2', type: 'checkbox', prompt: 'Select all that apply:', options: ['Option A', 'Option B'] }
```

Response: `string[]`

#### `slider`

1-5 numbered button scale.

```javascript
{ stepId: 'step-3', type: 'slider', prompt: 'Rate your experience:' }
```

Response: `number`

#### `multiselect`

Same as checkbox (alias).

---

### New Step Types (components in `frontend/components/workbook/`)

#### `psychoeducation` -- PsychoeducationStep.js

Read-only educational content. No user input -- just "Next" to continue.

```javascript
{
  stepId: 'step-1',
  type: 'psychoeducation',
  prompt: 'Understanding Anxiety',
  content: [
    { type: 'heading', text: 'What is Anxiety?' },
    { type: 'paragraph', text: 'Anxiety is your body\'s...' },
    { type: 'bullets', items: ['Fight response', 'Flight response', 'Freeze response'] },
    { type: 'callout', text: 'Key takeaway: ...' }
  ]
}
```

Response: `null`

Content block types:

| Block Type | Properties | Renders |
|------------|------------|---------|
| `heading` | `text` | Bold section header |
| `paragraph` | `text` | Body paragraph |
| `bullets` | `items: string[]` | Bulleted list |
| `callout` | `text` | Highlighted box for key takeaways |

#### `rating` -- RatingStep.js

Single numeric rating with labeled endpoints.

```javascript
{
  stepId: 'step-2',
  type: 'rating',
  prompt: 'Rate your anxiety level:',
  min: 0, max: 10,
  labels: { min: 'No anxiety', max: 'Extreme anxiety' }
}
```

Response: `number`

#### `likert` -- LikertStep.js

Multiple items each rated on the same scale.

```javascript
{
  stepId: 'step-3',
  type: 'likert',
  prompt: 'Over the last 2 weeks...',
  items: [
    { id: 'gad1', text: 'Feeling nervous, anxious, or on edge' },
    { id: 'gad2', text: 'Not being able to stop worrying' }
  ],
  scale: [
    { value: 0, label: 'Not at all' },
    { value: 1, label: 'A few days' },
    { value: 2, label: 'More than half' },
    { value: 3, label: 'Nearly every day' }
  ]
}
```

Response: `{ gad1: 2, gad2: 3 }`

#### `guided-exercise` -- GuidedExerciseStep.js

Timed/sequenced instruction delivery with breathing, sequential, or timed modes.

```javascript
{
  stepId: 'step-4',
  type: 'guided-exercise',
  prompt: 'Calm Breathing Exercise',
  instructions: [
    { text: 'Breathe in slowly...', duration: 4000 },
    { text: 'Hold...', duration: 2000 },
    { text: 'Breathe out slowly...', duration: 4000 }
  ],
  repeats: 10,
  mode: 'breathing'  // 'breathing' | 'sequential' | 'timed'
}
```

Response: `{ completed: true, cyclesCompleted: 10 }`

| Mode | Behavior |
|------|----------|
| `breathing` | Loops instructions for `repeats` cycles with animated prompt |
| `sequential` | Plays instructions once in order, user advances manually |
| `timed` | Plays instructions once in order, auto-advances by `duration` |

#### `prompt-sequence` -- PromptSequenceStep.js

Multiple sub-prompts answered one at a time.

```javascript
{
  stepId: 'step-5',
  type: 'prompt-sequence',
  prompt: '5-4-3-2-1 Grounding',
  prompts: [
    { id: 'see', prompt: 'Name 5 things you can SEE', count: 5 },
    { id: 'feel', prompt: 'Name 4 things you can FEEL', count: 4 }
  ]
}
```

Response: `{ see: ['lamp', 'desk', ...], feel: ['chair', ...] }`

#### `journal` -- JournalStep.js

Extended writing with optional timer and word count. Timer starts automatically (no start button). Timer and word count display in the footer row below the textarea.

```javascript
{
  stepId: 'step-6',
  type: 'journal',
  prompt: 'Write your worst-case scenario...',
  timerMinutes: 20,
  minWords: 0,
  placeholder: 'Write in vivid detail...',
  showWordCount: true,
  showReread: true
}
```

Response: `string`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `timerMinutes` | number | none | Countdown timer (starts automatically) |
| `minWords` | number | `0` | Minimum word count before "Next" enables |
| `placeholder` | string | `''` | Placeholder text in the textarea |
| `showWordCount` | boolean | `false` | Display live word count (bottom left) |
| `showReread` | boolean | `false` | Show "Reread" button after submission |

#### `likert-reflection` -- LikertReflectionStep.js

Generates a personalized reflection paragraph based on a previous likert step's responses. For each item rated > 0, selects one message based on the score. Each message can be a string or an array of strings (picks one randomly for variety across sessions).

```javascript
{
  stepId: 'reflection',
  type: 'likert-reflection',
  prompt: 'Here\'s what I\'m hearing',
  sourceStepId: 'assessment',  // stepId of the likert step to reflect on
  items: [
    { id: 'gad1', text: 'Feeling nervous, anxious, or on edge' },
    { id: 'gad2', text: 'Not being able to stop or control worrying' }
  ],
  reflections: {
    gad1: {
      1: ['Variation A for score 1...', 'Variation B for score 1...'],
      2: ['Variation A for score 2...', 'Variation B for score 2...'],
      3: ['Variation A for score 3...', 'Variation B for score 3...']
    },
    gad2: {
      1: 'Single string also works for score 1.',
      2: 'Single string for score 2.',
      3: 'Single string for score 3.'
    }
  }
}
```

Response: none (read-only step, like psychoeducation)

| Property | Type | Description |
|----------|------|-------------|
| `sourceStepId` | string | The `stepId` of the likert step whose responses drive the reflection |
| `items` | array | Same items array as the source likert step |
| `reflections` | object | Keyed by item id, then by score. Values are strings or string arrays |

Writing guidelines for reflection messages:
- Validate the person's experience without being patronizing
- Tone: soft words to a friend, "I heard you"
- Score 1 (several days): gentle acknowledgment
- Score 2 (more than half): validation of the weight they're carrying
- Score 3 (nearly every day): deep empathy for the daily reality
- Use 10 variations per item per score for variety across sessions
- All items rated 0: show a positive affirmation for checking in

Note: This component receives `allResponses` (the full `stepResponses` object) instead of `value`/`onChange`, since it reads from a different step's data.

#### `checklist-assessment` -- ChecklistAssessmentStep.js

Checkbox list with scoring and interpretation.

```javascript
{
  stepId: 'step-7',
  type: 'checklist-assessment',
  prompt: 'Is worry a problem for you?',
  items: [
    { id: 'item1', text: 'I worry about many different things' },
    { id: 'item2', text: 'My worry feels uncontrollable' }
  ],
  scoring: {
    thresholds: [
      { min: 0, max: 3, interpretation: 'Normal range' },
      { min: 4, max: 6, interpretation: 'Moderate worry' },
      { min: 7, max: 99, interpretation: 'Significant worry' }
    ]
  }
}
```

Response: `{ checked: ['item1', 'item3'], score: 4, interpretation: 'Moderate worry' }`

Scoring counts the number of checked items and matches against thresholds.

#### `sortable-list` -- SortableListStep.js

Build a ranked list with ratings.

```javascript
{
  stepId: 'step-8',
  type: 'sortable-list',
  prompt: 'Build your fear hierarchy:',
  placeholder: 'Add a feared situation...',
  ratingLabel: 'SUDS (0-100)',
  ratingMin: 0, ratingMax: 100,
  minItems: 5
}
```

Response: `[{ item: 'Ordering food', rating: 40 }, ...]`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placeholder` | string | `''` | Input placeholder for new items |
| `ratingLabel` | string | `''` | Label shown next to the rating input |
| `ratingMin` | number | `0` | Minimum rating value |
| `ratingMax` | number | `100` | Maximum rating value |
| `minItems` | number | `1` | Minimum items required before "Next" enables |

#### `action-plan` -- ActionPlanStep.js

Multi-section structured form.

```javascript
{
  stepId: 'step-9',
  type: 'action-plan',
  prompt: 'Create your action plan:',
  sections: [
    { id: 'problem', label: 'Define the problem', placeholder: 'What is the problem?' },
    { id: 'goal', label: 'Your goal', placeholder: 'What do you want?' },
    { id: 'steps', label: 'Action steps', placeholder: 'List steps...', multiline: true }
  ]
}
```

Response: `{ problem: '...', goal: '...', steps: '...' }`

Each section renders a labeled TextInput. Set `multiline: true` for sections that need multi-line input.

---

## Tag-to-Bookshelf Mapping

Activities use `tags.conditions` and `tags.themes` to determine which bookshelves they appear in. If any of the activity's tags match a bookshelf's matching tags, the activity shows up on that shelf.

| Bookshelf | Matching Condition Tags |
|-----------|------------------------|
| anxiety | `generalized-anxiety`, `generalized-anxiety-disorder`, `panic-disorder`, `social-anxiety`, `specific-phobia`, `health-anxiety`, `anxiety-disorders`, `chronic-worry`, `childhood-anxiety`, `separation-anxiety`, `school-anxiety` |
| stress | `stress`, `chronic-stress` |
| depression | `depression` |
| emotions | `emotion-dysregulation`, `emotional-reasoning` |
| attachment | `attachment` |
| boundaries | `boundaries` |
| loneliness | `loneliness`, `social-isolation` |
| accountability | `accountability`, `perfectionism` |
| self | `self-knowledge`, `self-management` |
| impulses | `impulses`, `self-harm-urges` |
| anger | `anger` |
| adhd | `adhd` |
| burnout | `burnout`, `chronic-illness` |
| grief | `grief` |
| trauma | `PTSD`, `trauma-recovery`, `dissociation` |

---

## Consistency Notes

All activity UI follows the same visual rules as the rest of the app:

| Concern | Rule |
|---------|------|
| Body font | Comfortaa |
| Button font | SuperStitch (via WoolButton auto-styled Text) |
| Primary text color | `#2D2C2B` |
| Muted text color | `#454342` |
| Default text color | `#5C5A58` (step counter, metadata) |
| Text shadow (emboss) | `textShadowColor: 'rgba(255, 255, 255, 0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1` |
| Default text shadow | `textShadowColor: 'rgba(255, 255, 255, 0.62)'` (step counter only) |
| Step content panel | MinkyPanel with `overlayColor: 'rgba(112, 68, 199, 0.2)'` |
| Previous/Back button | WoolButton variant `"purple"` with `overlayColor="rgba(100, 130, 195, 0.25)"` (muted blue) |
| Next button | WoolButton variant `"purple"` |
| Progress indicator | `StitchedProgressBar` -- segmented bar, one stitched cell per step, filled = scrollbar blue |
| Step counter | 12px Comfortaa `#5C5A58`, `rgba(255, 255, 255, 0.62)` shadow |
| Selected item color | Scrollbar blue `rgba(135, 180, 210, 0.55)` |
| Unselected item color | Blue `rgba(100, 130, 195, 0.25)` |
| Font scaling | Use `FontSettingsStore.getScaledFontSize()`, `getFontColor()`, `getScaledSpacing()` |
| Scrollable content | Wrap in ScrollBarView for anything that may overflow |

### Button Layout

```javascript
<View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
  <WoolButton variant="purple" overlayColor="rgba(100, 130, 195, 0.25)" onPress={handlePrevious}>
    Previous
  </WoolButton>
  <WoolButton variant="purple" onPress={handleNext}>
    Next
  </WoolButton>
</View>
```

### Progress Bar

```javascript
import StitchedProgressBar from '../workbook/StitchedProgressBar';

<StitchedProgressBar progress={(currentStepIndex + 1) / totalSteps} steps={totalSteps} />
```

The `StitchedProgressBar` component (`frontend/components/workbook/StitchedProgressBar.js`) renders a textured container with one stitched segment per step. Filled segments use scrollbar blue, unfilled are transparent. First/last segments have rounded corners.

### Step Panel

```javascript
<MinkyPanel overlayColor="rgba(112, 68, 199, 0.2)">
  <Text style={{
    fontFamily: 'Comfortaa',
    color: '#2D2C2B',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  }}>
    {step.prompt}
  </Text>
  {/* step content here */}
</MinkyPanel>
```

### Select Buttons (checkbox, multiselect, slider)

Inline step types use WoolButton with `focused` prop for selected state. Selected items get stitched white borders via WoolButton's built-in focused styling.

```javascript
// Checkbox / multiselect items
<WoolButton
  onPress={() => handleCheckboxToggle(option)}
  variant="purple"
  size="small"
  focused={isChecked}
>
  {(isChecked ? '\u2713  ' : '') + option}
</WoolButton>

// Slider (1-5) buttons
<WoolButton
  onPress={() => handleResponseChange(num)}
  variant="purple"
  size="small"
  focused={isSelected}
>
  {String(num)}
</WoolButton>
```

### Rating Buttons (RatingStep)

Rating step also uses WoolButton with `focused` for the selected number:

```javascript
<WoolButton
  onPress={() => onChange(num)}
  variant="purple"
  size="small"
  focused={value === num}
>
  {String(num)}
</WoolButton>
```

### Likert Scale Options (LikertStep)

Scale options use MinkyPanel pills (not WoolButtons). Selected = scrollbar blue overlay with default stitching and black text. Unselected = muted blue overlay. Text stays black for both states.

```javascript
<MinkyPanel
  borderRadius={6}
  padding={6}
  paddingTop={6}
  overlayColor={isSelected ? 'rgba(135, 180, 210, 0.55)' : 'rgba(100, 130, 195, 0.25)'}
  borderColor={isSelected ? 'rgba(92, 90, 88, 0.55)' : undefined}
>
```

### Checklist Checkboxes (ChecklistAssessmentStep)

Checklist items use WoolButton with a stitched check indicator:

```javascript
// Stitched checkbox indicator
<View style={{
  width: 22, height: 22, borderRadius: 4,
  borderWidth: 2, borderStyle: 'dashed',
  borderColor: isChecked ? 'rgba(255, 255, 255, 0.55)' : 'rgba(92, 90, 88, 0.55)',
  backgroundColor: isChecked ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)',
}}>
  {isChecked && <Text style={{ color: '#2D2C2B', fontSize: 14, fontWeight: '700' }}>{'\u2713'}</Text>}
</View>
```

### Bookshelf Landing

Activities display as a single-column list (one per row, full width). Each row is a MinkyPanel with emoji + title left-aligned, stitched checkbox on right (empty dashed border = incomplete, checkmark with white border = completed at least once). Same stitched checkbox pattern as ChecklistAssessmentStep. See `WorkbookLanding.js`.

---

## Example: Building a Simple Activity

Here is a complete walkthrough for adding a psychoeducation activity.

### 1. Define the activity data

```javascript
{
  activityId: 'what-is-anxiety-cci',
  title: 'What Is Anxiety?',
  emoji: '🧠',
  tags: {
    conditions: ['generalized-anxiety', 'panic-disorder', 'social-anxiety'],
    themes: ['anxiety-education', 'symptom-normalization'],
    experience_level: 'beginner',
    difficulty: 'low'
  },
  steps: [
    {
      stepId: 'intro',
      type: 'psychoeducation',
      prompt: 'Understanding Anxiety',
      content: [
        { type: 'heading', text: 'What is Anxiety?' },
        { type: 'paragraph', text: 'Anxiety is your body\'s natural alarm system...' },
        { type: 'bullets', items: ['Fight response', 'Flight response', 'Freeze response'] }
      ]
    },
    {
      stepId: 'symptoms-check',
      type: 'checkbox',
      prompt: 'Which symptoms do you experience?',
      options: ['Racing heart', 'Sweating', 'Muscle tension', 'Difficulty breathing']
    },
    {
      stepId: 'reflection',
      type: 'text',
      prompt: 'What\'s one thing you learned that surprised you?'
    }
  ]
}
```

### 2. Seed into MongoDB

Add the activity document to `activities/seed/anxiety-workbook.js` and run the seed script. The seed file exports an array of activity objects that get inserted into the `activities` collection.

### 3. Tag matching

This activity has condition tags `generalized-anxiety`, `panic-disorder`, and `social-anxiety`. The anxiety bookshelf matches all three, so this activity will appear when users open the Anxiety bookshelf.

### 4. Frontend rendering

When a user taps the activity tile:

1. `WorkbookActivity.js` loads the activity document and initializes step state
2. Each step renders based on its `type` -- inline types render directly, component types delegate to the corresponding file in `frontend/components/workbook/`
3. The user navigates with Previous/Next buttons
4. On completion, responses are emitted via `WebSocketService.emit('workbook:activity:complete', { activityId, responses })`
