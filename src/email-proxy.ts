import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.EMAIL_PROXY_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Brevo Email Proxy' });
});

// Email sending endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, projectType, message } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email, message' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      return res.status(500).json({ 
        error: 'Brevo API key not configured. Please add BREVO_API_KEY to your .env file' 
      });
    }

    const emailData = {
      sender: {
        name: `${firstName} ${lastName}`,
        email: email
      },
      to: [{
        email: process.env.RECEIVER_EMAIL || 'rohitraa45@gmail.com',
        name: 'Rohit Singh'
      }],
      subject: `Portfolio Contact: ${projectType || 'New Message'}`,
      htmlContent: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Project Type:</strong> ${projectType || 'Not specified'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      textContent: `
        New Contact Form Submission
        
        Name: ${firstName} ${lastName}
        Email: ${email}
        Phone: ${phone || 'Not provided'}
        Project Type: ${projectType || 'Not specified'}
        
        Message:
        ${message}
      `
    };

    // Send email via Brevo API
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      }
    });

    console.log('Email sent successfully:', response.data);
    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: response.data.messageId 
    });

  } catch (error: any) {
    console.error('Email send failed:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      res.status(400).json({ 
        error: 'Invalid request data', 
        details: error.response.data 
      });
    } else if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'Invalid Brevo API key' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send email', 
        details: error.message 
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Email proxy server running on http://localhost:${PORT}`);
  console.log(`📧 Brevo API Key: ${process.env.BREVO_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`📬 Receiver Email: ${process.env.RECEIVER_EMAIL || 'rohitraa45@gmail.com'}`);
});
