import { startBridge } from './services/websocketService.js';
// Note: We don't need 'http' here, but keeping it clean.

console.log("--- STARTING BRIDGE SYSTEM ---");
startBridge();