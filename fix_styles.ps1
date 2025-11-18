$CSSPath = "ChatProject\3_client_web\css"
$File = "$CSSPath\style.css"

# 1. Create Folder if missing
if (!(Test-Path $CSSPath)) {
    New-Item -ItemType Directory -Force -Path $CSSPath | Out-Null
    Write-Host "Created missing CSS folder." -ForegroundColor Yellow
}

# 2. Write the CSS Content
$Content = @"
/* FORCE VISIBILITY & COLORS */
body { background-color: #020617; color: #f1f5f9; font-family: sans-serif; margin: 0; height: 100vh; overflow: hidden; }
.hidden { display: none !important; }

/* COMPONENTS */
.login-container { background-color: #1e293b; padding: 2rem; border-radius: 1rem; width: 90%; max-width: 400px; border: 1px solid #334155; }
.input-field { width: 100%; padding: 12px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: white; margin-bottom: 10px; box-sizing: border-box; }
.btn-primary { background: #4f46e5; color: white; padding: 12px; border-radius: 8px; border: none; width: 100%; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;}
.btn-secondary { background: #334155; color: white; padding: 12px; border-radius: 8px; border: none; width: 100%; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;}

/* APP LAYOUT */
#layer-app { width: 100%; height: 100%; position: relative; background-color: #020617; }

.sidebar { background: #0f172a; border-right: 1px solid #1e293b; display: flex; flex-direction: column; z-index: 10; }
.chat-panel { background: #020617; display: flex; flex-direction: column; height: 100%; z-index: 5; }

.contact-item { padding: 15px; border-bottom: 1px solid #1e293b; cursor: pointer; display: flex; align-items: center; justify-content: space-between; }
.contact-item:hover { background: #1e293b; }
.contact-item.active { background: rgba(79, 70, 229, 0.1); border-left: 4px solid #4f46e5; }

.glass-header { background: rgba(15, 23, 42, 0.95); padding: 15px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }

.msg-bubble { padding: 10px 15px; border-radius: 15px; margin-bottom: 5px; max-width: 80%; word-wrap: break-word; }
.msg-me { background: #4f46e5; color: white; border-bottom-right-radius: 0; }
.msg-other { background: #1e293b; color: #e2e8f0; border-bottom-left-radius: 0; border: 1px solid #334155; }

/* UTILITIES */
.absolute-full { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.w-full { width: 100%; }
.h-full { height: 100%; }

/* RESPONSIVE */
@media (min-width: 768px) {
    .md\:w-80 { width: 320px; }
    .md\:flex-1 { flex: 1; }
    .md\:flex { display: flex !important; }
    .md\:hidden { display: none !important; }
}
"@

Set-Content -Path $File -Value $Content
Write-Host "CSS Repaired Successfully!" -ForegroundColor Green