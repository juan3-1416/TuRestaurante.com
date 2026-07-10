from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.users.infrastructure.models import User
from apps.users.interfaces.serializers import UserSerializer, UserCreateSerializer
from core.permissions import IsAdminUserRole

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == 'me':
            # Everyone logged in can see and update their own profile
            return [IsAuthenticated()]
        # Only admins can manage other users
        return [IsAuthenticated(), IsAdminUserRole()]

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        if request.method == 'GET':
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = UserCreateSerializer(request.user, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save()
                # Return the normal serializer without password field
                return Response(UserSerializer(request.user).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
