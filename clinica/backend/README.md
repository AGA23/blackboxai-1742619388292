# Clínica de Ozonoterapia - Backend

Backend para el sistema de gestión de citas médicas y expedientes clínicos.

## Requisitos

- Node.js >= 14.0.0
- PostgreSQL >= 12
- npm >= 6.14.0

## Tecnologías Principales

- Express.js - Framework web
- Sequelize - ORM para PostgreSQL
- JWT - Autenticación y autorización
- Jest - Testing
- ESLint/Prettier - Linting y formateo de código

## Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd clinica/backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con las configuraciones apropiadas
```

4. Crear base de datos:
```bash
createdb clinica_db
```

5. Ejecutar migraciones:
```bash
npm run db:migrate
```

## Estructura del Proyecto

```
src/
├── config/         # Configuraciones (database, etc.)
├── controllers/    # Controladores de rutas
├── middleware/     # Middleware personalizado
├── models/         # Modelos de Sequelize
├── routes/         # Definiciones de rutas
├── services/       # Servicios de negocio
├── tests/          # Tests
├── app.js         # Configuración de Express
└── server.js      # Punto de entrada
```

## Scripts Disponibles

- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor en modo desarrollo con hot-reload
- `npm test` - Ejecuta los tests
- `npm run test:watch` - Ejecuta los tests en modo watch
- `npm run test:coverage` - Genera reporte de cobertura
- `npm run lint` - Ejecuta ESLint
- `npm run lint:fix` - Corrige errores de ESLint

## API Endpoints

### Autenticación

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Obtener perfil de usuario
- `PATCH /api/auth/profile` - Actualizar perfil
- `POST /api/auth/change-password` - Cambiar contraseña

### Citas

- `POST /api/appointments` - Crear cita
- `GET /api/appointments` - Listar citas
- `GET /api/appointments/:id` - Obtener cita específica
- `PATCH /api/appointments/:id` - Actualizar cita
- `DELETE /api/appointments/:id` - Cancelar cita

### Historial Médico

- `POST /api/medical-history` - Crear registro médico
- `GET /api/medical-history/patient/:patientId` - Obtener historial de paciente
- `GET /api/medical-history/:id` - Obtener registro específico
- `PATCH /api/medical-history/:id` - Actualizar registro

### Sucursales

- `POST /api/branches` - Crear sucursal
- `GET /api/branches` - Listar sucursales
- `GET /api/branches/:id` - Obtener sucursal específica
- `PATCH /api/branches/:id` - Actualizar sucursal
- `POST /api/branches/:id/doctors` - Asignar doctor a sucursal

## Autenticación

La API utiliza JWT para autenticación. Incluir el token en el header:

```
Authorization: Bearer <token>
```

## Manejo de Errores

La API retorna errores en el siguiente formato:

```json
{
  "status": "error",
  "message": "Descripción del error",
  "errors": [
    {
      "field": "campo",
      "message": "mensaje de error"
    }
  ]
}
```

## Tests

Los tests están organizados en:

- Unit tests
- Integration tests
- E2E tests

Para ejecutar los tests:

```bash
# Todos los tests
npm test

# Con coverage
npm run test:coverage

# En modo watch
npm run test:watch
```

## Contribución

1. Crear branch: `feature/nombre-feature` o `fix/nombre-fix`
2. Commit cambios: `git commit -m 'feat: descripción'`
3. Push al branch: `git push origin feature/nombre-feature`
4. Crear Pull Request

## Licencia

ISC