const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

// Límite de 3 sugerencias por hora por IP
const sugerenciaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Has alcanzado el límite de sugerencias. Intenta de nuevo en una hora.' }
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  timeout: 10000
});

const REGION_MAP = {
  costa: '🌊 Costa',
  sierra: '⛰️ Sierra',
  oriente: '🌳 Oriente',
  insular: '🏝️ Insular'
};

function escapeHtml(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const EMAIL_TEMPLATE = (data) => {
  const { recipeName, region, province, ingredients, instructions, description, userEmail } = data;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Encabezado -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);border-radius:16px 16px 0 0;padding:32px 30px 24px;text-align:center;">
              <div style="font-size:42px;margin-bottom:8px;">🍽️</div>
              <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0 0 4px;">Legado Culinario</h1>
              <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">Nueva sugerencia de receta</p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="background:#141829;padding:30px;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">

              <!-- Remitente -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,152,0,0.08);border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1px solid rgba(255,152,0,0.15);">
                <tr>
                  <td style="color:rgba(255,255,255,0.4);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;">Enviado por</td>
                </tr>
                <tr>
                  <td style="color:#FF9800;font-size:16px;font-weight:700;">${escapeHtml(userEmail)}</td>
                </tr>
              </table>

              <!-- Detalles -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:12px;">📋 Detalles de la Receta</td>
                </tr>
                <tr>
                  <td width="100" style="color:rgba(255,255,255,0.5);font-size:13px;padding:6px 0;">Nombre</td>
                  <td style="color:#ffffff;font-size:15px;font-weight:600;padding:6px 0;">${escapeHtml(recipeName)}</td>
                </tr>
                <tr>
                  <td style="color:rgba(255,255,255,0.5);font-size:13px;padding:6px 0;">Región</td>
                  <td style="color:#ffffff;font-size:14px;padding:6px 0;">${REGION_MAP[region] || escapeHtml(region)}</td>
                </tr>
                <tr>
                  <td style="color:rgba(255,255,255,0.5);font-size:13px;padding:6px 0;">Provincia</td>
                  <td style="color:#ffffff;font-size:14px;padding:6px 0;">${escapeHtml(province)}</td>
                </tr>
              </table>

              <!-- Descripción -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:8px;">📝 Descripción</td>
                </tr>
                <tr>
                  <td style="color:rgba(255,255,255,0.8);font-size:14px;line-height:1.6;background:rgba(255,255,255,0.03);border-radius:10px;padding:14px 18px;border:1px solid rgba(255,255,255,0.06);">${escapeHtml(description).replace(/\\n/g, '<br>')}</td>
                </tr>
              </table>

              <!-- Ingredientes -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:8px;">🥘 Ingredientes</td>
                </tr>
                <tr>
                  <td style="color:#e0e0e0;font-size:13px;line-height:1.7;background:rgba(0,0,0,0.2);border-radius:10px;padding:14px 18px;font-family:'SF Mono','Menlo','Monaco',monospace;border:1px solid rgba(255,255,255,0.06);white-space:pre-wrap;">${escapeHtml(ingredients)}</td>
                </tr>
              </table>

              <!-- Instrucciones -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:8px;">👨‍🍳 Instrucciones</td>
                </tr>
                <tr>
                  <td style="color:#e0e0e0;font-size:13px;line-height:1.7;background:rgba(0,0,0,0.2);border-radius:10px;padding:14px 18px;font-family:'SF Mono','Menlo','Monaco',monospace;border:1px solid rgba(255,255,255,0.06);white-space:pre-wrap;">${escapeHtml(instructions)}</td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d1117;border-radius:0 0 16px 16px;padding:20px 30px;text-align:center;border:1px solid rgba(255,255,255,0.06);border-top:none;">
              <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">
                Legado Culinario Ecuador · Recetas tradicionales por regiones
              </p>
              <p style="color:rgba(255,255,255,0.15);font-size:10px;margin:4px 0 0;">
                Este correo se envió desde el formulario de sugerencias
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

router.post('/', sugerenciaLimiter, async (req, res) => {
  try {
    const { recipeName, region, province, ingredients, instructions, description, userEmail, _hp } = req.body;

    // Honeypot: si está lleno, es un bot
    if (_hp) {
      return res.status(200).json({ message: 'Sugerencia enviada exitosamente' });
    }

    if (!recipeName || !region || !province || !ingredients || !instructions || !description || !userEmail) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const mailOptions = {
      from: `"Legado Culinario" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `🍽️ Nueva sugerencia: ${recipeName}`,
      html: EMAIL_TEMPLATE({ recipeName, region, province, ingredients, instructions, description, userEmail })
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Sugerencia enviada exitosamente' });
  } catch (error) {
    console.error('Error al enviar sugerencia:', error);
    res.status(500).json({ error: 'Error al procesar la sugerencia' });
  }
});

module.exports = router;
