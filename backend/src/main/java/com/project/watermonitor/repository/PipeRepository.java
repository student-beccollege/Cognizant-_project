package com.project.watermonitor.repository;

import com.project.watermonitor.model.Pipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PipeRepository extends JpaRepository<Pipe, Long> {
    List<Pipe> findByUserId(Long userId);
}