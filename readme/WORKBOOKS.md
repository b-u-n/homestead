# Workbooks

Therapeutic workbooks organized into library rooms and bookshelves. Each bookshelf opens a workbook containing activities resolved by tag matching. Activities contain multi-step therapeutic content with per-user progress tracking.

## System Overview

```
Library Rooms -> Bookshelves -> Workbooks -> Activities -> Steps
```

- **4 Library Rooms**: Main Lobby, Recovery, Finding Balance, Connection
- **15 Bookshelves**: emotions, depression, stress, anxiety, attachment, boundaries, loneliness, accountability, self, impulses, anger, adhd, burnout, grief, trauma
- Each bookshelf opens a workbook flow
- Workbooks contain activities resolved by tag matching
- Activities contain steps (the actual therapeutic content)

---

## Architecture

### Data Flow

```
User clicks bookshelf
       |
Frontend: Workbook component wraps FlowEngine
       |
FlowEngine starts at workbook:landing
       |
WebSocket: workbook:load (bookshelfId)
       |
Backend: Resolves activities by tag matching
       |
Frontend: WorkbookLanding shows activity grid
       |
User selects activity -> depth 1 overlay
       |
WebSocket: workbook:activity:load
       |
Frontend: WorkbookActivity multi-step form
       |
Step completion -> workbook:step:complete
       |
All steps done -> workbook:activity:complete
```

### Tag-Based Bookshelf Membership

Activities have `tags.conditions` and `tags.themes`. Bookshelves have `tagFilters`. An activity appears in a bookshelf when any of its tags intersect with the bookshelf's `tagFilters`. One activity can appear in multiple bookshelves.

| Bookshelf | Matching Tags |
|-----------|--------------|
| anxiety | generalized-anxiety, panic-disorder, social-anxiety, specific-phobia, health-anxiety, anxiety-disorders |
| stress | stress, chronic-stress |
| depression | depression |
| emotions | emotion-dysregulation, emotional-reasoning |
| attachment | attachment |
| boundaries | boundaries |
| loneliness | loneliness, social-isolation |
| accountability | accountability, perfectionism |
| self | self-knowledge, self-management |
| impulses | impulses, self-harm-urges |
| anger | anger |
| adhd | adhd |
| burnout | burnout, chronic-illness |
| grief | grief |
| trauma | PTSD, trauma-recovery, dissociation |

### Files

| Layer | File | Purpose |
|-------|------|---------|
| **Backend Model** | `/backend/src/models/Workbook.js` | Workbook schema (bookshelfId, tagFilters, activities) |
| **Backend Model** | `/backend/src/models/WorkbookActivity.js` | Activity schema (steps, tags) |
| **Backend Model** | `/backend/src/models/WorkbookProgress.js` | User progress tracking |
| **Backend Flow** | `/backend/src/flows/workbook.js` | 6 WebSocket handlers |
| **Frontend Flow** | `/frontend/flows/workbookFlow.js` | Navigation state machine |
| **Frontend** | `/frontend/components/Workbook.js` | FlowEngine wrapper |
| **Frontend** | `/frontend/components/drops/WorkbookLanding.js` | Activity grid |
| **Frontend** | `/frontend/components/drops/WorkbookActivity.js` | Step navigator |
| **Step Components** | `/frontend/components/workbook/*.js` | 9 step type renderers |

---

## WebSocket Events

See [WEBSOCKETS.md](./WEBSOCKETS.md) for full documentation.

### Quick Reference

| Event | Direction | Purpose |
|-------|-----------|---------|
| `workbook:load` | Request/Response | Load workbook by bookshelfId, resolve activities by tags |
| `workbook:activity:load` | Request/Response | Load specific activity with steps |
| `workbook:activity:start` | Request/Response | Create/retrieve progress record |
| `workbook:step:complete` | Request/Response | Save step data, mark step complete |
| `workbook:activity:complete` | Request/Response | Mark activity as completed |
| `workbook:progress:get` | Request/Response | Get all progress for user |
| `workbook:progress:updated` | Broadcast | Notify other sessions of progress |
| `workbook:activity:completed` | Broadcast | Notify other sessions of completion |

---

## Data Models

### Workbook

```javascript
{
  bookshelfId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  activities: [{
    activityId: {
      type: String,
      required: true
    },
    emoji: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    }
  }]
}
```

### WorkbookActivity

```javascript
{
  activityId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  workbookId: {
    type: ObjectId,          // References Workbook._id
    ref: 'Workbook',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  steps: [{
    stepId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'checkbox', 'slider', 'multiselect'],
      required: true
    },
    prompt: {
      type: String,
      required: true
    },
    options: {
      type: Mixed,
      default: null
    }
  }]
}
```

**Indexes:**
- `activityId` - Unique activity lookup
- `workbookId` - All activities in a workbook
- Compound `{ workbookId, activityId }` - Efficient scoped lookups

### WorkbookProgress

```javascript
{
  accountId: {
    type: ObjectId,          // References Account._id
    ref: 'Account',
    required: true,
    index: true
  },
  workbookId: {
    type: ObjectId,          // References Workbook._id
    ref: 'Workbook',
    required: true,
    index: true
  },
  activityId: {
    type: String,
    required: true
  },
  completedSteps: [{
    type: String             // Array of stepId strings
  }],
  stepData: {
    type: Map,               // Map<stepId, Mixed>
    of: Mixed,
    default: new Map()
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes:**
- `accountId` - User's progress
- `workbookId` - Progress within a workbook
- Compound `{ accountId, workbookId }` - User's progress in a workbook
- Compound `{ accountId, activityId }` - User's progress in an activity
- Compound `{ accountId, workbookId, activityId }` (unique) - One progress record per user per activity

---

## Frontend Navigation Flow

```
workbook:landing
    |
    +-- action: 'selectActivity' --> workbook:activity (depth 1)
                                        |
                                        +-- action: 'back' --> workbook:landing
                                        |
                                        +-- action: 'complete' --> workbook:landing
```

### Drops

| Drop ID | Component | Description |
|---------|-----------|-------------|
| `workbook:landing` | WorkbookLanding | Activity grid with progress indicators (3-column layout) |
| `workbook:activity` | WorkbookActivity | Multi-step form with navigation, progress dots, and save |

---

## Step Types

| Type | Component | Response | Used By |
|------|-----------|----------|---------|
| text | (inline) | string | Various |
| checkbox | (inline) | string[] | Various |
| slider | (inline) | number | Various |
| multiselect | (inline) | string[] | Various |
| psychoeducation | PsychoeducationStep | null | 13 activities |
| rating | RatingStep | number | worry-monitoring, fear-hierarchy, etc |
| likert | LikertStep | { [item]: number } | gad7-assessment |
| guided-exercise | GuidedExerciseStep | { completed: true } | breathing, PMR, grounding |
| prompt-sequence | PromptSequenceStep | { [id]: string } | 5-4-3-2-1 grounding |
| journal | JournalStep | string | written-exposure |
| checklist-assessment | ChecklistAssessmentStep | { checked, score } | distortions ID |
| sortable-list | SortableListStep | [{ item, rating }] | fear-hierarchy |
| action-plan | ActionPlanStep | { [section]: string } | problem-solving |

---

## Progress System

- Per-user, per-activity progress records
- `completedSteps` array tracks which steps are done
- `stepData` Map stores response for each step
- Resume capability: loads at first incomplete step
- Cross-session broadcast via WebSocket
- Status: `in-progress` -> `completed`

---

## Library Rooms

| Room | Bookshelves |
|------|------------|
| Main Lobby | Anxiety, Depression, Stress, Emotions |
| Recovery | ADHD, Trauma, Grief, Burnout |
| Finding Balance | Anger, Impulses, Self, Accountability |
| Connection | Attachment, Boundaries, Loneliness |

---

## Implementation Status

- [x] Workbook loading by bookshelfId
- [x] Activity grid with progress indicators
- [x] Multi-step activity navigation
- [x] Step completion and progress saving
- [x] Resume from last incomplete step
- [x] Cross-session progress broadcast
- [x] Tag-based activity resolution
- [x] 13 step types (4 inline + 9 components)
- [x] 20 seeded anxiety activities
- [x] Activities appearing in multiple bookshelves via tags

---

## Usage Examples

### Loading a Workbook (Frontend)

```javascript
import WebSocketService from '@/services/websocket';
import SessionStore from '@/stores/SessionStore';

const loadWorkbook = async (bookshelfId) => {
  const result = await WebSocketService.emit('workbook:load', {
    bookshelfId,
    sessionId: SessionStore.sessionId
  });
  // result.workbook - workbook with activities list
  // result.progress - user's progress records
  return result;
};
```

### Completing a Step (Frontend)

```javascript
const completeStep = async (activityId, stepId, stepData) => {
  const result = await WebSocketService.emit('workbook:step:complete', {
    sessionId: SessionStore.sessionId,
    activityId,
    stepId,
    stepData
  });
  return result;
};
```

### Backend Handler Pattern

```javascript
// In /backend/src/flows/workbook.js
'workbook:step:complete': {
  validate: (data) => {
    const { sessionId, activityId, stepId } = data;
    if (!sessionId || !activityId || !stepId) {
      return { valid: false, error: 'Missing required fields' };
    }
    return { valid: true };
  },
  handler: async (data, context) => {
    // 1. Find user account by sessionId
    // 2. Find progress record
    // 3. Save stepData to progress.stepData Map
    // 4. Add stepId to completedSteps array
    // 5. Broadcast workbook:progress:updated
    // 6. Return updated progress
  }
}
```
