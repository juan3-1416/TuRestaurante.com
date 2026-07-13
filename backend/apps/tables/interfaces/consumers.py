import json
from channels.generic.websocket import AsyncWebsocketConsumer

class TableConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'restaurant_tables'

        # Join room group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Receive message from room group
    async def broadcast_update(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'action': 'table_updated',
            'table_id': event.get('table_id')
        }))

    async def broadcast_action(self, event):
        # Send a generic action to WebSocket
        await self.send(text_data=json.dumps({
            'action': event.get('action_name')
        }))
