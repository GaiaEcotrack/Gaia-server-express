# Servidor Express Gaia

Este proyecto es un servidor backend desarrollado con Node.js, Express y MongoDB. La aplicación sigue una estructura modular para facilitar la escalabilidad y el mantenimiento.

## Tabla de Contenidos
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Dependencias](#dependencias)
- [Contribución](#contribución)
- [Licencia](#licencia)

## Instalación
Para comenzar con este proyecto, sigue estos pasos:

1. Clona el repositorio:
    ```bash
    git clone https://github.com/tu-usuario/server-express-gaia.git
    ```
   Usa el código con precaución.

2. Instala las dependencias:
    ```bash
    cd server-express-gaia
    npm install
    ```
   Usa el código con precaución.

## Configuración
Crea un archivo `.env` en la raíz del proyecto y define las variables de entorno necesarias. Un ejemplo de archivo `.env` podría ser:

```plaintext
PORT=8080
MONGO_URI="Pedir URL"
API_HM='Pedir URL'
API_HM=
MAIN_CONTRACT_ID=
MAIN_CONTRACT_METADATA=
ADMIN_USER=
ADMIN_PASSWORD=

 ``` 
## Uso
 ```bash
 npm start
 ```

## Estructura del proyecto
```plaintext
/server-express-gaia
│
├── /config/             # Archivos de configuración
│   ├── config.js        # Configuración general
│   ├── db.js            # Configuración de la base de datos
│
├── /controllers/        # Controladores
│   ├── userController.js
│   ├── productController.js
│
├── /middlewares/        # Middlewares
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│
├── /models/             # Modelos de Mongoose
│   ├── userModel.js
│   ├── productModel.js
│
├── /routes/             # Definición de rutas
│   ├── userRoutes.js
│   ├── productRoutes.js
│
├── /services/           # Lógica de negocio adicional
│   ├── userService.js
│   ├── productService.js
│
├── /utils/              # Utilidades y funciones auxiliares
│   ├── helpers.js
│   ├── validators.js
│
├── /views/              # Plantillas de vistas (si usas un motor de plantillas como EJS, Pug, etc.)
│   ├── index.ejs
│   ├── user.ejs
│
├── /public/             # Archivos estáticos (CSS, JS, imágenes, etc.)
│   ├── css/
│   ├── js/
│   ├── images/
│
├── .env                 # Variables de entorno
├── .gitignore           # Archivos y carpetas a ignorar por Git
├── app.js               # Punto de entrada de la aplicación
├── package.json         # Dependencias y scripts de NPM
├── README.md            # Documentación del proyecto
 ```

## Dependencias
```plaintext
Este proyecto utiliza las siguientes dependencias:

express: Framework de servidor web para Node.js.
mongoose: ODM para MongoDB.
dotenv: Cargar variables de entorno desde un archivo .env.

```
