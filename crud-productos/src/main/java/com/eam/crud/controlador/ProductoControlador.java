package com.eam.crud.controlador;

import com.eam.crud.modelo.Producto;
import com.eam.crud.servicio.ProductoServicio;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
public class ProductoControlador {

    private final ProductoServicio servicio;

    public ProductoControlador(ProductoServicio servicio) {
        this.servicio = servicio;
    }

    /** GET /api/productos?q=texto  -> listar y buscar */
    @GetMapping
    public List<Producto> listar(@RequestParam(name = "q", required = false) String q) {
        return servicio.listar(q);
    }

    /** GET /api/productos/5 -> traer uno */
    @GetMapping("/{id}")
    public Producto obtener(@PathVariable Long id) {
        return servicio.obtener(id);
    }

    /** POST /api/productos -> guardar */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Producto guardar(@Valid @RequestBody Producto producto) {
        return servicio.guardar(producto);
    }

    /** PUT /api/productos/5 -> actualizar */
    @PutMapping("/{id}")
    public Producto actualizar(@PathVariable Long id, @Valid @RequestBody Producto producto) {
        return servicio.actualizar(id, producto);
    }

    /** DELETE /api/productos/5 -> eliminar */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        servicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    /** Devuelve los errores de validación campo por campo. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> erroresDeValidacion(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errores.put(e.getField(), e.getDefaultMessage()));
        return errores;
    }
}
