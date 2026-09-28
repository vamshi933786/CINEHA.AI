# CINEHA AI — Operational Troubleshooting & Diagnostic Guide

This document assists developers and operators in diagnosing and resolving common operational, build, and runtime issues.

---

## 1. Local Development Issues

### Issue: Port 3000 or Port 8000 already in use
**Symptoms:** `EADDRINUSE: address already in use :::3000` or `Errno 48: Address already in use`.  
**Resolution:**
```bash
# Find and terminate process occupying port 3000
lsof -ti:3000 | xargs kill -9

# Find and terminate process occupying port 8000
lsof -ti:8000 | xargs kill -9
```

### Issue: FFmpeg not detected locally
**Symptoms:** Video metadata extraction returns warnings or simulated frame data.  
**Resolution:**
The system is built with a resilient hybrid analyzer. If `ffmpeg` is not in `$PATH`, the backend falls back to standard video container header parsing and structured heuristic visual checks without failing the user request. To enable binary frame extraction on macOS:
```bash
# If Homebrew is installed:
brew install ffmpeg
```

---

## 2. 3D WebGL Visualization Issues

### Issue: WebGL Context Lost / Black Screen
**Symptoms:** Console warning `THREE.WebGLRenderer: Context Lost` or canvas remains blank on older mobile devices.  
**Resolution:**
The `ThreeCanvasErrorBoundary` automatically intercepts WebGL failures and unmounts the 3D canvas, rendering the `Accessible2DWorkflow` SVG graph. Creators can also manually toggle the 2D view using the visualizer toolbar switch.

---

## 3. AI Provider & Generation Issues

### Issue: LLM Rate Limit or Timeout
**Symptoms:** HTTP 429 or HTTP 504 on `/api/v1/scripts/generate`.  
**Resolution:**
1. Check `GEMINI_API_KEY` or `OPENAI_API_KEY` quota in your provider console.
2. In development, the system supports offline heuristic fallback mode (`AI_PROVIDER=heuristic_mock`), allowing full end-to-end UI testing without burning external API tokens.
