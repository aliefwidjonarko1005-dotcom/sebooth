# Sebooth - Photobooth Application

High-end desktop photobooth application built with Electron + React.

## Features

- **Camera Integration**: digiCamControl for PTP communication with DSLR/mirrorless cameras
- **Silent Printing**: Direct printing without dialog popup
- **Frame Overlays**: Customizable PNG frame overlays with flexible positioning
- **LUT Filters**: Apply .CUBE color grading filters
- **Supabase Backend**: Cloud storage and session logging

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build:win
```

## Camera Setup

1. Install [digiCamControl](http://digicamcontrol.com/download) on Windows
2. Connect your camera via USB
3. Set camera to "PC Connect" or "Tethered" mode
4. The app will auto-detect connected cameras

## Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Copy `.env.example` to `.env`
3. Fill in your Supabase URL and anon key

## Project Structure

```
src/
├── main/           # Electron main process
├── preload/        # Preload scripts (context bridge)
├── renderer/       # React frontend
└── shared/         # Shared types
```
