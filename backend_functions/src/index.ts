/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });import * as functions from "firebase-functions";
import * as functions from "firebase-functions/v2"; // Asegúrate de usar la versión v2
import * as nodemailer from "nodemailer";

// Configura el transportador de nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // Usa el servicio de correo que prefieras
  auth: {
    user: "centrooratoriasanjosedonbosco@gmail.com", // Tu correo
    pass: "centrodeoratoriasanjose123", // Contraseña o App Password
  },
});

// Función para enviar correos
export const enviarCorreoAsistencias = functions.https.onCall(async (data: any, context) => {
  const { asunto, mensaje, email } = data;

  const mailOptions = {
    from: 'centrooratoriasanjosedonbosco@gmail.com',
    to: email,
    subject: asunto,
    text: mensaje,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Correo enviado correctamente." };
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    return { success: false, message: "Error al enviar el correo." };
  }
});
