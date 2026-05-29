Introduction to the Open-Source Project  

Herok rok1 is a 3D Gaussian Splatting rendering engine that runs in the browser.  

The term sounds fancy, but simply put, it uses a bunch of fuzzy dots to assemble a realistic 3D scene.  

However, the issue with 3D is that files are too large, making them difficult to transfer and slow to load.  

Herok rok1 enables ordinary users to smoothly browse massive 3D scenes with hundreds of millions of Gaussian points on various terminal devices just by opening a webpage.  

It makes 3D content as seamlessly transferable across devices as video. It is a 3D Gaussian Splatting rendering engine that runs in the browser.

# Herok Rok1

## High-Performance 3D Gaussian Splatting Render Engine

**Herok Rok1** is a cutting-edge browser-based 3D Gaussian Splatting renderer capable of handling **up to 1 billion Gaussian points** smoothly on both desktop and mobile devices.

### Features

- **Billion-scale rendering** - Up to 1,000,000,000 Gaussian points
- **Mobile optimized** - Runs smoothly on phones and tablets
- **Real-time performance** - 60 FPS on supported devices
- **Progressive streaming** - Load and render data incrementally
- **WebGL2 powered** - Uses hardware acceleration
- **Multiple format support** - PLY, SPLAT, compressed, JSON
- **LOD system** - Automatic level of detail management

### Quick Start

```javascript
import { initHerokRok1, loadScene } from 'herok-rok1';

// Get canvas element
const canvas = document.getElementById('canvas');

// Initialize engine
const engine = initHerokRok1(canvas, {
    maxGaussians: 1000000000,
    targetFPS: 60
});

// Load scene data
const response = await fetch('scene.splat');
const data = await response.arrayBuffer();
await loadScene(data, 'splat');
