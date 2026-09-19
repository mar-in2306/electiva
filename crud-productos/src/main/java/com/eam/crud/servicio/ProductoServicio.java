package com.eam.crud.servicio;

import com.eam.crud.modelo.Producto;
import com.eam.crud.repositorio.ProductoRepositorio;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
public class ProductoServicio {

    private final ProductoRepositorio repositorio;

    public ProductoServicio(ProductoRepositorio repositorio) {
        this.repositorio = repositorio;
    }

    /** Listar todo o filtrar si viene texto de búsqueda. */
    public List<Producto> listar(String texto) {
        if (texto == null || texto.isBlank()) {
            return repositorio.findAll(Sort.by(Sort.Direction.DESC, "id"));
        }
        return repositorio.buscar(texto.trim());
    }

    public Producto obtener(Long id) {
        return repositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No existe el producto con id " + id));
    }

    public Producto guardar(Producto producto) {
        producto.setId(null); // asegura que sea inserción
        return repositorio.save(producto);
    }

    public Producto actualizar(Long id, Producto datos) {
        Producto actual = obtener(id);
        actual.setNombre(datos.getNombre());
        actual.setCategoria(datos.getCategoria());
        actual.setPrecio(datos.getPrecio());
        actual.setCantidad(datos.getCantidad());
        return repositorio.save(actual);
    }

    public void eliminar(Long id) {
        if (!repositorio.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "No existe el producto con id " + id);
        }
        repositorio.deleteById(id);
    }
}
