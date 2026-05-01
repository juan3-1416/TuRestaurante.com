import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { colors } from "../theme/colors";
import { login, setToken } from "../services/api";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await login(username, password);
      setToken(data.token);
      navigation.replace("Mesas");
    } catch (e) {
      alert("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#4C1D95", "#0EA5E9"]}
      style={styles.container}
    >
      <View style={styles.card}>

        {/* ICONO */}
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🍽️</Text>
        </View>

        {/* TITULO */}
        <Text style={styles.title}>Bienvenido</Text>

        {/* INPUT USER */}
        <View style={styles.inputContainer}>
          <Text style={styles.iconInput}>👤</Text>
          <TextInput
            placeholder="Nombre de usuario"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
          />
        </View>

        {/* INPUT PASS */}
        <View style={styles.inputContainer}>
          <Text style={styles.iconInput}>🔒</Text>
          <TextInput
            placeholder="Contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        {/* OLVIDASTE */}
        <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>

        {/* BOTON */}
        <TouchableOpacity onPress={handleLogin} activeOpacity={0.8}>
          <LinearGradient
            colors={["#2563EB", "#14B8A6"]}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* FOOTER */}
        <Text style={styles.footer}>
          © 2026 Todos los derechos reservados.
        </Text>

      </View>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "85%",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 10,
  },

  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 15,
    backgroundColor: "#0EA5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  icon: {
    fontSize: 30,
    color: "#fff",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#5B21B6",
    marginBottom: 20,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: "100%",
  },

  iconInput: {
    marginRight: 8,
    fontSize: 16,
  },

  input: {
    flex: 1,
    padding: 12,
  },

  forgot: {
    fontSize: 12,
    color: colors.gray,
    alignSelf: "flex-start",
    marginBottom: 15,
  },

  button: {
    width: "100%",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  footer: {
    marginTop: 20,
    fontSize: 12,
    color: colors.gray,
  },
});