import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/LoginScreen';
import MesasScreen from '../screens/MesasScreen';
import PedidoScreen from '../screens/PedidoScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Mesas" component={MesasScreen} />
        <Stack.Screen name="Pedido" component={PedidoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}