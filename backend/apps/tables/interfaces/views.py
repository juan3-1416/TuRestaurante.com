from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.tables.infrastructure.models import Table
from .serializers import TableSerializer

class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        table = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            table.status = new_status
            table.save()
            return Response({'status': 'Estado actualizado', 'table': TableSerializer(table).data})
        return Response({'error': 'El campo status es requerido'}, status=400)
