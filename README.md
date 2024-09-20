
# Video Editor with Electron and Chromecast Support

This project is a simple video editor built with Electron. It includes functionalities such as video playback, drawing sequences on a canvas, and casting to a Chromecast.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)

## Installation

1. **Clone or download the repository**:

   ```bash
   git clone https://your-repository-url.git
   cd electron_video_editor
   ```

2. **Install dependencies**:

   Install Electron and other necessary packages by running:

   ```bash
   npm install
   ```

## Running the Application

To start the application locally, run:

```bash
npm start
```

This will launch the Electron app and open the video editor interface.

## Packaging and Creating an Executable

To create an executable version of the application for your operating system, follow these steps:

1. **Install Electron Packager**:

   If you haven't already installed **electron-packager**, you can do so by running:

   ```bash
   npm install electron-packager --save-dev
   ```

2. **Package the application**:

   Use Electron Packager to create an executable. For example, to create an executable for Windows, you can run:

   ```bash
   npx electron-packager . video-editor-electron --platform=win32 --arch=x64 --out=release-builds --overwrite
   ```

   This will generate an executable in the `release-builds` directory.

   For macOS or Linux, simply change the `--platform` option to `darwin` (for macOS) or `linux`:

   - For macOS:
     ```bash
     npx electron-packager . video-editor-electron --platform=darwin --arch=x64 --out=release-builds --overwrite
     ```

   - For Linux:
     ```bash
     npx electron-packager . video-editor-electron --platform=linux --arch=x64 --out=release-builds --overwrite
     ```

## Development

During development, you can use the following command to live-reload the app while you're making changes:

```bash
npm run dev
```

You can edit the source files inside the `src/` folder. The main Electron process is defined in `main.js`, and the user interface is located in `src/index.html`, `src/style.css`, and `src/renderer.js`.

## Features

- Play video and visualize sequences on the canvas.
- Cast video to a Chromecast-compatible device using Google Cast SDK.
- Simple and extensible codebase using JavaScript/HTML/CSS.

Enjoy building your Electron-based video editor!
