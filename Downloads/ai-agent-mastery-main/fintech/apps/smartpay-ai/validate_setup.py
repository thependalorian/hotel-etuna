"""
Validate Smartpay AI backend setup before running.

Location: backend_python/validate_setup.py
Purpose: Check all imports, environment, and dependencies.

Usage:
    python validate_setup.py
"""

import sys
from pathlib import Path

# Add smartpay_ai to Python path
sys.path.insert(0, str(Path(__file__).parent))

def check_environment():
    """Check environment variables."""
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    required = ["DATABASE_URL", "LLM_PROVIDER"]
    recommended = ["SMARTPAY_API_BASE_URL", "OPENAI_API_KEY"]
    
    print("🔍 Checking environment variables...")
    missing_required = []
    missing_recommended = []
    
    for var in required:
        if not os.getenv(var):
            missing_required.append(var)
        else:
            print(f"  ✅ {var}")
    
    for var in recommended:
        if not os.getenv(var):
            missing_recommended.append(var)
        else:
            print(f"  ✅ {var}")
    
    if missing_required:
        print(f"\n❌ Missing REQUIRED variables: {', '.join(missing_required)}")
        return False
    
    if missing_recommended:
        print(f"\n⚠️  Missing RECOMMENDED variables: {', '.join(missing_recommended)}")
        print("   (System will work but with limited functionality)")
    
    return True


def check_imports():
    """Check all core imports."""
    print("\n🔍 Checking Python imports...")
    
    checks = [
        ("FastAPI", "fastapi", "FastAPI"),
        ("Pydantic AI", "pydantic_ai", "Agent"),
        ("LangGraph", "langgraph.graph", "StateGraph"),
        ("AsyncPG", "asyncpg", "create_pool"),
        ("Psycopg", "psycopg", "connect"),
        ("Uvicorn", "uvicorn", "run"),
        ("HTTPX", "httpx", "AsyncClient"),
        ("SSE Starlette", "sse_starlette", "EventSourceResponse"),
    ]
    
    failed = []
    
    for name, module, attr in checks:
        try:
            mod = __import__(module, fromlist=[attr])
            getattr(mod, attr)
            print(f"  ✅ {name}")
        except ImportError as e:
            print(f"  ❌ {name}: {e}")
            failed.append(name)
        except AttributeError:
            print(f"  ⚠️  {name}: Module found but {attr} missing")
    
    if failed:
        print(f"\n❌ Missing dependencies: {', '.join(failed)}")
        print("   Run: pip install -r requirements.txt")
        return False
    
    return True


def check_modules():
    """Check all smartpay_ai modules can be imported."""
    print("\n🔍 Checking smartpay_ai modules...")
    
    modules = [
        "smartpay_ai.providers",
        "smartpay_ai.db_utils",
        "smartpay_ai.user_profile",
        "smartpay_ai.conversation_history",
        "smartpay_ai.agents.copilot.models",
        "smartpay_ai.agents.copilot.prompts",
        "smartpay_ai.agents.copilot.agent",
        "smartpay_ai.agents.copilot.tools",
        "smartpay_ai.graph.state",
        "smartpay_ai.graph.nodes",
        "smartpay_ai.graph.workflow",
        "smartpay_ai.api.copilot_endpoint",
        "smartpay_ai.knowledge_base.retrieve",
        "smartpay_ai.ml",
        "smartpay_ai.main",
    ]
    
    failed = []
    
    for module in modules:
        try:
            __import__(module)
            print(f"  ✅ {module}")
        except Exception as e:
            print(f"  ❌ {module}: {e}")
            failed.append(module)
    
    if failed:
        print(f"\n❌ Failed to import: {', '.join(failed)}")
        return False
    
    return True


def check_database():
    """Check database connection."""
    import os
    import asyncio
    import asyncpg
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("\n⚠️  DATABASE_URL not set, skipping database check")
        return True
    
    print("\n🔍 Checking database connection...")
    
    async def test_connection():
        try:
            conn = await asyncpg.connect(database_url, timeout=5)
            await conn.close()
            print("  ✅ Database connection successful")
            return True
        except Exception as e:
            print(f"  ❌ Database connection failed: {e}")
            return False
    
    return asyncio.run(test_connection())


def main():
    """Run all validation checks."""
    print("""
╔══════════════════════════════════════════════════════════════╗
║  Smartpay AI Copilot - Setup Validation                     ║
╚══════════════════════════════════════════════════════════════╝
""")
    
    checks = [
        ("Environment Variables", check_environment),
        ("Python Dependencies", check_imports),
        ("Module Imports", check_modules),
        ("Database Connection", check_database),
    ]
    
    results = []
    for name, check_fn in checks:
        try:
            result = check_fn()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ {name} check crashed: {e}")
            results.append((name, False))
    
    print("\n" + "="*64)
    print("📊 Validation Summary")
    print("="*64)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}  {name}")
    
    all_passed = all(r[1] for r in results)
    
    if all_passed:
        print("""
╔══════════════════════════════════════════════════════════════╗
║  ✅ All checks passed! Ready to run:                         ║
║                                                               ║
║     python run.py                                            ║
╚══════════════════════════════════════════════════════════════╝
""")
        return 0
    else:
        print("""
╔══════════════════════════════════════════════════════════════╗
║  ❌ Some checks failed. Fix issues before running.           ║
║                                                               ║
║  See SETUP_GUIDE.md for help.                                ║
╚══════════════════════════════════════════════════════════════╝
""")
        return 1


if __name__ == "__main__":
    sys.exit(main())
