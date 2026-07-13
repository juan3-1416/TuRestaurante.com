from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def broadcast_global_action(action_name):
    """
    Envía una acción genérica a todos los clientes conectados al WebSocket de mesas.
    Ej: broadcast_global_action('inventory_updated')
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "restaurant_tables",
        {
            "type": "broadcast_action",
            "action_name": action_name
        }
    )
