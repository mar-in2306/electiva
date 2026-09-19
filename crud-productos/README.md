# CRUD de inventario — Spring Boot

Aplicación web con formulario, buscador y tabla. Los datos se guardan en una tabla
real (`PRODUCTOS`) de una base de datos H2 en archivo, así que no se pierden al
reiniciar.

## Cómo ejecutarlo

Necesitas Java 17 o superior y Maven.

```bash
cd crud-productos
mvn spring-boot:run
```

Luego abre <http://localhost:8080>.

Si usas IntelliJ o Eclipse: abre la carpeta como proyecto Maven y ejecuta
`CrudProductosApplication`.

## Ver la tabla en la base de datos

<http://localhost:8080/h2-console>

| Campo    | Valor                          |
|----------|--------------------------------|
| JDBC URL | `jdbc:h2:file:./datos/inventario` |
| Usuario  | `sa`                           |
| Clave    | (vacía)                        |

Luego: `SELECT * FROM PRODUCTOS;`

## Endpoints

| Método | Ruta                    | Qué hace              |
|--------|-------------------------|-----------------------|
| GET    | `/api/productos`        | Lista todo            |
| GET    | `/api/productos?q=texto`| Busca por nombre o categoría |
| GET    | `/api/productos/{id}`   | Trae uno              |
| POST   | `/api/productos`        | Guarda uno nuevo      |
| PUT    | `/api/productos/{id}`   | Actualiza             |
| DELETE | `/api/productos/{id}`   | Elimina               |

Ejemplo con curl:

```bash
curl -X POST http://localhost:8080/api/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Casco de seguridad","categoria":"Dotación","precio":45000,"cantidad":12}'
```

## Estructura

```
src/main/java/com/eam/crud/
├── CrudProductosApplication.java   arranque
├── modelo/Producto.java            entidad = tabla PRODUCTOS
├── repositorio/ProductoRepositorio.java   consultas
├── servicio/ProductoServicio.java  reglas del negocio
└── controlador/ProductoControlador.java   endpoints REST

src/main/resources/
├── application.properties          configuración y conexión
└── static/                         index.html, estilos.css, app.js
```

## Cambiar a MySQL

En `pom.xml` descomenta la dependencia de MySQL y en `application.properties`
comenta el bloque de H2 y descomenta el de MySQL con tus credenciales. No hay que
tocar el código Java: JPA crea la tabla sola.

## Adaptarlo a otra entidad

Renombra `Producto` y cambia sus campos (por ejemplo `Estudiante` con `nombre`,
`programa`, `semestre`). Ajusta la consulta `buscar` del repositorio, los `input`
del formulario y las columnas de la tabla en `index.html` y `app.js`.
