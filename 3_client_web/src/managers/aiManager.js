export class AIManager {
    async getResponse(userText) {
        const t = userText.toLowerCase();
        
        await new Promise(r => setTimeout(r, 600 + Math.random() * 500));

        if (t.includes("hello") || t.includes("hi")) 
            return "Hello! I am your local AI assistant.";
            
        if (t.includes("status")) 
            return "All systems operational. Java Backend is running.";
            
        if (t.includes("joke")) 
            return "Why do Java developers wear glasses? Because they don't C#!";
            
        return "Interesting! Tell me more, or ask me about the system.";
    }
}