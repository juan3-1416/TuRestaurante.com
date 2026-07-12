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

from apps.users.infrastructure.models import EmployeeShift
from apps.users.interfaces.serializers import EmployeeShiftSerializer
from django.utils import timezone

class EmployeeShiftViewSet(viewsets.ModelViewSet):
    queryset = EmployeeShift.objects.all()
    serializer_class = EmployeeShiftSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return super().get_queryset()
        return super().get_queryset().filter(user=user)

    @action(detail=False, methods=['post'])
    def start(self, request):
        user = request.user
        active_shift = EmployeeShift.objects.filter(user=user, is_active=True).first()
        if active_shift:
            return Response({'error': 'Ya tienes un turno activo.'}, status=400)
            
        shift = EmployeeShift.objects.create(user=user)
        return Response(EmployeeShiftSerializer(shift).data)

    @action(detail=False, methods=['post'])
    def end(self, request):
        user = request.user
        shift = EmployeeShift.objects.filter(user=user, is_active=True).first()
        if not shift:
            return Response({'error': 'No tienes un turno activo.'}, status=400)
            
        observations = request.data.get('observations', '')
        
        shift.is_active = False
        shift.end_time = timezone.now()
        shift.observations = observations
        shift.save()
        
        return Response(EmployeeShiftSerializer(shift).data)
