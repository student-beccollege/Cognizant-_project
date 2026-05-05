package com.project.watermonitor.repository;

import com.project.watermonitor.model.Pipes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PipeRepository extends JpaRepository<Pipes, Long> {
    // Finds all pipes belonging to a specific user
    List<Pipes> findByUserId(Long userId);
}