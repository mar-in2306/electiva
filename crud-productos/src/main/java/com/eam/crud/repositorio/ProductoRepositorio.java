package com.eam.crud.repositorio;

import com.eam.crud.modelo.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * JpaRepository ya trae save, findAll, findById y deleteById.
 * Solo agregamos la búsqueda por nombre o categoría.
 */
public interface ProductoRepositorio extends JpaRepository<Producto, Long> {

    @Query("""
            SELECT p FROM Producto p
            WHERE LOWER(p.nombre)    LIKE LOWER(CONCAT('%', :texto, '%'))
               OR LOWER(p.categoria) LIKE LOWER(CONCAT('%', :texto, '%'))
            ORDER BY p.id DESC
            """)
    List<Producto> buscar(@Param("texto") String texto);
}
