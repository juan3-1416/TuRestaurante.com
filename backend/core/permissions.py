from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    """
    Permite acceso solo a usuarios con rol ADMIN o superusers.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    (request.user.role == 'ADMIN' or request.user.is_superuser))

class IsCashierOrAdmin(permissions.BasePermission):
    """
    Permite acceso a Cajeros y Administradores.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    (request.user.role in ['ADMIN', 'CASHIER'] or request.user.is_superuser))

class IsWaiterOrAdmin(permissions.BasePermission):
    """
    Permite acceso a Meseros y Administradores.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    (request.user.role in ['ADMIN', 'WAITER'] or request.user.is_superuser))
