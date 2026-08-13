const request = require('supertest');
const app = require('../app');
const authService = require('../services/authService');
const authModel = require('../models/mysql/authModel');

// Simulamos los servicios y modelos para no tocar bases de datos reales
jest.mock('../services/authService');
jest.mock('../models/mysql/authModel');

describe('=== Pruebas Unitarias: Auth Controller ===', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {

    it('Escenario 1 (Feliz): Debería registrar un usuario correctamente', async () => {
      const mockUser = {
        id: 1,
        email: 'test@heraldev.online'
      };

      authService.registerUser.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Eduardo',
          email: 'test@heraldev.online',
          password: 'securePassword123'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty(
        'message',
        'Usuario registrado correctamente'
      );
      expect(res.body.user).toEqual(mockUser);
    });

    it('Escenario 2 (Error): Debería retornar 400 si el correo ya está duplicado', async () => {
      authService.registerUser.mockRejectedValue(
        new Error('El correo ya está registrado')
      );

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@heraldev.online'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty(
        'error',
        'El correo ya está registrado'
      );
    });

    it('Escenario 3 (XSS): Debería rechazar una entrada con payload XSS', async () => {
      authService.registerUser.mockRejectedValue(
        new Error('Datos inválidos')
      );

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: "<script>alert('XSS')</script>",
          email: 'xss@test.com',
          password: '123456'
        });

      expect(res.statusCode).toEqual(400);
    });

  });

  describe('POST /api/auth/login', () => {

    it('Escenario 1 (Feliz): Debería autenticar correctamente y guardar bitácora SUCCESS', async () => {
      const mockLoginResult = {
        token: 'mockTokenJWT',
        user: {
          id: 1,
          email: 'user@test.com'
        }
      };

      authService.loginUser.mockResolvedValue(mockLoginResult);
      authModel.registerLoginAttempt.mockResolvedValue();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'correctPassword'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.token).toBe('mockTokenJWT');

      expect(authModel.registerLoginAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
          email: 'user@test.com'
        })
      );
    });

    it('Escenario 2 (Error de Credenciales): Debería retornar 400 y registrar bitácora FAILED', async () => {
      authService.loginUser.mockRejectedValue(
        new Error('Contraseña incorrecta')
      );

      authModel.registerLoginAttempt.mockResolvedValue();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'wrongPassword'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.mensaje).toBe('Contraseña incorrecta');

      expect(authModel.registerLoginAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          reason: 'Contraseña incorrecta'
        })
      );
    });

    it('Escenario 3 (SQL Injection): Debería rechazar un payload de SQL Injection', async () => {
      authService.loginUser.mockRejectedValue(
        new Error('Credenciales inválidas')
      );

      authModel.registerLoginAttempt.mockResolvedValue();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "' OR 1=1 --",
          password: "' OR 1=1 --"
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.ok).toBe(false);
    });

  });

});

  it('Seguridad: debería incluir la cabecera Content-Security-Policy', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'correctPassword'
      });

    expect(res.headers).toHaveProperty('content-security-policy');
  });