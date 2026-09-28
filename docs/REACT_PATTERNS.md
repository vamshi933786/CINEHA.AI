# CINEHA AI — React Patterns Catalog & Implementation Guide

This document formally records the named React design patterns used across the CINEHA AI frontend, detailing their motivation, implementation structure, location, and trade-offs as mandated by Requirement 2.

---

## Pattern 1: Compound Components Pattern

### Purpose
To enable expressive, flexible composition of complex UI structures where parent and child components implicitly share state and behavior without prop drilling.

### Implementation Location
- `apps/web/components/scripts/ScriptWorkspace/`
  - `ScriptWorkspace.tsx` (Context Provider & Container)
  - `ScriptWorkspaceHeader.tsx`
  - `ScriptWorkspaceInput.tsx`
  - `ScriptWorkspacePreview.tsx`
  - `ScriptWorkspaceToolbar.tsx`
- `apps/web/components/workflow/WorkflowPanel/`
  - `WorkflowPanel.tsx`
  - `WorkflowPanel.Stage.tsx`
  - `WorkflowPanel.Metrics.tsx`

### Example
```tsx
<ScriptWorkspace initialData={script}>
  <ScriptWorkspace.Header title="Cinematic Camera Moves for Beginners" />
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <ScriptWorkspace.Input onGenerate={handleGenerate} />
    <ScriptWorkspace.Preview showVisualCues={true} />
  </div>
  <ScriptWorkspace.Toolbar onExport={handleExport} onAnalyze={handleAnalyze} />
</ScriptWorkspace>
```

### Trade-offs
- **Pros:** Clean, readable JSX; avoids fragile prop passing through intermediary DOM nodes; permits callers to re-order layout easily.
- **Cons:** Slightly higher initial setup cost with React Context; tight coupling between subcomponents and the parent context.

---

## Pattern 2: Custom Hooks Pattern

### Purpose
To encapsulate reusable stateful logic, side effects, and asynchronous API mutations, maintaining thin, declarative presentational components.

### Implementation Location
- `apps/web/hooks/useScriptGeneration.ts` — Manages streaming generation, abort controllers, and optimistic UI updates.
- `apps/web/hooks/useCreatorProfile.ts` — Hydrates and synchronizes creator persona preferences across modules.
- `apps/web/hooks/useWorkflowStatus.ts` — Subscribes to real-time agent execution events and telemetry.
- `apps/web/hooks/useVideoAnalysis.ts` — Coordinates file validation, chunked upload, and analysis polling.
- `apps/web/hooks/useMediaQuery.ts` — Provides responsive breakpoint detection for adaptive 3D / 2D fallbacks.

### Example
```tsx
export function useScriptGeneration() {
  const [state, dispatch] = useReducer(scriptReducer, initialState);
  const generateScript = useCallback(async (input: ScriptGenerationInput) => {
    dispatch({ type: 'GENERATION_START' });
    try {
      const result = await api.scripts.generate(input);
      dispatch({ type: 'GENERATION_SUCCESS', payload: result });
    } catch (err: any) {
      dispatch({ type: 'GENERATION_ERROR', error: err.message });
    }
  }, []);
  return { ...state, generateScript };
}
```

### Trade-offs
- **Pros:** Promotes unit testability; completely decouples UI rendering from business logic; reusable across multiple views.
- **Cons:** Hook composition must strictly abide by React's rules of hooks; can lead to unnecessary re-renders if dependencies are not carefully memoized.

---

## Pattern 3: Provider Pattern (Context Architecture)

### Purpose
To supply global or subtree-specific dependencies (theming, user persona, active workflow state) without manual parameter threading.

### Implementation Location
- `apps/web/providers/CreatorProfileProvider.tsx` — Global creator persona context.
- `apps/web/providers/WorkflowStateProvider.tsx` — Active agent pipeline execution state.
- `apps/web/providers/ToastNotificationProvider.tsx` — Accessible alert toast notifications.

### Example
```tsx
export const CreatorProfileContext = createContext<CreatorProfileContextType | null>(null);

export function CreatorProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<CreatorProfile>(defaultProfile);
  // Persist to localStorage and backend
  return (
    <CreatorProfileContext.Provider value={{ profile, updateProfile: setProfile }}>
      {children}
    </CreatorProfileContext.Provider>
  );
}
```

### Trade-offs
- **Pros:** Ubiquitous access to creator preferences across all generation forms.
- **Cons:** Modifying context value triggers re-renders across all consumers; mitigated by splitting state and dispatch into distinct contexts where high-frequency changes occur.

---

## Pattern 4: Container-Presentational Pattern

### Purpose
Separating the data fetching, state management, and error handling ("Container") from the pure aesthetic rendering and accessibility logic ("Presentational").

### Implementation Location
- Container: `apps/web/components/containers/ScriptAnalyzerContainer.tsx`
- Presentational: `apps/web/components/presentation/ScriptAnalyzerView.tsx`

### Example
```tsx
// Container: handles API calls and state
export function ScriptAnalyzerContainer({ scriptId }: { scriptId: string }) {
  const { data, loading, error, runAnalysis } = useScriptAnalysis(scriptId);
  return <ScriptAnalyzerView data={data} isLoading={loading} error={error} onReanalyze={runAnalysis} />;
}
```

### Trade-offs
- **Pros:** Presentational views can be previewed in isolation with Storybook or mock data; simplifies testing.
- **Cons:** Increases the number of component files.

---

## Pattern 5: State Reducer Pattern

### Purpose
To manage complex, interdependent state transitions in multi-stage workflows (such as moving through `IDEATE` $\rightarrow$ `RESEARCH` $\rightarrow$ `HOOK` $\rightarrow$ `SCRIPT` $\rightarrow$ `OPTIMIZE`) where naive `useState` calls cause inconsistent intermediate states.

### Implementation Location
- `apps/web/lib/reducers/workflowReducer.ts`
- `apps/web/lib/reducers/scriptEditorReducer.ts`

### Example
```tsx
export type WorkflowAction =
  | { type: 'SELECT_PIPELINE'; pipeline: 'full' | 'quick_script' | 'hook_only' }
  | { type: 'STEP_START'; agent: AgentName }
  | { type: 'STEP_SUCCESS'; agent: AgentName; output: any }
  | { type: 'STEP_FAILURE'; agent: AgentName; error: string }
  | { type: 'RESET' };

export function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'STEP_START':
      return { ...state, activeAgent: action.agent, status: 'processing', error: null };
    // deterministic state progression
  }
}
```

### Trade-offs
- **Pros:** Makes all workflow transitions explicit, deterministic, and easily loggable or replayable.
- **Cons:** Requires defining action types and verbose switch cases.

---

## Pattern 6: Error Boundary Pattern with Graceful Degradation

### Purpose
To isolate runtime rendering crashes (specifically in complex WebGL 3D canvases or external script embeds) and render a fully accessible fallback without crashing the entire creator workspace.

### Implementation Location
- `apps/web/components/ui/ErrorBoundary.tsx`
- `apps/web/components/three/ThreeCanvasErrorBoundary.tsx`

### Example
```tsx
<ThreeCanvasErrorBoundary fallback={<Accessible2DWorkflowGraph />}>
  <ThreeAgentWorkflowCanvas state={workflowState} />
</ThreeCanvasErrorBoundary>
```

### Trade-offs
- **Pros:** Guarantees application stability even if the user's browser fails to initialize WebGL context or runs out of GPU memory.
- **Cons:** Only catches errors during rendering and in lifecycle methods, not inside event handlers (which are handled via try-catch).
