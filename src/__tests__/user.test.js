const request = require('supertest');
const app = require('../app');
const userService = require('../services/userService');

// Bypasseamos el middleware de validación para las pruebas de los métodos internos
jest.mock('../middlewares/usersMiddlewares', () => ({
  verificarToken: (req, res, next) => {
    req.user = { id: 10, email: 'driver@rescatevial.com' };
    next();
  }
}));

jest.mock('../services/userService');
jest.mock('../config/db', () => ({
  query: jest.fn()
}));

describe('=== Pruebas Unitarias: User Controller ===', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/user/getCarById', () => {
    it('Escenario 1 (Feliz): Debería retornar el vehículo si el id_usercar existe', async () => {
      const mockCar = { id_usercar: 5, brand_usercar: 'Toyota', model_usercar: 'Prius' };
      userService.getCarById.mockResolvedValue(mockCar);

      const res = await request(app)
        .post('/api/user/getCarById')
        .send({ id_usercar: 5 });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockCar);
    });

    it('Escenario 2 (Validación): Debería regresar 400 si falta el id_usercar', async () => {
      const res = await request(app)
        .post('/api/user/getCarById')
        .send({});

      expect(res.statusCode).toEqual(400);
expect(res.body.message).toBe('el id usercar es obligatorio');    });

    it('Escenario 3 (No encontrado): Debería regresar 404 si el vehículo no existe en el catálogo', async () => {
      userService.getCarById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/user/getCarById')
        .send({ id_usercar: 999 });

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Vehículo no encontrado');
    });
  });

  describe('POST /api/user/maintenance/recommendation', () => {
    it('Escenario 1 (Feliz): Debería retornar las sugerencias del modelo predictivo', async () => {
      const mockRecommendation = { prediction: 'Cambio de balatas y revisión climática sugerida' };
      userService.getMaintenanceRecommendation.mockResolvedValue(mockRecommendation);

      const res = await request(app)
        .post('/api/user/maintenance/recommendation')
        .send({ id_user: 10, id_usercar: 5, current_mileage: 45000 });

      expect(res.statusCode).toEqual(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.recommendation).toEqual(mockRecommendation);
    });

    it('Escenario 2 (Validación): Debería regresar 400 si el kilometraje actual no es proveído', async () => {
      const res = await request(app)
        .post('/api/user/maintenance/recommendation')
        .send({ id_user: 10, id_usercar: 5 });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('id_user, id_usercar y current_mileage son requeridos');
    });
  });
});