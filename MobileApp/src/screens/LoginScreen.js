import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { colors, gradients } from "../theme/colors";
import { login, getUsuarios } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const palette = {
  light: colors.restaurantLight ?? "#78B9B5",
  accent:
    colors.restaurantAccent ??
    colors.accent ??
    "#0F828C",
  primary:
    colors.restaurantPrimary ??
    colors.primary ??
    "#065084",
  dark:
    colors.restaurantDark ??
    colors.dark ??
    "#320A6B",

  background: colors.background ?? "#F8FAFC",
  surface: colors.surface ?? colors.white ?? "#FFFFFF",
  muted: colors.muted ?? "#E8F3F2",

  text: colors.text ?? "#0F172A",
  textSecondary: colors.textSecondary ?? "#475569",
  gray: colors.gray ?? "#64748B",
  placeholder: colors.placeholder ?? "#94A3B8",
  border: colors.border ?? "#DCE7E7",

  danger: colors.danger ?? "#DC2626",
  white: colors.white ?? "#FFFFFF",
};

const loginGradient =
  gradients?.main ?? ["#320A6B", "#065084"];

const buttonGradient =
  gradients?.primary ?? ["#065084", "#0F828C"];

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const normalizarUsuarios = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  };

  const obtenerUserIdDesdeToken = (token) => {
    try {
      if (!token) {
        return "";
      }

      const partes = token.split(".");

      if (partes.length < 2) {
        return "";
      }

      let base64 = partes[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      while (base64.length % 4) {
        base64 += "=";
      }

      if (!global.atob) {
        console.log(
          "global.atob no está disponible para leer el JWT."
        );
        return "";
      }

      const payload = JSON.parse(global.atob(base64));

      return payload?.user_id
        ? String(payload.user_id)
        : "";
    } catch (error) {
      console.log(
        "NO SE PUDO LEER USER_ID DEL TOKEN:",
        error
      );
      return "";
    }
  };

  const guardarDatosRespaldo = async (
    token,
    usernameIngresado
  ) => {
    const userIdToken = obtenerUserIdDesdeToken(token);

    await AsyncStorage.multiSet([
      ["userId", userIdToken],
      ["loginUsername", usernameIngresado || ""],
      ["userName", usernameIngresado || "Usuario"],
      ["userEmail", "Sesión activa"],
      ["userRole", ""],
    ]);

    console.log("DATOS DE RESPALDO GUARDADOS:", {
      userId: userIdToken,
      loginUsername: usernameIngresado,
      userName: usernameIngresado || "Usuario",
      userEmail: "Sesión activa",
    });
  };

  const guardarDatosUsuario = async (
    token,
    usernameIngresado
  ) => {
    try {
      const userIdToken = obtenerUserIdDesdeToken(token);
      const usuariosRespuesta = await getUsuarios(token);
      const usuarios = normalizarUsuarios(
        usuariosRespuesta
      );

      console.log(
        "USUARIOS LOGIN NORMALIZADOS:",
        usuarios
      );

      const usuarioActual = usuarios.find((usuario) => {
        const coincideUsername =
          String(usuario.username || "").toLowerCase() ===
          String(usernameIngresado || "").toLowerCase();

        const coincideEmail =
          String(usuario.email || "").toLowerCase() ===
          String(usernameIngresado || "").toLowerCase();

        const coincideId =
          userIdToken &&
          String(usuario.id ?? "") ===
            String(userIdToken);

        return (
          coincideUsername ||
          coincideEmail ||
          coincideId
        );
      });

      console.log(
        "USUARIO ENCONTRADO LOGIN:",
        usuarioActual
      );

      if (!usuarioActual) {
        await guardarDatosRespaldo(
          token,
          usernameIngresado
        );
        return;
      }

      const firstName =
        usuarioActual.first_name || "";

      const lastName =
        usuarioActual.last_name || "";

      const nombreCompleto =
        `${firstName} ${lastName}`.trim() ||
        usuarioActual.username ||
        usernameIngresado ||
        "Usuario";

      const emailUsuario =
        usuarioActual.email || "Sesión activa";

      const roleUsuario =
        usuarioActual.role || "";

      const userId =
        String(
          usuarioActual.id ??
            userIdToken ??
            ""
        );

      await AsyncStorage.multiSet([
        ["userId", userId],
        [
          "loginUsername",
          usuarioActual.username ||
            usernameIngresado ||
            "",
        ],
        ["userName", nombreCompleto],
        ["userEmail", emailUsuario],
        ["userRole", roleUsuario],
      ]);

      console.log(
        "USUARIO GUARDADO EN ASYNCSTORAGE:",
        {
          id: userId,
          username: usuarioActual.username,
          firstName,
          lastName,
          nombreCompleto,
          email: emailUsuario,
          role: roleUsuario,
        }
      );
    } catch (error) {
      console.log(
        "NO SE PUDO CARGAR PERFIL DEL USUARIO:",
        error
      );

      await guardarDatosRespaldo(
        token,
        usernameIngresado
      );
    }
  };

  const handleLogin = async () => {
    console.log("CLICK LOGIN 🔥");

    const usernameLimpio = username.trim();
    const passwordLimpio = password.trim();

    if (!usernameLimpio || !passwordLimpio) {
      Alert.alert(
        "Campos incompletos",
        "Ingresa tu usuario y contraseña."
      );
      return;
    }

    setLoading(true);

    try {
      const data = await login(
        usernameLimpio,
        password
      );

      console.log("LOGIN OK:", data);

      if (!data?.access || !data?.refresh) {
        throw new Error(
          "El login no devolvió access o refresh token."
        );
      }

      await AsyncStorage.multiRemove([
        "accessToken",
        "refreshToken",
        "userId",
        "userName",
        "userEmail",
        "userRole",
        "loginUsername",
      ]);

      await AsyncStorage.multiSet([
        ["accessToken", data.access],
        ["refreshToken", data.refresh],
      ]);

      await guardarDatosUsuario(
        data.access,
        usernameLimpio
      );

      const [
        userIdFinal,
        userNameFinal,
        userEmailFinal,
        userRoleFinal,
        loginUsernameFinal,
      ] = await Promise.all([
        AsyncStorage.getItem("userId"),
        AsyncStorage.getItem("userName"),
        AsyncStorage.getItem("userEmail"),
        AsyncStorage.getItem("userRole"),
        AsyncStorage.getItem("loginUsername"),
      ]);

      console.log("DATOS FINALES GUARDADOS:", {
        userId: userIdFinal,
        userName: userNameFinal,
        userEmail: userEmailFinal,
        userRole: userRoleFinal,
        loginUsername: loginUsernameFinal,
      });

      navigation.replace("Mesas");
    } catch (error) {
      console.log("ERROR REAL LOGIN:", error);

      Alert.alert(
        "Error al iniciar sesión",
        "Verifica tu usuario, contraseña o conexión con el servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={loginGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={palette.dark}
      />

      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
        style={styles.keyboardContainer}
      >
        <View style={styles.brandArea}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Text style={styles.logoIcon}>🍽️</Text>
            </View>
          </View>

          <Text style={styles.brandName}>
            TuRestaurante.com
          </Text>

          <Text style={styles.brandSubtitle}>
            Gestión rápida y sencilla para tu restaurante
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardAccent} />

          <Text style={styles.title}>
            Bienvenido
          </Text>

          <Text style={styles.subtitle}>
            Ingresa a tu cuenta para continuar
          </Text>

          <Text style={styles.inputLabel}>
            Usuario
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconBox}>
              <Text style={styles.iconInput}>👤</Text>
            </View>

            <TextInput
              placeholder="Nombre de usuario o correo"
              placeholderTextColor={palette.placeholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              returnKeyType="next"
              style={styles.input}
            />
          </View>

          <Text style={styles.inputLabel}>
            Contraseña
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconBox}>
              <Text style={styles.iconInput}>🔒</Text>
            </View>

            <TextInput
              placeholder="Ingresa tu contraseña"
              placeholderTextColor={palette.placeholder}
              secureTextEntry={!mostrarPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={() =>
                setMostrarPassword(
                  (valorActual) => !valorActual
                )
              }
              disabled={loading}
              style={styles.showPasswordButton}
            >
              <Text style={styles.showPasswordText}>
                {mostrarPassword ? "Ocultar" : "Ver"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={loading}
            style={styles.forgotButton}
          >
            <Text style={styles.forgot}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.button,
                loading && styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <View style={styles.loadingButtonContent}>
                  <ActivityIndicator
                    color={palette.white}
                    size="small"
                  />

                  <Text style={styles.buttonText}>
                    Iniciando sesión...
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  Iniciar sesión
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.securityRow}>
            <View style={styles.securityDot} />

            <Text style={styles.securityText}>
              Conexión segura
            </Text>
          </View>

          <Text style={styles.footer}>
            © 2026 TuRestaurante.com
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 32,
  },

  brandArea: {
    alignItems: "center",
    marginBottom: 24,
  },

  logoOuter: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },

  logoInner: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: palette.light,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: palette.white,
  },

  logoIcon: {
    fontSize: 34,
  },

  brandName: {
    color: palette.white,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  brandSubtitle: {
    color: "#D7EFED",
    fontSize: 13,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 300,
    lineHeight: 19,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: palette.surface,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 22,
    elevation: 12,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    overflow: "hidden",
  },

  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: palette.accent,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: palette.dark,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    color: palette.gray,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 25,
  },

  inputLabel: {
    alignSelf: "flex-start",
    color: palette.primary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 17,
    width: "100%",
    minHeight: 54,
  },

  inputIconBox: {
    width: 46,
    alignItems: "center",
    justifyContent: "center",
  },

  iconInput: {
    fontSize: 17,
  },

  input: {
    flex: 1,
    paddingVertical: 13,
    paddingRight: 10,
    color: palette.text,
    fontSize: 14,
  },

  showPasswordButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  showPasswordText: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: "800",
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 20,
  },

  forgot: {
    fontSize: 12,
    color: palette.accent,
    fontWeight: "600",
  },

  buttonWrapper: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },

  button: {
    width: "100%",
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.72,
  },

  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  buttonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 8,
  },

  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  securityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.light,
    marginRight: 7,
  },

  securityText: {
    color: palette.gray,
    fontSize: 11,
  },

  footer: {
    marginTop: 17,
    fontSize: 11,
    color: palette.gray,
    textAlign: "center",
  },
});
