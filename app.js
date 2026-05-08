import express from 'express';
const app = express();
import router from './routes/router.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RTO Backend API',
      version: '1.0.0',
      description: 'Backend API for RTO questionary with multiple Countries and multiple supportive languages',
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(express.json());

app.use('/api/v1', router);

export default app;

