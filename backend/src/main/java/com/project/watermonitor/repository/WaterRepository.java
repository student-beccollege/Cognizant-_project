package com.project.watermonitor.repository;

import com.project.watermonitor.model.Waterpara;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaterRepository extends JpaRepository<Waterpara, Long> {

    // This is the specific method your Controller is looking for
    Optional<Waterpara> findFirstByPipeUserIdOrderByTimestampDesc(Long userId);

    // This is for your history/charts
    List<Waterpara> findByPipeUserIdOrderByTimestampAsc(Long userId);

    // Get the single latest reading for one specific pipe
    Optional<Waterpara> findFirstByPipeIdOrderByTimestampDesc(Long pipeId);

    // Get all readings for one specific pipe, oldest first (for chart history)
    List<Waterpara> findByPipeIdOrderByTimestampAsc(Long pipeId);
}