import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/LoginScreen';
import MesasScreen from '../screens/MesasScreen';
import PedidoScreen from '../screens/PedidoScreen';
import HistorialOrdenesScreen from '../screens/HistorialOrdenesScreen';
import PedidosPendientesScreen from "../screens/PedidosPendientesScreen";

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
        <Stack.Screen name="HistorialOrdenes" component={HistorialOrdenesScreen} />
        <Stack.Screen
  name="PedidosPendientes"
  component={PedidosPendientesScreen}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}