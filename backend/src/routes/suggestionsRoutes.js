const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configurar el transportador de correo (Flexible para Gmail, Brevo, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_PORT == 465, // true para 465, false para otros
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Optimización para Vercel (evita que la función se cierre antes de enviar)
  timeout: 10000 
});

// POST /api/suggestions - Recibir sugerencia de receta y enviar correo
router.post('/', async (req, res) => {
  console.log('📩 Solicitud recibida en /api/suggestions');
  try {
    const { recipeName, region, province, ingredients, instructions, description, userEmail } = req.body;
    console.log('📝 Datos:', { recipeName, userEmail });

    // Validar datos
    if (!recipeName || !region || !province || !ingredients || !instructions || !description || !userEmail) {
      console.log('❌ Validación fallida');
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Crear el contenido del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Se envía a ti mismo (administrador)
      subject: `Nueva Sugerencia de Receta: ${recipeName}`,
      html: `
        <h2>Nueva Sugerencia de Receta</h2>
        <p><strong>Enviado por:</strong> ${userEmail}</p>
        <hr>
        <h3>📋 Detalles de la Receta</h3>
        <p><strong>Nombre:</strong> ${recipeName}</p>
        <p><strong>Región:</strong> ${region}</p>
        <p><strong>Provincia:</strong> ${province}</p>
        
        <h3>📝 Descripción</h3>
        <p>${description}</p>
        
        <h3>🥘 Ingredientes</h3>
        <pre>${ingredients}</pre>
        
        <h3>👨‍🍳 Instrucciones</h3>
        <pre>${instructions}</pre>
        
        <hr>
        <p style="color: #666; font-size: 12px;">Este correo fue enviado desde el formulario de sugerencias de Legado Culinario Ecuador</p>
      `
    };

    console.log('📧 Enviando correo...');
    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado con éxito:', info.messageId);

    res.status(200).json({ message: 'Sugerencia enviada exitosamente' });
  } catch (error) {
    console.error('❌ Error al enviar sugerencia:', error);
    res.status(500).json({ error: 'Error al procesar la sugerencia' });
  }
});

module.exports = router;
