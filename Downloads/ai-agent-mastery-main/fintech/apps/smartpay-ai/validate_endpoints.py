#!/usr/bin/env python3
"""
Validate all new API endpoints and middleware setup.

Location: backend_python/validate_endpoints.py
Purpose: Quick validation that all imports work and endpoints are properly configured.
"""

import sys
from pathlib import Path

# Add backend_python to path
sys.path.insert(0, str(Path(__file__).parent))

def validate_imports():
    """Validate all module imports."""
    print("🔍 Validating imports...")
    
    try:
        from smartpay_ai.api import copilot_endpoint
        print("✓ copilot_endpoint")
    except Exception as e:
        print(f"✗ copilot_endpoint: {e}")
        return False
    
    try:
        from smartpay_ai.api import streaming_endpoint
        print("✓ streaming_endpoint")
    except Exception as e:
        print(f"✗ streaming_endpoint: {e}")
        return False
    
    try:
        from smartpay_ai.api import health_endpoint
        print("✓ health_endpoint")
    except Exception as e:
        print(f"✗ health_endpoint: {e}")
        return False
    
    try:
        from smartpay_ai.api import admin_endpoint
        print("✓ admin_endpoint")
    except Exception as e:
        print(f"✗ admin_endpoint: {e}")
        return False
    
    try:
        from smartpay_ai.api import ml_endpoint
        print("✓ ml_endpoint")
    except Exception as e:
        print(f"✗ ml_endpoint: {e}")
        return False
    
    try:
        from smartpay_ai.middleware import auth
        print("✓ auth middleware")
    except Exception as e:
        print(f"✗ auth middleware: {e}")
        return False
    
    try:
        from smartpay_ai.middleware import rate_limit
        print("✓ rate_limit middleware")
    except Exception as e:
        print(f"✗ rate_limit middleware: {e}")
        return False
    
    try:
        from smartpay_ai.ml import MLService, get_ml_service
        print("✓ ML service")
    except Exception as e:
        print(f"✗ ML service: {e}")
        return False
    
    try:
        from smartpay_ai.knowledge_base.retrieve import add_articles_to_knowledge_base
        print("✓ knowledge_base.retrieve")
    except Exception as e:
        print(f"✗ knowledge_base.retrieve: {e}")
        return False
    
    print()
    return True


def validate_main_app():
    """Validate main FastAPI app setup."""
    print("🔍 Validating FastAPI app...")
    
    try:
        from smartpay_ai.main import app
        print(f"✓ FastAPI app created: {app.title}")
        
        # Check routers
        routes = [route.path for route in app.routes]
        print(f"✓ Total routes: {len(routes)}")
        
        # Check key endpoints
        key_endpoints = [
            "/api/smartpay-copilot/chat",
            "/api/smartpay-copilot/chat/stream",
            "/api/health/detailed",
            "/api/ml/predict",
            "/api/admin/stats",
        ]
        
        for endpoint in key_endpoints:
            if endpoint in routes:
                print(f"✓ {endpoint}")
            else:
                print(f"✗ {endpoint} NOT FOUND")
                return False
        
        # Check middleware
        print(f"✓ Middleware count: {len(app.user_middleware)}")
        
        print()
        return True
        
    except Exception as e:
        print(f"✗ FastAPI app validation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def list_all_routes():
    """List all available routes."""
    print("📋 All Available Routes:")
    print("=" * 60)
    
    try:
        from smartpay_ai.main import app
        
        for route in app.routes:
            if hasattr(route, "methods") and hasattr(route, "path"):
                methods = ", ".join(sorted(route.methods))
                print(f"{methods:10} {route.path}")
        
        print()
        return True
        
    except Exception as e:
        print(f"✗ Failed to list routes: {e}")
        return False


def main():
    """Run all validations."""
    print("╔" + "=" * 58 + "╗")
    print("║  Smartpay AI Copilot - Endpoint Validation            ║")
    print("╚" + "=" * 58 + "╝")
    print()
    
    all_passed = True
    
    # Validate imports
    if not validate_imports():
        all_passed = False
    
    # Validate FastAPI app
    if not validate_main_app():
        all_passed = False
    
    # List all routes
    if not list_all_routes():
        all_passed = False
    
    # Summary
    print("=" * 60)
    if all_passed:
        print("✅ All validations passed!")
        print()
        print("🚀 You can now start the server:")
        print("   cd backend_python")
        print("   python -m uvicorn smartpay_ai.main:app --reload --port 8000")
        print()
        print("📚 API Documentation:")
        print("   Swagger UI: http://localhost:8000/docs")
        print("   ReDoc:      http://localhost:8000/redoc")
        print("   Overview:   http://localhost:8000/")
        return 0
    else:
        print("❌ Some validations failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
