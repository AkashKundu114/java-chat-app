export const log = (scope, msg) => {
    console.log(`[${new Date().toLocaleTimeString()}] [${scope}] ${msg}`);
};