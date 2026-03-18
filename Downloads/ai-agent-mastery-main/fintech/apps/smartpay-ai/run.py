"""
Development server runner for Smartpay AI Copilot.

Location: backend_python/run.py
Purpose: Quick start script for local development.

Usage:
    python run.py
    
Environment:
    - Copy .env.example to .env and configure
    - Ensure DATABASE_URL is set
    - Ensure SMARTPAY_API_BASE_URL points to Node.js backend
"""

import os
import sys
import subprocess
from pathlib import Path

# Add smartpay_ai to Python path
sys.path.insert(0, str(Path(__file__).parent))

if __name__ == "__main__":
    import uvicorn
    
    # Generate types before starting server
    print("🔄 Regenerating types from JSON schemas...")
    project_root = Path(__file__).parent.parent.parent
    type_script = project_root / "scripts" / "generate_types.py"
    
    try:
        result = subprocess.run(
            [sys.executable, str(type_script)],
            cwd=str(project_root),
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            print("✅ Types regenerated successfully\n")
        else:
            print(f"⚠️  Type generation warning: {result.stderr}\n")
    except Exception as e:
        print(f"⚠️  Could not regenerate types: {e}\n")
    
    # Check for required environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = ["DATABASE_URL", "LLM_PROVIDER"]
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        print(f"❌ Missing required environment variables: {', '.join(missing)}")
        print("📝 Copy .env.example to .env and configure")
        sys.exit(1)
    
    port = int(os.getenv("PORT", 8000))
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║  Smartpay AI Copilot - Development Server                   ║
╚══════════════════════════════════════════════════════════════╝

🚀 Starting FastAPI server on http://localhost:{port}

📚 API Docs: http://localhost:{port}/docs
🏥 Health: http://localhost:{port}/health

💬 Chat endpoint: POST http://localhost:{port}/api/smartpay-copilot/chat

Press Ctrl+C to stop
""")
    
    uvicorn.run(
        "smartpay_ai.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info",
    )
