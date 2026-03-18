"""
Group Manager agent: group creation, member management, and group wallet operations.

Location: backend_python/smartpay_ai/agents/group_manager/
Purpose: Help users create and manage groups for shared expenses and savings.
"""

from .agent import run_group_manager, get_group_manager_agent
from .models import GroupManagementRequest, GroupManagementResponse

__all__ = [
    "run_group_manager",
    "get_group_manager_agent",
    "GroupManagementRequest",
    "GroupManagementResponse",
]
